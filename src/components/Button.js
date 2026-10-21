
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
}) {
  const isDisabled = disabled || loading;
  const isLightText = variant === 'outline' || variant === 'ghost';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant],
        size === 'sm' && styles.sm,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isLightText ? colors.primary : colors.textInverse} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, textVariantStyles[variant], icon && { marginLeft: spacing.xs }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  sm: { paddingVertical: 10, paddingHorizontal: spacing.md },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: { ...typography.bodyBold },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.accent },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  whatsapp: { backgroundColor: colors.whatsapp },
});

const textVariantStyles = StyleSheet.create({
  primary: { color: colors.textInverse },
  secondary: { color: colors.textInverse },
  outline: { color: colors.primary },
  ghost: { color: colors.primary },
  whatsapp: { color: colors.textInverse },
});
