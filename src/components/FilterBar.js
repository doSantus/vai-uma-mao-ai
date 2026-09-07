// Barra de filtros da tela de Busca: campo de texto (nome), cidade/UF e
// chips de categoria com rolagem horizontal.
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from './Input';
import { colors, spacing, radius, typography } from '../theme';

export default function FilterBar({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  city,
  onCityChange,
  state,
  onStateChange,
}) {
  return (
    <View style={styles.container}>
      <Input
        placeholder="Buscar por nome do prestador..."
        value={search}
        onChangeText={onSearchChange}
        icon={<Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />}
        style={styles.searchInput}
      />

      <View style={styles.row}>
        <Input placeholder="Cidade" value={city} onChangeText={onCityChange} style={styles.cityInput} />
        <Input
          placeholder="UF"
          value={state}
          onChangeText={onStateChange}
          autoCapitalize="characters"
          style={styles.stateInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelectCategory(active ? null : cat)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  searchIcon: { marginRight: spacing.xs },
  searchInput: { marginBottom: spacing.sm },
  row: { flexDirection: 'row' },
  cityInput: { flex: 1, marginRight: spacing.sm },
  stateInput: { width: 90 },
  chipsRow: { flexDirection: 'row', marginBottom: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.small, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: colors.textInverse },
});
