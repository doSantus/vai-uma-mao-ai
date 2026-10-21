import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from './Input';
import { colors, spacing, radius, typography } from '../theme';

export default function LocationFields({
  city, onCityChange, state, onStateChange, onUseLocation, locating,
  locationMessage, errors = {}, disabled = false,
}) {
  const busy = disabled || locating;
  return <View>
    <View style={styles.row}>
      <Input label="Cidade" placeholder="Sua cidade" value={city} onChangeText={onCityChange} editable={!busy} error={errors.city} style={styles.cityInput} />
      <Input label="UF" accessibilityLabel="Estado, sigla com duas letras" placeholder="UF" value={state} onChangeText={onStateChange} editable={!busy} error={errors.state} autoCapitalize="characters" maxLength={2} style={styles.stateInput} />
    </View>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy: locating }}
      accessibilityHint="Pede acesso à localização para preencher cidade e estado."
      disabled={busy} onPress={onUseLocation} style={styles.locationButton}
    >
      {locating ? <ActivityIndicator color={colors.primaryDark} /> : <Ionicons name="locate-outline" size={22} color={colors.primaryDark} />}
      <Text style={styles.locationText}>{locating ? 'Buscando localização...' : 'Usar minha localização'}</Text>
    </TouchableOpacity>
    {!!locationMessage && <Text style={styles.hint} accessibilityLiveRegion="polite">{locationMessage}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: spacing.sm },
  cityInput: { flex: 1, marginRight: spacing.sm },
  stateInput: { width: 90 },
  locationButton: { flexDirection: 'row', alignItems: 'center', minHeight: 48, padding: spacing.sm, marginBottom: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  locationText: { ...typography.bodyBold, color: colors.primaryDark, marginLeft: spacing.sm, flex: 1 },
  hint: { ...typography.small, color: colors.textSecondary, paddingVertical: spacing.sm },
});
