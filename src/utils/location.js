import { normalizeText } from './search';

const states = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

export function stateToUF(value) {
  if (typeof value !== 'string') return '';
  const region = normalizeText(value)
    .replace(/^br\s*[-–]\s*/, '')
    .replace(/^(estado\s+(de|do)\s+|state\s+of\s+)/, '')
    .replace(/\s+state$/, '');
  return Object.keys(states).find((uf) => normalizeText(uf) === region || normalizeText(states[uf]) === region) || '';
}

export function addressParts(address) {
  if (!address || (address.isoCountryCode && address.isoCountryCode.trim().toUpperCase() !== 'BR')) return null;
  const state = stateToUF(address.region);
  const cityValue = typeof address.city === 'string' ? address.city.trim() : '';
  // Alguns geocodificadores Android retornam o município em subregion.
  // Não usar district (bairro) nem divisões explicitamente regionais como cidade.
  const subregion = typeof address.subregion === 'string' ? address.subregion.trim() : '';
  const regional = /^(micro|meso|regiao|regiao metropolitana|metropolitan|county)\b/.test(normalizeText(subregion))
    || /^(microrregiao|mesorregiao)\b/.test(normalizeText(subregion));
  const fallback = state && !regional && !stateToUF(subregion)
    ? subregion.replace(/^(município|municipio)\s+de\s+/i, '') : '';
  const city = cityValue || fallback;
  return city || state ? { city, state } : null;
}

// O formulário exige os dois campos; a busca permite aproveitar resultados parciais.
export function addressToLocation(address) {
  const result = addressParts(address);
  return result?.city && result?.state ? result : null;
}

export function resolveAddresses(addresses) {
  const results = (Array.isArray(addresses) ? addresses : []).map(addressParts).filter(Boolean);
  return results.find((result) => result.city && result.state) || results[0] || null;
}
