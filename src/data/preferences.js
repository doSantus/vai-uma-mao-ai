export function createPreferences(storage, namespace = 'supabase') {
  const key = (userId) => `@vai-uma-mao-ai/${namespace}/filters/${userId}`;
  return {
    async read(userId) {
      if (!userId) return {};
      const raw = await storage.getItem(key(userId));
      if (!raw) return {};
      try {
        const data = JSON.parse(raw);
        return Object.fromEntries(['search','city','state','selectedCategory'].filter((field) => typeof data?.[field] === 'string').map((field) => [field, data[field]]));
      } catch { return {}; }
    },
    write: (userId, filters) => storage.setItem(key(userId), JSON.stringify(filters)),
    clear: (userId) => storage.removeItem(key(userId)),
  };
}
