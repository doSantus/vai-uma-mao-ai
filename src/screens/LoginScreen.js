
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import SegmentedControl from '../components/SegmentedControl';
import { colors, spacing, typography } from '../theme';

export default function LoginScreen({ navigation }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('cliente');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  function handleSubmit() {
    const newErrors = {};
    if (mode === 'register' && !name.trim()) newErrors.name = 'Informe seu nome';
    if (!email.trim()) newErrors.email = 'Informe seu e-mail';
    if (!password.trim()) newErrors.password = 'Informe sua senha';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
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

      <Text style={styles.sectionLabel}>Eu sou:</Text>
      <SegmentedControl
        options={[
          { label: 'Cliente', value: 'cliente' },
          { label: 'Prestador', value: 'prestador' },
        ]}
        selected={role}
        onSelect={setRole}
      />

      {mode === 'register' && (
        <Input
          label="Nome completo"
          placeholder="Como podemos te chamar?"
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

      <Button title={mode === 'login' ? 'Entrar' : 'Criar conta'} onPress={handleSubmit} style={styles.submitButton} />

      <Text style={styles.disclaimer}>
        Etapa 02: tela funcional apenas na camada visual, sem autenticação real.
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
  sectionLabel: { ...typography.small, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  submitButton: { marginTop: spacing.sm },
  disclaimer: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
