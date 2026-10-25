
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { errorMessage } from '../services/errors';
import { colors, spacing, radius, typography } from '../theme';

const menuItems = [
  { icon: 'briefcase-outline', label: 'Meu perfil de prestador', action: 'ProviderForm' },
  { icon: 'heart-outline', label: 'Favoritos', action: 'Favoritos' },
  { icon: 'notifications-outline', label: 'Notificações (em breve)' },
  { icon: 'shield-checkmark-outline', label: 'Privacidade e segurança (em breve)' },
];

export default function ProfileScreen({ navigation }) {
  const { profile, providerDraft, session, signOut, beginProvider } = useData();
  const [leaving, setLeaving] = useState(false);
  const pending = useRef(false);
  const displayName = session?.name || profile?.name || session?.email || 'Usuário';
  async function handleSignOut() {
    if (pending.current) return;
    pending.current = true;
    setLeaving(true);
    try { await signOut(); }
    catch (error) { Alert.alert('Não foi possível sair', errorMessage(error)); }
    finally { pending.current = false; setLeaving(false); }
  }
  async function openItem(item) {
    if (!item.action || pending.current) return;
    if (item.action !== 'ProviderForm' || profile || providerDraft) { navigation.navigate(item.action); return; }
    pending.current=true;setLeaving(true);
    try { await beginProvider();navigation.navigate('ProviderForm'); }
    catch(error) { Alert.alert('Não foi possível abrir o cadastro',errorMessage(error)); }
    finally {pending.current=false;setLeaving(false);}
  }
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Avatar name={displayName} size={72} />
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{session?.email}</Text>
        <Text style={styles.email}>{profile ? 'Perfil profissional publicado' : providerDraft ? 'Cadastro profissional em rascunho' : 'Você pode buscar e divulgar serviços'}</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !item.action }}
            key={item.label}
            style={[styles.menuItem, index === menuItems.length - 1 && styles.menuItemLast]}
            onPress={() => openItem(item)}
            disabled={!item.action || leaving}
          >
            <Ionicons name={item.icon} size={20} color={colors.primary} />
            <Text style={styles.menuLabel}>{item.action === 'ProviderForm' ? profile ? 'Meu perfil de prestador' : providerDraft ? 'Concluir cadastro de prestador' : 'Divulgar meus serviços' : item.label}</Text>
            {item.action && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Sair"
        variant="outline"
        loading={leaving}
        onPress={handleSignOut}
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
  name: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  email: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  menu: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: { flex: 1, ...typography.body, color: colors.text, marginLeft: spacing.sm },
  logoutButton: { marginTop: spacing.lg },
});
