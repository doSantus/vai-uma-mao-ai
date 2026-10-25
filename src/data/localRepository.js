// A chave é mantida para migrar instalações da primeira versão sem perder dados.
export const STORAGE_KEY = '@vai-uma-mao-ai/data-v1';
const normalizeEmail = (email) => email.trim().toLowerCase();
const validEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// Tipos antigos continuam legíveis para preservar as instalações existentes.
const validRole = (role) => ['conta', 'cliente', 'prestador'].includes(role);
const validModes = (modes) => modes === undefined || (Array.isArray(modes)
  && modes.every((mode) => ['No endereço do cliente', 'Em local próprio', 'Online'].includes(mode)));
const validDraft = (draft) => draft == null || (typeof draft === 'object'
  && ['name', 'city', 'state', 'phone', 'description', 'regions'].every((key) => typeof draft[key] === 'string')
  && (draft.category === null || typeof draft.category === 'string') && validModes(draft.serviceModes));

function validRecords(data) {
  const fields = ['id', 'name', 'category', 'city', 'state', 'phone', 'description'];
  return data && Array.isArray(data.favoriteIds)
    && data.favoriteIds.every((id) => typeof id === 'string')
    && (data.profile === null || (data.profile && fields.every((key) => typeof data.profile[key] === 'string')));
}

function validate(data) {
  if (!data || data.version !== 2 || !Array.isArray(data.accounts)
    || !data.accounts.every((account) => validEmail(account.email) && account.email === normalizeEmail(account.email)
      && typeof account.name === 'string' && validRole(account.role) && validRecords(account)
      && (account.onboarding === undefined || ['choice', 'complete'].includes(account.onboarding))
      && validDraft(account.providerDraft) && validModes(account.profile?.serviceModes))
    || new Set(data.accounts.map((account) => account.email)).size !== data.accounts.length
    || !(data.legacyData === null || validRecords(data.legacyData))
    || !(data.session === null || (validEmail(data.session?.email)
      && data.accounts.some((account) => account.email === data.session.email)))) {
    throw new Error('Dados locais inválidos ou de uma versão não suportada.');
  }
  return data;
}

export function createLocalRepository(storage, examples) {
  let current = null;
  let queue = Promise.resolve();
  const activeAccount = (data) => data.accounts.find((account) => account.email === data.session?.email);
  const snapshot = (data) => {
    const account = activeAccount(data);
    return {
      session: account ? { email: account.email, name: account.name, role: account.role } : null,
      profile: account?.profile || null,
      favoriteIds: account?.favoriteIds || [],
      ...(account?.onboarding ? { onboarding: account.onboarding, providerDraft: account.providerDraft || null } : {}),
    };
  };

  async function load() {
    const raw = await storage.getItem(STORAGE_KEY);
    let data = raw === null ? { version: 2, session: null, accounts: [], legacyData: null } : JSON.parse(raw);
    if (data?.version === 1 && validRecords(data)) {
      // A primeira conta que entrar recebe os registros antes sem proprietário.
      data = { version: 2, session: null, accounts: [], legacyData: { profile: data.profile, favoriteIds: data.favoriteIds } };
    }
    current = validate(data);
    return snapshot(current);
  }

  function mutate(transform) {
    const operation = queue.then(async () => {
      if (!current) throw new Error('Aguarde o carregamento dos dados.');
      const next = validate(transform(current));
      await storage.setItem(STORAGE_KEY, JSON.stringify(next));
      current = next;
      return snapshot(next);
    });
    queue = operation.catch(() => {});
    return operation;
  }

  function changeAccount(transform) {
    // Uma operação de uma tela antiga nunca deve ser aplicada a outra conta.
    const email = current?.session?.email;
    return mutate((data) => {
      if (!email || data.session?.email !== email) throw new Error('Entre novamente para alterar seus dados.');
      return { ...data, accounts: data.accounts.map((account) => account.email === email ? transform(account) : account) };
    });
  }

  return {
    load,
    signIn: ({ email, name = '', role = 'conta', onboarding }) => mutate((data) => {
      const normalized = normalizeEmail(email);
      if (!validEmail(normalized) || !validRole(role) || typeof name !== 'string') throw new Error('Informe e-mail e tipo de acesso válidos.');
      const existing = data.accounts.find((account) => account.email === normalized);
      const account = existing
        ? { ...existing, name: name.trim() || existing.name, role }
        : { email: normalized, name: name.trim(), role, ...(onboarding ? { onboarding, providerDraft: null } : {}), ...(data.legacyData || { profile: null, favoriteIds: [] }) };
      return {
        ...data, session: { email: normalized }, legacyData: null,
        accounts: [...data.accounts.filter((item) => item.email !== normalized), account],
      };
    }),
    signOut: () => mutate((data) => ({ ...data, session: null })),
    completeOnboarding: () => changeAccount((account) => ({ ...account, onboarding: 'complete' })),
    saveProviderDraft: (draft) => changeAccount((account) => ({ ...account, providerDraft: draft, onboarding: 'complete' })),
    saveProfile: (profile) => changeAccount((account) => ({
      ...account,
      ...(account.onboarding ? { onboarding: 'complete', providerDraft: null } : {}),
      profile: { ...profile, id: account.profile?.id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}` },
    })),
    deleteProfile: () => changeAccount((account) => ({
      ...account, profile: null, providerDraft: null,
      favoriteIds: account.favoriteIds.filter((id) => id !== account.profile?.id),
    })),
    toggleFavorite: (id) => changeAccount((account) => {
      const providers = [...examples, ...(account.profile ? [account.profile] : [])];
      if (!providers.some((provider) => provider.id === id)) throw new Error('Profissional não encontrado.');
      return { ...account, favoriteIds: account.favoriteIds.includes(id)
        ? account.favoriteIds.filter((favoriteId) => favoriteId !== id)
        : [...account.favoriteIds, id] };
    }),
  };
}
