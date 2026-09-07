// Wrapper padrão de tela: aplica SafeArea, evita que o teclado sobreponha
// inputs, e centraliza o conteúdo com largura máxima em telas grandes
// (tablets), evitando textos e formulários esticados de ponta a ponta.
import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { isTablet, maxContentWidth } from '../utils/responsive';

export default function Screen({ children, scroll = false, style, contentContainerStyle }) {
  const Wrapper = scroll ? ScrollView : View;
  const wrapperProps = scroll
    ? {
        contentContainerStyle: [styles.scrollContent, contentContainerStyle],
        keyboardShouldPersistTaps: 'handled',
        showsVerticalScrollIndicator: false,
      }
    : { style: [styles.content, style] };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Wrapper {...wrapperProps}>{children}</Wrapper>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: isTablet ? maxContentWidth : undefined,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: isTablet ? maxContentWidth : undefined,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
});
