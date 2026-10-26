import React, { useRef, useState } from 'react';
import { Text, View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { errorMessage } from '../services/errors';
import { colors, spacing, typography } from '../theme';

export default function OnboardingScreen({ navigation }) {
  const { completeOnboarding, signOut, beginProvider } = useData();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function finish(action) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try { await action(); }
    catch (error) { Alert.alert('Não foi possível continuar', errorMessage(error)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <Screen scroll>
    <View style={styles.header}>
      <Ionicons name="briefcase-outline" size={56} color={colors.primary} />
      <Text style={styles.title}>Você é prestador de serviços?</Text>
      <Text style={styles.text}>Cadastre seus serviços para que outras pessoas encontrem você. Sua conta também permite buscar e favoritar profissionais.</Text>
    </View>
    <Button title="Sim, quero divulgar meus serviços" disabled={busy} onPress={() => finish(async () => { await beginProvider(); navigation.navigate('ProviderForm'); })} />
    <Button title="Não, quero buscar profissionais" variant="outline" loading={busy} onPress={() => finish(completeOnboarding)} style={styles.button} />
    <Text style={styles.text}>Você pode mudar de ideia depois em Perfil → Divulgar meus serviços.</Text>
    <Button title="Sair" variant="ghost" disabled={busy} onPress={() => finish(signOut)} />
  </Screen>;
}
const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  title: { ...typography.h2, textAlign: 'center', color: colors.text, marginTop: spacing.md },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.md },
  button: { marginTop: spacing.md },
});
