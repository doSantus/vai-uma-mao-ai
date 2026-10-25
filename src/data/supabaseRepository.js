import { unwrap, userError } from '../services/errors';
export const SERVICE_MODES = {
  at_customer: 'No endereço do cliente', own_location: 'Em local próprio', online: 'Online',
};
export function toProvider(row, categories = []) {
  if (!row) return null;
  return { id: row.id, userId: row.user_id, name: row.display_name,
    category: row.categories?.name || categories.find((c) => c.id === row.category_id)?.name || '',
    categoryId: row.category_id, description: row.description, city: row.city, state: row.state,
    phone: row.whatsapp, serviceModes: (row.service_modes || []).map((mode) => SERVICE_MODES[mode]).filter(Boolean),
    regions: row.service_regions, status: row.status };
}
export function toPayload(form, categories) {
  const category = categories.find((item) => item.name === form.category);
  return { display_name: form.name.trim(), category_id: category?.id || null,
    description: form.description.trim(), city: form.city.trim(), state: form.state.trim().toUpperCase(),
    whatsapp: form.phone.replace(/\D/g, ''), service_regions: (form.regions || '').trim(),
    service_modes: Object.entries(SERVICE_MODES).filter(([,label]) => form.serviceModes.includes(label)).map(([key]) => key) };
}
export function createSupabaseRepository(client) {
  let categories = [];
  const convert = (row) => toProvider(row, categories);
  async function allFavorites(userId) {
    const rows = [];
    for (let offset = 0; ; offset += 200) {
      const page = await unwrap(client.from('favorites').select('provider_id,providers(*,categories(name))')
        .eq('user_id', userId).order('provider_id').range(offset, offset + 199));
      rows.push(...page);
      if (page.length < 200) break;
    }
    return rows;
  }
  return {
    async load(userId) {
      const [account, own, cats, favorites] = await Promise.all([
        unwrap(client.from('profiles').select('*').eq('id', userId).single()),
        unwrap(client.from('providers').select('*,categories(name)').eq('user_id', userId).maybeSingle()),
        unwrap(client.from('categories').select('*').order('name')),
        allFavorites(userId),
      ]);
      categories = cats;
      return { account, own: convert(own), categories: cats,
        favorites: favorites.map((row) => convert(row.providers)).filter((p) => p?.status === 'published') };
    },
    async search(filters, offset = 0) {
      const category = categories.find((item) => item.name === filters.selectedCategory);
      const rows = await unwrap(client.rpc('search_providers', {
        p_name: filters.search.trim(), p_city: filters.city.trim(), p_state: filters.state.trim(),
        p_category: category?.id || null, p_offset: offset, p_limit: 20,
      }).select('*,categories(name)'));
      return rows.map(convert);
    },
    async getProvider(id) {
      return convert(await unwrap(client.from('providers').select('*,categories(name)').eq('id',id).maybeSingle()));
    },
    async beginProvider() { return convert(await unwrap(client.rpc('begin_provider').single())); },
    async completeOnboarding(userId) {
      return unwrap(client.from('profiles').update({ onboarding_step: 'complete' }).eq('id',userId).select().single());
    },
    async saveProfile(form, publish) {
      const payload = toPayload(form,categories);
      if (publish && !payload.category_id) throw userError('Selecione uma categoria disponível.');
      return convert(await unwrap(client.rpc('save_provider', { p_data: payload, p_publish: publish }).single()));
    },
    async deleteProfile(userId) {
      await unwrap(client.from('providers').delete().eq('user_id',userId).select('id'));
    },
    async setFavorite(userId,id,enabled) {
      if (enabled) {
        const result = await client.from('favorites').insert({ user_id: userId, provider_id: id });
        // Repetir após timeout não deve produzir um favorito duplicado.
        if (result.error && result.error.code !== '23505') throw result.error;
      } else await unwrap(client.from('favorites').delete().eq('user_id',userId).eq('provider_id',id));
    },
  };
}
