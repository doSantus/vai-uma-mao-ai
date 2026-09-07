
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { colors, spacing, radius, typography } from '../theme';

const menuItems = [
  { icon: 'briefcase-outline', label: 'Meu perfil de prestador', action: 'ProviderForm' },
  { icon: 'heart-outline', label: 'Favoritos (em breve)' },
  { icon: 'notifications-outline', label: 'Notificações (em breve)' },
  { icon: 'shield-checkmark-outline', label: 'Privacidade e segurança (em breve)' },
];

export default function ProfileScreen({ navigation }) {
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Avatar name="Usuário Demonstração" size={72} />
        <Text style={styles.name}>Usuário Demonstração</Text>
        <Text style={styles.email}>usuario@email.com</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, index === menuItems.length - 1 && styles.menuItemLast]}
            onPress={() => item.action && navigation.navigate(item.action)}
            disabled={!item.action}
          >
            <Ionicons name={item.icon} size={20} color={colors.primary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.action && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Sair"
        variant="outline"
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
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
