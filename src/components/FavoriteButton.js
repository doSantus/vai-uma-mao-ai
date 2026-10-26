import React, { useRef, useState } from 'react';
import { TouchableOpacity, ActivityIndicator, Alert, AccessibilityInfo, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { errorMessage } from '../services/errors';
import { colors } from '../theme';

export default function FavoriteButton({ provider }) {
  const { favoriteIds, toggleFavorite } = useData();
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const favorite = favoriteIds.includes(provider.id);
  async function toggle() {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    try {
      await toggleFavorite(provider.id);
      AccessibilityInfo.announceForAccessibility(favorite ? 'Removido dos favoritos.' : 'Adicionado aos favoritos.');
    } catch (error) {
      Alert.alert('Não foi possível salvar', errorMessage(error));
    } finally { pending.current = false; setSaving(false); }
  }
  return <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={`${favorite ? 'Remover' : 'Adicionar'} ${provider.name} ${favorite ? 'dos' : 'aos'} favoritos`}
    accessibilityState={{ selected: favorite, disabled: saving, busy: saving }}
    disabled={saving} onPress={toggle} style={styles.button}
  >
    {saving ? <ActivityIndicator color={colors.primary} /> : <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={26} color={colors.primaryDark} />}
  </TouchableOpacity>;
}
const styles = StyleSheet.create({ button: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' } });
