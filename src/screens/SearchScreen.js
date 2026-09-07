
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import FilterBar from '../components/FilterBar';
import ProviderCard from '../components/ProviderCard';
import EmptyState from '../components/EmptyState';
import { mockProviders, categories } from '../data/mockProviders';
import { colors, spacing, typography } from '../theme';

export default function SearchScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filtered = useMemo(() => {
    return mockProviders.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCity = city ? p.city.toLowerCase().includes(city.toLowerCase()) : true;
      const matchesState = state ? p.state.toLowerCase().includes(state.toLowerCase()) : true;
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCity && matchesState && matchesCategory;
    });
  }, [search, city, state, selectedCategory]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Buscar prestadores</Text>
        <Text style={styles.count}>{filtered.length} encontrado(s)</Text>
      </View>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        city={city}
        onCityChange={setCity}
        state={state}
        onStateChange={setState}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProviderCard provider={item} onPress={() => navigation.navigate('ProviderDetails', { provider: item })} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Nenhum prestador encontrado"
            subtitle="Tente ajustar os filtros de cidade, estado ou categoria."
          />
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContent : undefined}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { marginTop: spacing.sm, marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.text },
  count: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  emptyContent: { flexGrow: 1 },
});
