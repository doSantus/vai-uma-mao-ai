import React from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import ProviderCard from '../components/ProviderCard';
import EmptyState from '../components/EmptyState';
import { useData } from '../context/DataContext';
import { colors, spacing, typography } from '../theme';

export default function FavoritesScreen({ navigation }) {
  const { providers, favoriteIds } = useData();
  const favorites = providers.filter((provider) => favoriteIds.includes(provider.id));
  return <Screen>
    <FlatList
      ListHeaderComponent={<Text accessibilityRole="header" style={styles.title}>Favoritos ({favorites.length})</Text>}
      data={favorites} keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProviderCard provider={item} onPress={() => navigation.navigate('ProviderDetails', { providerId: item.id })} />}
      ListEmptyComponent={<EmptyState title="Nenhum favorito ainda" subtitle="Toque no coração de um profissional na busca para salvá-lo aqui." />}
    />
  </Screen>;
}
const styles = StyleSheet.create({ title: { ...typography.h2, color: colors.text, marginVertical: spacing.md } });
