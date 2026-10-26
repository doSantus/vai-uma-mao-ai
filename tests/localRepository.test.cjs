const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transformFileSync } = require('@babel/core');
const path = require('node:path');
const compiled = transformFileSync(path.join(__dirname, '../src/data/localRepository.js'), {
  configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
const loaded = { exports: {} };
new Function('module', 'exports', compiled)(loaded, loaded.exports);
const { createLocalRepository, STORAGE_KEY } = loaded.exports;
const examples = [{ id: '1', name: 'Exemplo' }, { id: '2', name: 'Outro exemplo' }];
const account = { email: 'teste@example.com', name: 'Teste', role: 'prestador' };
const profile = { name: 'João Teste', category: 'Eletricista', city: 'Goiânia', state: 'GO', phone: '5562999990000', description: 'Instalações' };

test('primeiro acesso e rascunho persistem sem publicar e ficam separados por conta', async () => {
  const f = fixture();
  let repo = f.open();
  await repo.load();
  await repo.signIn({ ...account, onboarding: 'choice' });
  repo = f.open();
  assert.equal((await repo.load()).onboarding, 'choice');
  const draft = { ...profile, category: null, regions: 'Centro', serviceModes: ['Online'] };
  await repo.saveProviderDraft(draft);
  let data = await f.open().load();
  assert.equal(data.onboarding, 'complete');
  assert.equal(data.profile, null);
  assert.deepEqual(data.providerDraft, draft);
  await repo.signOut();
  data = await repo.signIn({ email: 'outra@example.com', onboarding: 'choice' });
  assert.equal(data.providerDraft, null);
  await repo.completeOnboarding();
  await repo.signOut();
  data = await repo.signIn({ ...account, onboarding: 'choice' });
  assert.equal(data.onboarding, 'complete');
  assert.deepEqual(data.providerDraft, draft);
  await repo.saveProfile({ ...draft, category: profile.category });
  data = await f.open().load();
  assert.equal(data.providerDraft, null);
  assert.deepEqual(data.profile.serviceModes, ['Online']);
  assert.equal(data.profile.regions, 'Centro');
  await repo.deleteProfile();
  assert.equal((await f.open().load()).session.name, account.name);
});

test('falha ao salvar escolha ou rascunho preserva primeiro acesso pendente', async () => {
  const f = fixture();
  const repo = f.open();
  await repo.load();
  await repo.signIn({ ...account, onboarding: 'choice' });
  f.storage.setItem = async () => { throw new Error('falha'); };
  await assert.rejects(repo.completeOnboarding());
  await assert.rejects(repo.saveProviderDraft({ ...profile, regions: '', serviceModes: [] }));
  assert.equal((await f.open().load()).onboarding, 'choice');
});

test('conta única não exige tipo de acesso nem nome para persistir a sessão', async () => {
  const f = fixture();
  const repo = f.open();
  await repo.load();
  const data = await repo.signIn({ email: 'unica@example.com' });
  assert.deepEqual(data.session, { email: 'unica@example.com', name: '', role: 'conta' });
  await repo.toggleFavorite('1');
  assert.deepEqual((await f.open().load()).session, data.session);
});

function fixture(raw = null) {
  const values = new Map(raw === null ? [] : [[STORAGE_KEY, raw]]);
  const storage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
  };
  return { storage, values, open: () => createLocalRepository(storage, examples) };
}

test('criação, edição, favoritos e exclusão sobrevivem a novas instâncias', async () => {
  const f = fixture();
  let repo = f.open();
  assert.deepEqual(await repo.load(), { session: null, profile: null, favoriteIds: [] });
  await repo.signIn(account);
  let data = await repo.saveProfile(profile);
  const id = data.profile.id;
  await repo.toggleFavorite(id);
  await repo.toggleFavorite('1');
  repo = f.open();
  data = await repo.load();
  assert.equal(data.profile.name, 'João Teste');
  assert.deepEqual(data.favoriteIds, [id, '1']);
  await repo.saveProfile({ ...profile, description: 'Descrição editada' });
  repo = f.open();
  data = await repo.load();
  assert.equal(data.profile.id, id);
  assert.equal(data.profile.description, 'Descrição editada');
  await repo.deleteProfile();
  repo = f.open();
  data = await repo.load();
  assert.equal(data.profile, null);
  assert.deepEqual(data.favoriteIds, ['1']);
  await repo.toggleFavorite('1');
  assert.deepEqual((await f.open().load()).favoriteIds, []);
});

test('operações concorrentes preservam todos os favoritos e a ordem de escrita', async () => {
  const f = fixture();
  const repo = f.open();
  await repo.load();
  await repo.signIn(account);
  await Promise.all([repo.toggleFavorite('1'), repo.toggleFavorite('2'), repo.saveProfile(profile)]);
  assert.deepEqual((await f.open().load()).favoriteIds, ['1', '2']);
  await Promise.all([repo.toggleFavorite('1'), repo.toggleFavorite('1')]);
  assert.deepEqual((await f.open().load()).favoriteIds, ['2', '1']);
});

test('falha na escrita não altera dados e permite tentar novamente', async () => {
  const f = fixture();
  const repo = f.open();
  await repo.load();
  await repo.signIn(account);
  await repo.saveProfile(profile);
  const saved = f.values.get(STORAGE_KEY);
  const write = f.storage.setItem;
  f.storage.setItem = async () => { throw new Error('disco indisponível'); };
  await assert.rejects(repo.deleteProfile());
  await assert.rejects(repo.toggleFavorite('1'));
  assert.equal(f.values.get(STORAGE_KEY), saved);
  f.storage.setItem = write;
  const data = await repo.toggleFavorite('2');
  assert.equal(data.profile.name, profile.name);
  assert.deepEqual(data.favoriteIds, ['2']);
});

test('dados corrompidos/versão desconhecida não são sobrescritos', async () => {
  for (const raw of ['{', '{}', JSON.stringify({version: 2, profile: null, favoriteIds: []})]) {
    const f = fixture(raw);
    const repo = f.open();
    await assert.rejects(repo.load());
    await assert.rejects(repo.saveProfile(profile));
    assert.equal(f.values.get(STORAGE_KEY), raw);
  }
});

test('falha de leitura permite nova tentativa sem apagar o armazenamento', async () => {
  const f = fixture();
  const repo = f.open();
  const read = f.storage.getItem;
  f.storage.getItem = async () => { throw new Error('falha de leitura'); };
  await assert.rejects(repo.load());
  f.storage.getItem = read;
  await repo.load();
  await repo.signIn(account);
  await assert.rejects(repo.toggleFavorite('inexistente'));
  assert.deepEqual((await repo.toggleFavorite('1')).favoriteIds, ['1']);
});

test('sessão restaura e-mail, nome e modo; sair persiste sem apagar a conta', async () => {
  const f = fixture();
  let repo = f.open();
  await repo.load();
  await repo.signIn({ ...account, email: ' TESTE@EXAMPLE.COM ', password: 'nao-salvar' });
  await repo.toggleFavorite('1');
  repo = f.open();
  assert.deepEqual((await repo.load()).session, account);
  assert.ok(!f.values.get(STORAGE_KEY).includes('nao-salvar'));
  assert.ok(!f.values.get(STORAGE_KEY).includes('password'));
  await repo.signOut();
  repo = f.open();
  assert.deepEqual(await repo.load(), { session: null, profile: null, favoriteIds: [] });
  assert.deepEqual((await repo.signIn(account)).favoriteIds, ['1']);
});

test('trocar de conta separa perfil e favoritos, mantendo modo e nome da conta ativa', async () => {
  const f = fixture();
  const repo = f.open();
  await repo.load();
  await repo.signIn(account);
  await repo.saveProfile(profile);
  await repo.toggleFavorite('1');
  await repo.signOut();
  const other = { email: 'outra@example.com', name: 'Outra Pessoa', role: 'cliente' };
  let data = await repo.signIn(other);
  assert.equal(data.profile, null);
  assert.deepEqual(data.favoriteIds, []);
  await repo.toggleFavorite('2');
  data = await f.open().load();
  assert.deepEqual(data.session, other);
  assert.deepEqual(data.favoriteIds, ['2']);
  await repo.signOut();
  data = await repo.signIn({ ...account, name: '', role: 'cliente' });
  assert.equal(data.session.name, 'Teste');
  assert.equal(data.session.role, 'cliente');
  assert.equal(data.profile.name, profile.name);
  assert.deepEqual(data.favoriteIds, ['1']);
});

test('falha no login/logout preserva sessão confirmada e permite nova tentativa', async () => {
  const f = fixture();
  const repo = f.open();
  await repo.load();
  const write = f.storage.setItem;
  f.storage.setItem = async () => { throw new Error('falha'); };
  await assert.rejects(repo.signIn(account));
  assert.equal((await f.open().load()).session, null);
  f.storage.setItem = write;
  await repo.signIn(account);
  f.storage.setItem = async () => { throw new Error('falha'); };
  await assert.rejects(repo.signOut());
  assert.deepEqual((await f.open().load()).session, account);
  f.storage.setItem = write;
  await repo.signOut();
  assert.equal((await f.open().load()).session, null);
});

test('migra dados antigos apenas para a primeira conta sem perder dados em falha', async () => {
  const legacy = JSON.stringify({ version: 1, profile: { ...profile, id: 'old' }, favoriteIds: ['old', '1'] });
  const f = fixture(legacy);
  const repo = f.open();
  assert.equal((await repo.load()).session, null);
  const write = f.storage.setItem;
  f.storage.setItem = async () => { throw new Error('falha'); };
  await assert.rejects(repo.signIn(account));
  assert.equal(f.values.get(STORAGE_KEY), legacy);
  f.storage.setItem = write;
  const migrated = await repo.signIn(account);
  assert.equal(migrated.profile.id, 'old');
  assert.deepEqual(migrated.favoriteIds, ['old', '1']);
  await repo.signOut();
  const other = await repo.signIn({ ...account, email: 'outra@example.com' });
  assert.equal(other.profile, null);
  assert.deepEqual(other.favoriteIds, []);
});

test('operações antigas enfileiradas não alteram a próxima conta', async () => {
  const f = fixture();
  const repo = f.open();
  await repo.load();
  await repo.signIn(account);
  await Promise.all([repo.toggleFavorite('1'), repo.signOut()]);
  await assert.rejects(repo.toggleFavorite('2'));
  const pendingLogin = repo.signIn({ ...account, email: 'nova@example.com' });
  const staleAction = repo.saveProfile(profile);
  await pendingLogin;
  await assert.rejects(staleAction);
  assert.equal((await f.open().load()).profile, null);
});
