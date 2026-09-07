
import React from 'react';
import { View, Text, StyleSheet, Linking, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { colors, spacing, radius, typography } from '../theme';

export default function ProviderDetailsScreen({ route, navigation }) {
  const { provider } = route.params;

  function handleWhatsApp() {
    const message = encodeURIComponent(
      `Ola, ${provider.name}! Encontrei seu perfil no Vai uma mao ai e gostaria de saber mais sobre o servico de ${provider.category.toLowerCase()}.`
    );
    const url = `https://wa.me/${provider.phone}?text=${message}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Nao foi possivel abrir o WhatsApp', 'Verifique se o aplicativo esta instalado.')
    );
  }

  return (
    <Screen scroll>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        <Avatar name={provider.name} size={80} />
        <Text style={styles.name}>{provider.name}</Text>
        <Badge label={provider.category} />
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.location}>
            {provider.city} - {provider.state}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sobre o serviço</Text>
        <Text style={styles.description}>{provider.description}</Text>
      </View>

      <Button
        title="Chamar no WhatsApp"
        onPress={handleWhatsApp}
        variant="whatsapp"
        icon={<Ionicons name="logo-whatsapp" size={18} color={colors.textInverse} />}
        style={styles.whatsappButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: { paddingVertical: spacing.sm, width: 40 },
  profileHeader: { alignItems: 'center', marginBottom: spacing.lg },
  name: { ...typography.h2, color: colors.text, marginTop: spacing.sm, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  location: { ...typography.small, color: colors.textSecondary, marginLeft: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  whatsappButton: { marginTop: spacing.md },
});
