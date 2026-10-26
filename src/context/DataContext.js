import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, AppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { supabase, isConfigured } from '../services/supabase';
import { createAuthService } from '../services/authService';
import { signInWithGoogle, handleOAuthUrl, googleAvailable } from '../services/oauth';
import { createSupabaseRepository } from '../data/supabaseRepository';
import { createPreferences } from '../data/preferences';
import { errorMessage, userError } from '../services/errors';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';

const DataContext = createContext(null);
const repository = supabase ? createSupabaseRepository(supabase) : null;
const auth = supabase ? createAuthService(supabase) : null;
const preferences = createPreferences(AsyncStorage, process.env.EXPO_PUBLIC_SUPABASE_URL || 'unconfigured');

export function DataProvider({ children }) {
  const [authSession, setAuthSession] = useState(null);
  const [starting, setStarting] = useState(true);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [known, setKnown] = useState({});
  const [recovery, setRecovery] = useState(false);
  const [revision, setRevision] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const actor = useRef(null);
  const dataRef = useRef(null);
  const request = useRef(0);
  const queue = useRef(Promise.resolve());
  const updateData = (next) => { dataRef.current = next; setData(next); };
  const remember = (providers) => setKnown((old) => ({ ...old, ...Object.fromEntries(providers.filter(Boolean).map((p) => [p.id,p])) }));

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    let eventSeen = false;
    function applySession(next) {
      if (!alive) return;
      const id = next?.user.id || null;
      if (actor.current !== id) {
        actor.current = id;
        request.current++;
        updateData(null); setKnown({}); setLoadError('');
      }
      setAuthSession(next);
      if (!next) setRecovery(false);
      setStarting(false);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      eventSeen = true;
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      applySession(session);
    });
    supabase.auth.getSession().then(({ data: result, error }) => {
      if (!alive || eventSeen) return;
      if (error) { setLoadError(errorMessage(error)); setStarting(false); }
      else applySession(result.session);
    }).catch((error) => { if (alive) { setLoadError(errorMessage(error)); setStarting(false); } });
    const refresh = (state) => state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh();
    refresh(AppState.currentState);
    const appSubscription = AppState.addEventListener('change', refresh);
    const handleLink = ({ url }) => handleOAuthUrl(url).catch((error) => Alert.alert('Não foi possível entrar', errorMessage(error)));
    const linkSubscription = Linking.addEventListener('url', handleLink);
    Linking.getInitialURL().then((url) => { if (alive && url) handleLink({ url }); }).catch(() => {});
    return () => { alive = false; subscription.unsubscribe(); appSubscription.remove(); linkSubscription.remove(); supabase.auth.stopAutoRefresh(); };
  }, []);

  async function refreshData() {
    const id = actor.current;
    if (!id) return;
    const version = ++request.current;
    setRefreshing(true);
    try {
      const next = await repository.load(id);
      if (actor.current !== id || request.current !== version) return;
      updateData(next); remember([...next.favorites, next.own]); setLoadError('');
    } catch (error) {
      if (actor.current === id && request.current === version) setLoadError(errorMessage(error));
      throw error;
    } finally { if (request.current === version) setRefreshing(false); }
  }
  useEffect(() => { if (authSession?.user.id) refreshData().catch(() => {}); }, [authSession?.user.id]);

  function mutate(operation, apply) {
    const id = actor.current;
    const run = queue.current.then(async () => {
      if (!id || actor.current !== id) throw userError('Entre novamente para alterar seus dados.');
      // Desconsidera leituras antigas que possam terminar depois da gravação.
      request.current++;
      try {
        const result = await operation(id);
        if (actor.current === id) {
          request.current++;
          apply(result); setRevision((value) => value + 1); setLoadError('');
        }
        return result;
      } finally { if (actor.current === id) setRefreshing(false); }
    });
    queue.current = run.catch(() => {});
    return run;
  }
  function saveProfile(form, publish) {
    return mutate(() => repository.saveProfile(form,publish), (own) => {
      updateData({ ...dataRef.current, own, account: { ...dataRef.current.account, onboarding_step: 'complete' } });
      remember([own]);
    });
  }
  async function signOut() {
    await auth.signOut();
    // O evento SIGNED_OUT limpa os dados de conta, sem remover preferências de outras contas.
  }

  if (!isConfigured) return <View style={styles.status}>
    <Text style={styles.title}>Conecte o Supabase</Text>
    <Text style={styles.message}>O aplicativo precisa de um projeto Supabase para funcionar. Configure a URL e a chave pública no arquivo .env e reinicie o Expo.</Text>
    <Text style={styles.message}>O passo a passo está em docs/supabase-setup.md. Nenhum login demonstrativo está ativo.</Text>
  </View>;
  if (starting || (authSession && !data && !recovery)) return <View style={styles.status}>
    {loadError ? <><Text accessibilityRole="alert" style={styles.message}>{loadError}</Text><Button title="Tentar novamente" onPress={() => refreshData().catch(() => {})} /><Button title="Sair" variant="ghost" onPress={() => signOut().catch((e) => Alert.alert('Falha ao sair',errorMessage(e)))} /></>
      : <><ActivityIndicator color={colors.primary} /><Text style={styles.message}>Carregando sua conta...</Text></>}
  </View>;

  const own = data?.own;
  return <DataContext.Provider value={{
    session: authSession ? { id: authSession.user.id, email: authSession.user.email, name: data?.account.full_name || '' } : null,
    onboarding: data?.account.onboarding_step === 'choose' || data?.account.onboarding_step === 'provider_form' ? 'choice' : 'complete',
    onboardingStep: data?.account.onboarding_step,
    profile: own?.status === 'published' ? own : null,
    providerDraft: own?.status === 'draft' ? own : null,
    providers: Object.values(known).filter((p) => p.status === 'published'),
    categories: (data?.categories || []).filter((c) => c.is_active).map((c) => c.name),
    favorites: data?.favorites || [], favoriteIds: (data?.favorites || []).map((p) => p.id),
    loadError, refreshData, refreshing, revision, preferences,
    signIn: auth.signIn, signUp: auth.signUp, verifyEmail: auth.verifyEmail, resendCode: auth.resend,
    recoverPassword: auth.recover, signOut, googleAvailable, signInWithGoogle,
    recovery,
    verifyRecovery: async (email,token) => { setRecovery(true); try { await auth.verifyRecovery(email,token); } catch (e) { setRecovery(false); throw e; } },
    updatePassword: async (password) => { await auth.updatePassword(password); setRecovery(false); },
    completeOnboarding: () => mutate(repository.completeOnboarding, (account) => updateData({ ...dataRef.current, account })),
    beginProvider: () => mutate(() => repository.beginProvider(), (draft) => {
      updateData({ ...dataRef.current, own: draft }); remember([draft]);
    }),
    saveProfile: (form) => saveProfile(form,true), saveProviderDraft: (form) => saveProfile(form,false),
    deleteProfile: () => mutate(repository.deleteProfile, () => {
      const id = dataRef.current.own?.id;
      updateData({ ...dataRef.current, own: null, favorites: dataRef.current.favorites.filter((p) => p.id !== id) });
      setKnown((old) => { const next = { ...old }; delete next[id]; return next; });
    }),
    toggleFavorite: (id) => mutate(async (userId) => {
      const enabled = !dataRef.current.favorites.some((p) => p.id === id);
      await repository.setFavorite(userId,id,enabled);
      return enabled;
    }, (enabled) => updateData({ ...dataRef.current, favorites: enabled && known[id]
      ? [...dataRef.current.favorites,known[id]] : dataRef.current.favorites.filter((p) => p.id !== id) })),
    searchProviders: async (filters,offset) => {
      const id = actor.current;
      const rows = await repository.search(filters,offset);
      if (actor.current !== id) return [];
      remember(rows); return rows;
    },
    getProvider: async (id) => {
      const userId = actor.current;
      const provider = await repository.getProvider(id);
      if (actor.current !== userId) return null;
      if (provider) remember([provider]);
      else setKnown((old) => { const next = { ...old }; delete next[id]; return next; });
      return provider;
    },
  }}>{children}</DataContext.Provider>;
}
export const useData = () => useContext(DataContext);
const styles = StyleSheet.create({
  status: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  title: { ...typography.h2, textAlign: 'center', color: colors.text },
  message: { ...typography.body, color: colors.text, textAlign: 'center', marginVertical: spacing.md },
});
