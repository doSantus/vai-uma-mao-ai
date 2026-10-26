const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

test('migração PostgreSQL: CRUD, transações, integridade e RLS entre duas contas', async (t) => {
  const db = new PGlite();
  const a='11111111-1111-4111-8111-111111111111';
  const b='22222222-2222-4222-8222-222222222222';
  const payload={display_name:'João Eletricista',category_id:1,description:'Instalações residenciais',city:'Goiânia',state:'GO',whatsapp:'5562999990000',service_modes:['at_customer'],service_regions:'Centro'};
  async function asUser(id,callback) {
    return db.transaction(async(tx)=>{
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);
      return callback(tx);
    });
  }
  try {
    // Apenas o schema Auth é simulado; tabelas, funções, constraints e RLS do app
    // são executados pelo PostgreSQL real embutido no PGlite.
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to authenticated,anon;`);
    await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/202610250001_etapa05.sql'),'utf8'));
    await db.query('insert into auth.users(id,raw_user_meta_data) values ($1,$2),($3,$4)',[a,{full_name:'João Conta'},b,{full_name:'Maria Conta'}]);
    let providerId;
    await t.test('trigger cria perfis privados; acesso anônimo é negado',async()=>{
      const result=await asUser(a,tx=>tx.query('select * from public.profiles'));
      assert.equal(result.rows.length,1);assert.equal(result.rows[0].full_name,'João Conta');
      await assert.rejects(db.transaction(async(tx)=>{await tx.exec('set local role anon');await tx.query('select * from public.providers');}));
    });
    await t.test('rascunho é privado e publicação inválida reverte toda a transação',async()=>{
      const result=await asUser(a,tx=>tx.query('select * from public.begin_provider()'));
      providerId=result.rows[0].id;
      assert.equal(result.rows[0].status,'draft');
      assert.equal((await asUser(b,tx=>tx.query('select * from public.providers'))).rows.length,0);
      await assert.rejects(asUser(a,tx=>tx.query('select public.save_provider($1,true)',[{...payload,whatsapp:'12'}])));
      const account=await asUser(a,tx=>tx.query('select onboarding_step from public.profiles'));
      assert.equal(account.rows[0].onboarding_step,'provider_form');
      await assert.rejects(asUser(b,tx=>tx.query('insert into public.favorites(user_id,provider_id) values ($1,$2)',[b,providerId])));
    });
    await t.test('publicar, consultar sem acento e editar preservam o mesmo ID',async()=>{
      const published=await asUser(a,tx=>tx.query('select * from public.save_provider($1,true)',[payload]));
      assert.equal(published.rows[0].id,providerId);
      assert.equal((await asUser(a,tx=>tx.query('select onboarding_step from public.profiles'))).rows[0].onboarding_step,'complete');
      const search=await asUser(b,tx=>tx.query("select * from public.search_providers('joao','goiania','GO',1,0,20)"));
      assert.equal(search.rows.length,1);
      await asUser(a,tx=>tx.query('select public.save_provider($1,true)',[{...payload,description:'Descrição atualizada do serviço'}]));
      assert.equal((await asUser(b,tx=>tx.query('select description from public.providers'))).rows[0].description,'Descrição atualizada do serviço');
      await assert.rejects(asUser(a,tx=>tx.query('select public.save_provider($1,false)',[payload])));
    });
    await t.test('outra conta não pode editar, excluir, transferir propriedade ou alterar categorias',async()=>{
      assert.equal((await asUser(b,tx=>tx.query("update public.providers set display_name='Invasão' where id=$1 returning id",[providerId]))).rows.length,0);
      assert.equal((await asUser(b,tx=>tx.query('delete from public.providers where id=$1 returning id',[providerId]))).rows.length,0);
      await assert.rejects(asUser(a,tx=>tx.query('update public.providers set user_id=$1 where id=$2',[b,providerId])));
      await assert.rejects(asUser(b,tx=>tx.query("update public.categories set name='Outra' where id=1")));
      await assert.rejects(asUser(b,tx=>tx.query('insert into public.providers(user_id) values($1)',[a])));
    });
    await t.test('favoritos são privados e únicos; não é possível favoritar por outra conta',async()=>{
      await asUser(b,tx=>tx.query('insert into public.favorites(user_id,provider_id) values($1,$2)',[b,providerId]));
      await assert.rejects(asUser(b,tx=>tx.query('insert into public.favorites(user_id,provider_id) values($1,$2)',[b,providerId])));
      await assert.rejects(asUser(b,tx=>tx.query('insert into public.favorites(user_id,provider_id) values($1,$2)',[a,providerId])));
      assert.equal((await asUser(a,tx=>tx.query('select * from public.favorites'))).rows.length,0);
    });
    await t.test('excluir prestador remove favoritos em cascata e preserva conta',async()=>{
      await asUser(a,tx=>tx.query('delete from public.providers where id=$1',[providerId]));
      assert.equal((await asUser(b,tx=>tx.query('select * from public.favorites'))).rows.length,0);
      assert.equal((await asUser(a,tx=>tx.query('select * from public.profiles'))).rows.length,1);
    });
  } finally {await db.close();}
});
