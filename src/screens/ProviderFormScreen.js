
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import CategoryAutocomplete from '../components/CategoryAutocomplete';
import LocationFields from '../components/LocationFields';
import useDeviceLocation from '../hooks/useDeviceLocation';
import { categories } from '../data/mockProviders';
import { useData } from '../context/DataContext';
import { addressToLocation } from '../utils/location';
import { colors, spacing, typography } from '../theme';

export default function ProviderFormScreen({ navigation }) {
  const { profile: editing, session, saveProfile, deleteProfile } = useData();
  const [name, setName] = useState(editing?.name ?? session?.name ?? '');
  const [category, setCategory] = useState(editing?.category ?? null);
  const [city, setCity] = useState(editing?.city ?? '');
  const [state, setState] = useState(editing?.state ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const { locating, locationMessage, useCurrentLocation } = useDeviceLocation(setCity, setState);

  async function handleSave() {
    if (pending.current || locating) return;
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Informe o nome';
    if (!categories.includes(category)) newErrors.category = 'Selecione uma profissão nas sugestões';
    if (!city.trim()) newErrors.city = 'Informe a cidade';
    if (!addressToLocation({ city: city.trim() || 'Cidade', region: state })) newErrors.state = 'Informe uma UF brasileira válida';
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^55\d{10,11}$/.test(cleanPhone)) newErrors.phone = 'Use 55 + DDD + telefone (12 ou 13 dígitos)';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    pending.current = true;
    setSaving(true);
    try {
      await saveProfile({ name: name.trim(), category, city: city.trim(), state: state.trim().toUpperCase(), phone: cleanPhone, description: description.trim() });
      Alert.alert('Cadastro salvo', 'Seu perfil foi salvo neste dispositivo e já aparece na busca.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Não foi possível salvar', 'Seus campos foram mantidos. Tente novamente.');
    } finally { pending.current = false; setSaving(false); }
  }

  function confirmDelete() {
    if (pending.current) return;
    Alert.alert('Excluir cadastro?', 'Seu perfil será removido da busca e dos favoritos neste dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (pending.current) return;
        pending.current = true;
        setSaving(true);
        try {
          await deleteProfile();
          navigation.goBack();
        } catch {
          Alert.alert('Não foi possível excluir', 'Seu cadastro foi mantido. Tente novamente.');
        } finally { pending.current = false; setSaving(false); }
      } },
    ]);
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar" disabled={saving} onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Editar perfil de prestador' : 'Cadastro de prestador'}</Text>
      </View>

      <Input label="Nome completo" placeholder="Seu nome" value={name} onChangeText={setName} error={errors.name} />

      <CategoryAutocomplete
        label="Categoria de serviço"
        categories={categories}
        selectedCategory={category}
        onSelectCategory={(value) => {
          setCategory(value);
          setErrors((previous) => ({ ...previous, category: undefined }));
        }}
        error={errors.category}
        disabled={saving}
      />
      <LocationFields
        city={city} onCityChange={setCity} state={state} onStateChange={setState}
        onUseLocation={useCurrentLocation} locating={locating}
        locationMessage={locationMessage} errors={errors} disabled={saving}
      />

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

      <Button title="Salvar" disabled={locating} loading={saving} onPress={handleSave} style={styles.saveButton} />
      {editing && <Button title="Excluir meu cadastro" variant="outline" disabled={saving} onPress={confirmDelete} style={styles.saveButton} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  backButton: { marginRight: spacing.sm, minHeight: 48, minWidth: 48, justifyContent: 'center' },
  title: { ...typography.h2, color: colors.text, flexShrink: 1 },
  saveButton: { marginTop: spacing.sm },
});
