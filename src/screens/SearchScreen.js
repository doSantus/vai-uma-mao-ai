import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import FilterBar from '../components/FilterBar';
import ProviderCard from '../components/ProviderCard';
import EmptyState from '../components/EmptyState';
import { categories } from '../data/mockProviders';
import { useData } from '../context/DataContext';
import { colors, spacing, typography } from '../theme';
import { normalizeText } from '../utils/search';
import useDeviceLocation from '../hooks/useDeviceLocation';

export default function SearchScreen({ navigation }) {
  const { providers } = useData();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { locating, locationMessage, useCurrentLocation } = useDeviceLocation(setCity, setState);

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch = normalizeText(p.name).includes(normalizeText(search));
      const matchesCity = normalizeText(p.city).includes(normalizeText(city));
      const matchesState = normalizeText(p.state).includes(normalizeText(state));
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCity && matchesState && matchesCategory;
    });
  }, [providers, search, city, state, selectedCategory]);

  return (
    <Screen>
      <FlatList
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<>
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
              onUseLocation={useCurrentLocation}
              locating={locating}
              locationMessage={locationMessage}
            />
        </>}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProviderCard provider={item} onPress={() => navigation.navigate('ProviderDetails', { providerId: item.id })} />
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
