export const normalizeText = (value = '') => value
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function suggestCategories(categories, query) {
  const term = normalizeText(query);
  if (!term) return [];
  return categories.filter((category) => normalizeText(category).includes(term))
    .sort((a, b) => Number(normalizeText(b).startsWith(term)) - Number(normalizeText(a).startsWith(term)));
}
