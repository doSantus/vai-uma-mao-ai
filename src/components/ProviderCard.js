// Card de listagem de prestador, usado na tela de Busca. Reaproveita
// Avatar e Badge.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import Badge from './Badge';
import FavoriteButton from './FavoriteButton';
import { colors, spacing, radius, typography } from '../theme';

export default function ProviderCard({ provider, onPress }) {
  return (
    <View style={styles.card}>
    <TouchableOpacity style={styles.details} accessibilityRole="button" accessibilityLabel={`Ver ${provider.name}, ${provider.category}, ${provider.city}, ${provider.state}`} activeOpacity={0.85} onPress={onPress}>
      <Avatar name={provider.name} size={52} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {provider.name}
        </Text>
        <Badge label={provider.category} />
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.location} numberOfLines={1}>
            {provider.city} - {provider.state}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
    <FavoriteButton provider={provider} />
    </View>
  );
}

const styles = StyleSheet.create({
  details: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.bodyBold, color: colors.text, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  location: { ...typography.small, color: colors.textSecondary, marginLeft: 4 },
});
