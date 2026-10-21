const { test } = require('node:test');
const assert = require('node:assert/strict');
const { transformFileSync } = require('@babel/core');
const path = require('node:path');
function load(file, dependencies = {}) {
  const code = transformFileSync(path.join(__dirname, file), {
    configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', code)(module, module.exports, (name) => dependencies[name]);
  return module.exports;
}
const search = load('../src/utils/search.js');
const { stateToUF, addressParts, addressToLocation, resolveAddresses } = load('../src/utils/location.js', { './search': search });

test('normaliza formatos de estado retornados pelo geocodificador', () => {
  for (const value of ['São Paulo', 'SP', 'State of São Paulo', 'Estado de São Paulo', 'São Paulo State', 'BR-SP']) {
    assert.equal(stateToUF(value), 'SP');
  }
  assert.equal(stateToUF('Estado do Rio de Janeiro'), 'RJ');
  assert.equal(stateToUF('Goias'), 'GO');
  assert.equal(stateToUF(null), '');
  assert.equal(stateToUF('desconhecido'), '');
});
test('aceita município em subregion quando city está ausente', () => {
  assert.deepEqual(addressToLocation({ city: null, subregion: 'Goiânia', region: 'State of Goiás', isoCountryCode: 'br' }), { city: 'Goiânia', state: 'GO' });
  assert.equal(addressParts({ city: 'Trindade', subregion: 'Outra cidade', region: 'GO' }).city, 'Trindade');
});
test('não trata bairro ou região metropolitana como município', () => {
  assert.deepEqual(addressParts({ district: 'Centro', region: 'GO' }), { city: '', state: 'GO' });
  assert.deepEqual(addressParts({ subregion: 'Região Metropolitana de Goiânia', region: 'GO' }), { city: '', state: 'GO' });
  assert.equal(addressToLocation({ district: 'Centro', region: 'GO' }), null);
});
test('prioriza endereço completo e preserva campos parciais sem inventar valores', () => {
  assert.deepEqual(resolveAddresses([{ region: 'GO' }, { city: 'Goiânia', region: 'GO' }]), { city: 'Goiânia', state: 'GO' });
  assert.deepEqual(resolveAddresses([{ region: 'GO' }]), { city: '', state: 'GO' });
  assert.deepEqual(resolveAddresses([{ city: 'Goiânia' }]), { city: 'Goiânia', state: '' });
  assert.equal(resolveAddresses([]), null);
  assert.equal(resolveAddresses(null), null);
  assert.equal(addressParts({ city: 'Paris', region: 'SP', isoCountryCode: 'FR' }), null);
});
