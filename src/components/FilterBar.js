import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from './Input';
import CategoryAutocomplete from './CategoryAutocomplete';
import LocationFields from './LocationFields';
import { colors, spacing } from '../theme';

export default function FilterBar({
  search, onSearchChange, categories, selectedCategory, onSelectCategory,
  city, onCityChange, state, onStateChange, onUseLocation, locating, locationMessage,
}) {
  return <View style={styles.container}>
    <Input label="Nome do profissional" placeholder="Buscar por nome..." value={search} onChangeText={onSearchChange}
      icon={<Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />} />
    <CategoryAutocomplete categories={categories} selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />
    <LocationFields city={city} onCityChange={onCityChange} state={state} onStateChange={onStateChange}
      onUseLocation={onUseLocation} locating={locating} locationMessage={locationMessage} />
  </View>;
}
const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  searchIcon: { marginRight: spacing.xs },
});
