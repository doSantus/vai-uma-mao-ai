
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { categories } from '../data/mockProviders';
import { colors, spacing, radius, typography } from '../theme';

export default function ProviderFormScreen({ navigation, route }) {
  const editing = route.params?.provider;
  const [name, setName] = useState(editing?.name ?? '');
  const [category, setCategory] = useState(editing?.category ?? categories[0]);
  const [city, setCity] = useState(editing?.city ?? '');
  const [state, setState] = useState(editing?.state ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [errors, setErrors] = useState({});

  function handleSave() {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Informe o nome';
    if (!city.trim()) newErrors.city = 'Informe a cidade';
    if (!state.trim()) newErrors.state = 'Informe o estado';
    if (!phone.trim()) newErrors.phone = 'Informe o telefone/WhatsApp';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    navigation.goBack();
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Editar perfil de prestador' : 'Cadastro de prestador'}</Text>
      </View>

      <Input label="Nome completo" placeholder="Seu nome" value={name} onChangeText={setName} error={errors.name} />

      <Text style={styles.label}>Categoria de serviço</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {categories.map((cat) => {
          const active = cat === category;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.row}>
        <Input
          label="Cidade"
          placeholder="Ex: Goiânia"
          value={city}
          onChangeText={setCity}
          style={styles.cityInput}
          error={errors.city}
        />
        <Input
          label="UF"
          placeholder="GO"
          value={state}
          onChangeText={setState}
          autoCapitalize="characters"
          style={styles.stateInput}
          error={errors.state}
        />
      </View>

      <Input
        label="Telefone / WhatsApp"
        placeholder="5562999999999"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        error={errors.phone}
      />

      <Input
        label="Descrição do serviço"
        placeholder="Conte um pouco sobre sua experiência..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Button title="Salvar" onPress={handleSave} style={styles.saveButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  backButton: { marginRight: spacing.sm },
  title: { ...typography.h2, color: colors.text, flexShrink: 1 },
  label: { ...typography.small, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  chipsRow: { marginBottom: spacing.md },
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
  row: { flexDirection: 'row' },
  cityInput: { flex: 1, marginRight: spacing.sm },
  stateInput: { width: 90 },
  saveButton: { marginTop: spacing.sm },
});
