const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('./helpers/loadSource.cjs');
const {createClient}=require('@supabase/supabase-js');
const {createSupabaseRepository}=load('src/data/supabaseRepository.js');
const {createAuthService}=load('src/services/authService.js');
const {createTimeoutFetch}=load('src/services/http.js');
const {errorMessage}=load('src/services/errors.js');
const {createPreferences}=load('src/data/preferences.js');
const {createOAuthCallback}=load('src/services/oauthCallback.js');

test('retorno Google aceita somente o callback esperado e troca cada código uma vez',async()=>{
  const calls=[];
  const callback=createOAuthCallback(async(code,options)=>calls.push({code,options}),'vaiumamaoai://auth/callback');
  assert.equal(await callback('https://site-externo.test/auth/callback?code=outro'),false);
  const url='vaiumamaoai://auth/callback?code=unico&sb_flow_id=12345678';
  await Promise.all([callback(url),callback(url)]);
  assert.equal(calls.length,1);assert.deepEqual(calls[0],{code:'unico',options:{flowId:'12345678'}});
  await assert.rejects(callback('vaiumamaoai://auth/callback?error=access_denied'),/não foi autorizada/);
});

test('cliente Supabase envia HTTP/JSON, filtros, autenticação e propaga erros',async()=>{
  const requests=[];
  let fail=false;
  const own={id:'provider-id',user_id:'user-id',display_name:'João',category_id:1,description:'Instalações elétricas',city:'Goiânia',state:'GO',whatsapp:'5562999990000',service_modes:['online'],service_regions:'Centro',status:'published',categories:{name:'Eletricista'}};
  const client=createClient('https://example.supabase.co','sb_publishable_test_key',{accessToken:async()=>'test-access-token',global:{fetch:async(url,options)=>{
    const request={url:new URL(url),method:options.method||'GET',headers:new Headers(options.headers),body:options.body?JSON.parse(options.body):null};requests.push(request);
    if(fail)return new Response(JSON.stringify({message:'Service unavailable'}),{status:503,headers:{'Content-Type':'application/json'}});
    let data=[];const endpoint=request.url.pathname;
    if(endpoint.endsWith('/profiles'))data={id:'user-id',full_name:'João Conta',onboarding_step:'complete'};
    if(endpoint.endsWith('/categories'))data=[{id:1,name:'Eletricista',is_active:true}];
    if(endpoint.endsWith('/providers'))data=request.method==='DELETE'?[{id:own.id}]:own;
    if(endpoint.endsWith('/search_providers'))data=[own];
    if(endpoint.endsWith('/save_provider')||endpoint.endsWith('/begin_provider'))data=own;
    return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
  }}});
  const repo=createSupabaseRepository(client);
  const data=await repo.load('user-id');
  assert.equal(data.own.category,'Eletricista');assert.deepEqual(data.own.serviceModes,['Online']);
  const rows=await repo.search({search:'João',city:'Goiânia',state:'GO',selectedCategory:'Eletricista'},20);
  assert.equal(rows.length,1);
  const search=requests.find(r=>r.url.pathname.endsWith('/search_providers'));
  assert.equal(search.method,'POST');assert.equal(search.body.p_offset,20);assert.equal(search.body.p_category,1);
  assert.equal(search.headers.get('Authorization'),'Bearer test-access-token');
  await repo.saveProfile({name:'João',category:'Eletricista',description:'Instalações',city:'Goiânia',state:'go',phone:'55 (62) 99999-0000',serviceModes:['Online'],regions:'Centro'},true);
  const saved=requests.find(r=>r.url.pathname.endsWith('/save_provider'));
  assert.equal(saved.body.p_publish,true);assert.equal(saved.body.p_data.whatsapp,'5562999990000');
  assert.equal(saved.body.p_data.state,'GO');assert.deepEqual(saved.body.p_data.service_modes,['online']);
  await repo.completeOnboarding('user-id');assert.ok(requests.some(r=>r.method==='PATCH'&&r.body.onboarding_step==='complete'));
  await repo.deleteProfile('user-id');assert.ok(requests.some(r=>r.method==='DELETE'&&r.url.searchParams.get('user_id')==='eq.user-id'));
  fail=true;await assert.rejects(repo.search({search:'',city:'',state:'',selectedCategory:''}),/Service unavailable/);
});

test('autenticação usa senha real, código do servidor e tipos distintos de confirmação e recuperação',async()=>{
  const calls=[];
  const auth=new Proxy({}, {get:(_,method)=>async(args)=>{calls.push({method,args});return {data:{session:null},error:null};}});
  const service=createAuthService({auth});
  await service.signUp({email:' JOAO@EXAMPLE.COM ',password:'secret-value',name:'João  Silva'});
  await service.signIn({email:'JOAO@EXAMPLE.COM',password:'secret-value'});
  await service.verifyEmail('JOAO@example.com','987654');
  await service.resend('joao@example.com');
  await service.recover('joao@example.com');
  await service.verifyRecovery('joao@example.com','246810');
  await service.updatePassword('nova-senha');
  assert.equal(calls[0].args.email,'joao@example.com');assert.equal(calls[0].args.options.data.full_name,'João Silva');
  assert.equal(calls[1].args.password,'secret-value');
  assert.equal(calls[2].args.type,'email');assert.equal(calls[2].args.token,'987654');
  assert.equal(calls[5].args.type,'recovery');
  assert.equal(calls[6].method,'updateUser');
  const rejecting=createAuthService({auth:{verifyOtp:async()=>({error:{code:'otp_expired'}})}});
  await assert.rejects(rejecting.verifyEmail('joao@example.com','123456'),e=>e.code==='otp_expired');
});

test('cadastro não trata usuário ofuscado como conta nova e preserva erros de duplicidade',async()=>{
  const credentials={email:'pessoa@example.com',password:'senha-forte',name:'Pessoa Teste'};
  const serviceFor=(data,error=null)=>createAuthService({auth:{signUp:async()=>({data,error})}});
  await assert.rejects(serviceFor({session:null,user:{identities:[]}}).signUp(credentials),e=>/entre ou use/.test(errorMessage(e)));
  const created={session:null,user:{id:'new-user',identities:[{provider:'email'}]}};
  assert.deepEqual(await serviceFor(created).signUp(credentials),created);
  await assert.rejects(serviceFor(null,{code:'user_already_exists'}).signUp(credentials),e=>/Já existe uma conta/.test(errorMessage(e)));
});

test('timeout e cancelamento não deixam chamadas penduradas',async()=>{
  const fetcher=(_url,{signal})=>new Promise((_,reject)=>{
    const abort=()=>reject(Object.assign(new Error('timeout'),{name:'AbortError'}));
    if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});
  });
  await assert.rejects(createTimeoutFetch(fetcher,10)('https://example.com'),{name:'AbortError'});
  const controller=new AbortController();controller.abort();
  await assert.rejects(createTimeoutFetch(fetcher,1000)('https://example.com',{signal:controller.signal}),{name:'AbortError'});
});

test('erros têm mensagens úteis sem expor detalhes internos',()=>{
  assert.match(errorMessage({status:429}),/limite/);
  assert.match(errorMessage({code:'42501'}),/permissão/);
  assert.match(errorMessage({status:503}),/indisponível/);
  assert.match(errorMessage({code:'invalid_credentials'}),/incorretos/);
  assert.doesNotMatch(errorMessage({message:'postgres://segredo'}),/segredo/);
});

test('preferências JSON sobrevivem à reabertura e são separadas por projeto e UUID',async()=>{
  const values=new Map();const storage={getItem:async k=>values.get(k)||null,setItem:async(k,v)=>values.set(k,v),removeItem:async k=>values.delete(k)};
  let prefs=createPreferences(storage,'project-a');
  await prefs.write('uid-a',{city:'Goiânia',state:'GO'});
  prefs=createPreferences(storage,'project-a');assert.equal((await prefs.read('uid-a')).city,'Goiânia');
  assert.deepEqual(await prefs.read('uid-b'),{});
  assert.deepEqual(await createPreferences(storage,'project-b').read('uid-a'),{});
  await prefs.clear('uid-a');assert.deepEqual(await prefs.read('uid-a'),{});
});
