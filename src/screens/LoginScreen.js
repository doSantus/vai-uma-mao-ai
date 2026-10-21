
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useData } from '../context/DataContext';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';

export default function LoginScreen() {
  const { signIn } = useData();
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  async function handleSubmit() {
    if (pending.current) return;
    const newErrors = {};
    if (mode === 'register' && name.trim().split(/\s+/).length < 2) newErrors.name = 'Informe seu nome completo';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Informe um e-mail válido';
    if (!password.trim()) newErrors.password = 'Informe sua senha';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    pending.current = true;
    setSaving(true);
    try {
      await signIn({ email, name: mode === 'register' ? name.trim().replace(/\s+/g, ' ') : '' });
    } catch {
      Alert.alert('Não foi possível entrar', 'Não foi possível salvar sua sessão. Tente novamente.');
    } finally { pending.current = false; setSaving(false); }
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Ionicons name="hand-left" size={32} color={colors.textInverse} />
        </View>
        <Text style={styles.title}>Vai uma mão ai</Text>
        <Text style={styles.subtitle}>Encontre ou divulgue serviços na sua cidade</Text>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => setMode('login')} style={styles.tab}>
          <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Entrar</Text>
          {mode === 'login' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('register')} style={styles.tab}>
          <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Cadastrar</Text>
          {mode === 'register' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {mode === 'register' && (
        <Input
          label="Nome completo"
          placeholder="Seu nome e sobrenome"
          autoCapitalize="words"
          autoComplete="name"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />
      )}

      <Input
        label="E-mail"
        placeholder="voce@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />

      <Input
        label="Senha"
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />

      <Button title={mode === 'login' ? 'Entrar' : 'Criar conta'} loading={saving} onPress={handleSubmit} style={styles.submitButton} />

      <Text style={styles.disclaimer}>
        Acesso demonstrativo, sem autenticação real. Você continuará conectado até tocar em Sair. Sua senha não é armazenada.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  tabsRow: { flexDirection: 'row', marginBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingBottom: spacing.sm },
  tabText: { ...typography.bodyBold, color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  tabIndicator: { height: 2, backgroundColor: colors.primary, width: '60%', marginTop: 6, borderRadius: 2 },
  submitButton: { marginTop: spacing.sm },
  disclaimer: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
