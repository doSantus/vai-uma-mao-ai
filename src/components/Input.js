// Campo de texto reutilizável com label, ícone opcional, suporte a
// multilinha e exibição de erro de validação. Base de todos os
// formulários da aplicação (login, cadastro, perfil do prestador).
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icon,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          error && styles.inputError,
          multiline && styles.inputWrapperMultiline,
        ]}
      >
        {icon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, multiline && { height: 22 * numberOfLines, textAlignVertical: 'top' }]}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { ...typography.small, color: colors.text, marginBottom: spacing.xs, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    minHeight: 48,
  },
  inputWrapperMultiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: colors.error },
  input: { flex: 1, ...typography.body, color: colors.text, paddingVertical: 10 },
  errorText: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
});
