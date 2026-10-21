import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLocalRepository } from '../data/localRepository';
import { mockProviders } from '../data/mockProviders';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [repository] = useState(() => createLocalRepository(AsyncStorage, mockProviders));
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registrationName, setRegistrationName] = useState(null);

  async function restore() {
    setLoading(true);
    setError(false);
    try { setData(await repository.load()); }
    catch { setError(true); }
    finally { setLoading(false); }
  }
  useEffect(() => { restore(); }, []);

  async function commit(method, ...args) {
    const next = await repository[method](...args);
    setData(next);
    return next;
  }

  async function signIn({ email, name = '' }) {
    // O nome do novo cadastro é apenas um rascunho em memória até a integração.
    // A sessão por e-mail mantém a persistência solicitada anteriormente.
    const next = await repository.signIn({ email });
    setRegistrationName({ email: next.session.email, name });
    setData(next);
  }

  async function signOut() {
    const next = await repository.signOut();
    setRegistrationName(null);
    setData(next);
  }

  if (loading || error || !data) return (
    <View style={styles.status}>
      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : <>
        <Text accessibilityRole="alert" style={styles.message}>Não foi possível recuperar os dados salvos. Seus dados não foram apagados.</Text>
        <Button title="Tentar novamente" onPress={restore} />
      </>}
      {loading && <Text style={styles.message}>Carregando seus dados...</Text>}
    </View>
  );

  const providers = [...mockProviders, ...(data.profile ? [data.profile] : [])];
  return <DataContext.Provider value={{
    session: data.session ? {
      ...data.session,
      name: registrationName?.email === data.session.email ? registrationName.name || data.session.name : data.session.name,
    } : null,
    signIn,
    signOut,
    providers, profile: data.profile, favoriteIds: data.favoriteIds,
    saveProfile: (profile) => commit('saveProfile', profile),
    deleteProfile: () => commit('deleteProfile'),
    toggleFavorite: (id) => commit('toggleFavorite', id),
  }}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
const styles = StyleSheet.create({
  status: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  message: { ...typography.body, color: colors.text, textAlign: 'center', marginVertical: spacing.md },
});
