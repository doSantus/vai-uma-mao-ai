
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import CategoryAutocomplete from '../components/CategoryAutocomplete';
import LocationFields from '../components/LocationFields';
import useDeviceLocation from '../hooks/useDeviceLocation';
import { errorMessage } from '../services/errors';
import { useData } from '../context/DataContext';
import { addressToLocation } from '../utils/location';
import { colors, spacing, typography } from '../theme';

export default function ProviderFormScreen({ navigation }) {
  const { profile: editing, providerDraft, onboarding, session, saveProfile, saveProviderDraft, deleteProfile, categories, completeOnboarding } = useData();
  const initial = editing || providerDraft;
  const [name, setName] = useState(initial?.name ?? session?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? null);
  const [city, setCity] = useState(initial?.city ?? '');
  const [state, setState] = useState(initial?.state ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [serviceModes, setServiceModes] = useState(initial?.serviceModes ?? []);
  const [regions, setRegions] = useState(initial?.regions ?? '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const { locating, locationMessage, useCurrentLocation } = useDeviceLocation(setCity, setState);
  const fields = () => ({ name: name.trim(), category, city: city.trim(), state: state.trim().toUpperCase(), phone: phone.replace(/\D/g, ''), description: description.trim(), serviceModes, regions: regions.trim() });

  async function saveForLater() {
    if (pending.current || locating) return;
    pending.current = true;
    setSaving(true);
    try {
      await saveProviderDraft(fields());
      Alert.alert('Rascunho salvo', 'Continue em Perfil → Concluir cadastro de prestador. O rascunho não aparece na busca.');
      if (onboarding !== 'choice') navigation.goBack();
    } catch (error) { Alert.alert('Não foi possível salvar', errorMessage(error)); }
    finally { pending.current = false; setSaving(false); }
  }

  async function handleSave() {
    if (pending.current || locating) return;
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Informe o nome';
    if (description.trim().length < 10) newErrors.description = 'Descreva seus serviços em pelo menos 10 caracteres';
    if (!serviceModes.length) newErrors.serviceModes = 'Selecione pelo menos uma forma de atendimento';
    if (!categories.includes(category)) newErrors.category = 'Selecione uma profissão nas sugestões';
    if (!city.trim()) newErrors.city = 'Informe a cidade';
    else if (city.trim().length > 100) newErrors.city = 'Use até 100 caracteres';
    if (!addressToLocation({ city: city.trim() || 'Cidade', region: state })) newErrors.state = 'Informe uma UF brasileira válida';
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^55\d{10,11}$/.test(cleanPhone)) newErrors.phone = 'Use 55 + DDD + telefone (12 ou 13 dígitos)';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    pending.current = true;
    setSaving(true);
    try {
      await saveProfile(fields());
      Alert.alert('Cadastro publicado', 'Seu perfil foi salvo e está disponível na busca de profissionais.');
      if (onboarding !== 'choice') navigation.goBack();
    } catch (error) {
      Alert.alert('Não foi possível salvar', errorMessage(error));
    } finally { pending.current = false; setSaving(false); }
  }

  function confirmDelete() {
    if (pending.current) return;
    Alert.alert('Excluir cadastro?', 'Seu perfil será removido da busca e dos favoritos de todos os usuários. Sua conta será mantida.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (pending.current) return;
        pending.current = true;
        setSaving(true);
        try {
          await deleteProfile();
          Alert.alert('Cadastro excluído', 'Seu perfil profissional foi removido. Sua conta continua disponível.');
          navigation.goBack();
        } catch (error) {
          Alert.alert('Não foi possível excluir', errorMessage(error));
        } finally { pending.current = false; setSaving(false); }
      } },
    ]);
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar" disabled={saving} onPress={() => navigation.canGoBack() ? navigation.goBack() : completeOnboarding().catch(error=>Alert.alert('Não foi possível voltar',errorMessage(error)))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Editar perfil de prestador' : 'Cadastro de prestador'}</Text>
      </View>

      <Text style={styles.help}>Apresente seus serviços. Os campos abaixo são obrigatórios, exceto bairros ou regiões.</Text>
      <Input label="Nome de divulgação" placeholder="Seu nome ou nome profissional" maxLength={80} value={name} onChangeText={setName} error={errors.name} />

      <CategoryAutocomplete
        label="Categoria principal"
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
        error={errors.description}
        maxLength={1000}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Forma de atendimento</Text>
      {['No endereço do cliente', 'Em local próprio', 'Online'].map((mode) => <TouchableOpacity
        key={mode} accessibilityRole="checkbox" accessibilityState={{ checked: serviceModes.includes(mode), disabled: saving }}
        disabled={saving} style={styles.option}
        onPress={() => setServiceModes((current) => current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode])}
      >
        <Ionicons name={serviceModes.includes(mode) ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
        <Text style={styles.optionText}>{mode}</Text>
      </TouchableOpacity>)}
      {!!errors.serviceModes && <Text accessibilityRole="alert" style={styles.help}>{errors.serviceModes}</Text>}
      <Input label="Bairros ou regiões atendidas (opcional)" placeholder="Ex.: Centro e bairros próximos" value={regions} onChangeText={setRegions} maxLength={200} />
      <Text style={styles.help}>Ao publicar, seu nome de divulgação, serviços, cidade e WhatsApp ficarão visíveis para outros usuários. O rascunho é privado.</Text>

      <Button title={editing ? 'Salvar alterações' : 'Publicar meu perfil'} disabled={locating} loading={saving} onPress={handleSave} style={styles.saveButton} />
      {!editing && <Button title="Salvar rascunho e concluir depois" variant="outline" disabled={saving || locating} onPress={saveForLater} style={styles.saveButton} />}
      {editing && <Button title="Excluir meu cadastro" variant="outline" disabled={saving} onPress={confirmDelete} style={styles.saveButton} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  backButton: { marginRight: spacing.sm, minHeight: 48, minWidth: 48, justifyContent: 'center' },
  title: { ...typography.h2, color: colors.text, flexShrink: 1 },
  saveButton: { marginTop: spacing.sm },
  help: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.md },
  label: { ...typography.bodyBold, color: colors.text },
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingVertical: spacing.sm },
  optionText: { ...typography.body, color: colors.text, marginLeft: spacing.sm, flexShrink: 1 },
});
