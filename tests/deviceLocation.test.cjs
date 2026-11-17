const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transformFileSync } = require('@babel/core');
const load = require('./helpers/loadSource.cjs');
const locationUtils = load('src/utils/location.js');
const code = transformFileSync('src/hooks/useDeviceLocation.js', {
  configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;

// Executa o fluxo do hook com fronteiras nativas e relógio controlados.
// Não substitui a montagem React nem o teste de permissões no aparelho.
function setup(overrides = {}, platform = 'android') {
  const states = [], fields = { city: 'São Paulo', state: 'SP' }, calls = [];
  let cleanup, timer;
  const native = {
    Accuracy: { Balanced: 3 },
    requestForegroundPermissionsAsync: async () => ({ granted: true }),
    hasServicesEnabledAsync: async () => true,
    getCurrentPositionAsync: async () => ({ coords: { latitude: -16.68, longitude: -49.25 } }),
    reverseGeocodeAsync: async () => [{ city: 'Goiânia', region: 'GO', isoCountryCode: 'BR' }],
    ...overrides,
  };
  for (const key of Object.keys(native)) {
    if (typeof native[key] !== 'function') continue;
    const fn = native[key];
    native[key] = (...args) => { calls.push(key); return fn(...args); };
  }
  const deps = {
    react: {
      useState: (initial) => { const i = states.length; states.push(initial); return [initial, v => { states[i] = v; }]; },
      useRef: value => ({ current: value }),
      useEffect: fn => { cleanup = fn(); },
    },
    'react-native': { Platform: { OS: platform }, AccessibilityInfo: { announceForAccessibility() {} } },
    'expo-location': native,
    '../utils/location': locationUtils,
  };
  const module = { exports: {} };
  new Function('module', 'exports', 'require', 'setTimeout', 'clearTimeout', code)(
    module, module.exports, name => deps[name], fn => { timer = fn; return 1; }, () => { timer = null; },
  );
  const hook = module.exports.default(v => { fields.city = v; }, v => { fields.state = v; });
  return { run: hook.useCurrentLocation, states, fields, calls, unmount: () => cleanup(), expire: () => timer() };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('localização real preenche ambos os campos e encerra carregamento', async () => {
  const h = setup(); await h.run();
  assert.deepEqual(h.fields, { city: 'Goiânia', state: 'GO' });
  assert.equal(h.states[0], false); assert.match(h.states[1], /Localização preenchida/);
  assert.deepEqual(h.calls, ['requestForegroundPermissionsAsync', 'hasServicesEnabledAsync', 'getCurrentPositionAsync', 'reverseGeocodeAsync']);
});
test('negação e bloqueio não consultam posição nem alteram campos', async () => {
  for (const canAskAgain of [true, false]) {
    const h = setup({ requestForegroundPermissionsAsync: async () => ({ granted: false, canAskAgain }) });
    await h.run(); assert.equal(h.calls.length, 1);
    assert.match(h.states[1], canAskAgain ? /negada/ : /bloqueada/);
    assert.deepEqual(h.fields, { city: 'São Paulo', state: 'SP' });
  }
});
test('GPS desativado e plataforma web mantêm entrada manual', async () => {
  const h = setup({ hasServicesEnabledAsync: async () => false }); await h.run();
  assert.match(h.states[1], /desativada/); assert.equal(h.calls.includes('getCurrentPositionAsync'), false);
  const web = setup({}, 'web'); await web.run(); assert.equal(web.calls.length, 0); assert.match(web.states[1], /celular/);
});
test('endereço parcial limpa campo antigo e endereço ausente preserva entrada', async () => {
  const partial = setup({ reverseGeocodeAsync: async () => [{ region: 'GO' }] }); await partial.run();
  assert.deepEqual(partial.fields, { city: '', state: 'GO' }); assert.match(partial.states[1], /complete/);
  const empty = setup({ reverseGeocodeAsync: async () => [] }); await empty.run();
  assert.deepEqual(empty.fields, { city: 'São Paulo', state: 'SP' }); assert.match(empty.states[1], /não retornou/);
});
test('falhas na posição e no geocodificador liberam nova tentativa', async () => {
  for (const method of ['getCurrentPositionAsync', 'reverseGeocodeAsync']) {
    const h = setup({ [method]: async () => { throw new Error('offline'); } });
    await h.run(); assert.equal(h.states[0], false);
    assert.match(h.states[1], method === 'reverseGeocodeAsync' ? /consulta do endereço/ : /obter sua posição/);
    await h.run(); assert.equal(h.calls.filter(c => c === method).length, 2);
  }
});
test('toques repetidos não duplicam consulta e desmontagem ignora resultado', async () => {
  let resolve;
  const h = setup({ getCurrentPositionAsync: () => new Promise(r => { resolve = r; }) });
  const pending = h.run(); await tick(); await h.run();
  assert.equal(h.calls.filter(c => c === 'getCurrentPositionAsync').length, 1);
  h.unmount(); resolve({ coords: {} }); await pending;
  assert.equal(h.calls.includes('reverseGeocodeAsync'), false);
  assert.deepEqual(h.fields, { city: 'São Paulo', state: 'SP' });
});
test('timeout cobre serviço e posição e impede geocodificação tardia', async () => {
  for (const method of ['hasServicesEnabledAsync', 'getCurrentPositionAsync', 'reverseGeocodeAsync']) {
    let resolve;
    const h = setup({ [method]: () => new Promise(r => { resolve = r; }) });
    const pending = h.run(); await tick(); h.expire(); await pending;
    assert.equal(h.states[0], false);
    resolve(method === 'hasServicesEnabledAsync' ? true : method === 'getCurrentPositionAsync' ? { coords: {} } : [{ city: 'Goiânia', region: 'GO' }]);
    await tick(); assert.deepEqual(h.fields, { city: 'São Paulo', state: 'SP' });
    if (method !== 'reverseGeocodeAsync') assert.equal(h.calls.includes('reverseGeocodeAsync'), false);
  }
});
