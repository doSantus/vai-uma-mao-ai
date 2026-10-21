import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import Input from './Input';
import { suggestCategories } from '../utils/search';
import { colors, spacing, radius, typography } from '../theme';

export default function CategoryAutocomplete({ categories, selectedCategory, onSelectCategory, label = 'Profissão', error, disabled = false }) {
  const [profession, setProfession] = useState(selectedCategory || '');
  const suggestions = selectedCategory ? [] : suggestCategories(categories, profession);

  function changeProfession(text) {
    if (disabled) return;
    setProfession(text);
    onSelectCategory(null);
  }

  return <View>
      <Input
        label={label}
        placeholder="Digite: eletricista, pintor..."
        value={profession}
        error={error}
        editable={!disabled}
        onChangeText={changeProfession}
        autoCorrect={false}
        accessibilityHint="Digite parte da profissão e toque em uma sugestão abaixo para selecionar."
        style={styles.professionInput}
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <Text style={styles.hint} accessibilityLiveRegion="polite">{suggestions.length} sugestão(ões). Selecione uma profissão:</Text>
          {suggestions.map((category) => (
            <TouchableOpacity
              key={category}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${category}`}
              disabled={disabled}
              accessibilityState={{ disabled }}
              style={styles.suggestion}
              onPress={() => {
                setProfession(category);
                onSelectCategory(category);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.suggestionText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {!selectedCategory && profession.trim() !== '' && suggestions.length === 0 && (
        <Text style={styles.hint} accessibilityLiveRegion="polite">Nenhuma profissão encontrada. Tente outro nome.</Text>
      )}
      {profession.length > 0 && (
        <TouchableOpacity accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} accessibilityLabel="Limpar profissão" onPress={() => changeProfession('')} style={styles.action}>
          <Text style={styles.actionText}>Limpar profissão</Text>
        </TouchableOpacity>
      )}
  </View>;
}

const styles = StyleSheet.create({
  professionInput: { marginBottom: spacing.xs },
  suggestions: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md },
  suggestion: { minHeight: 48, justifyContent: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  suggestionText: { ...typography.body, color: colors.text },
  hint: { ...typography.small, color: colors.textSecondary, paddingVertical: spacing.sm },
  action: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.sm },
  actionText: { ...typography.small, color: colors.primaryDark, fontWeight: '600' },
});
