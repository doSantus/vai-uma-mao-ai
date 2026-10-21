import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import * as Location from 'expo-location';
import { resolveAddresses } from '../utils/location';

export default function useDeviceLocation(setCity, setState) {
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const locationPending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function useCurrentLocation() {
    if (locationPending.current) return;
    locationPending.current = true;
    setLocating(true);
    setLocationMessage('');
    let timeout;
    let stage = 'position';
    const report = (message) => {
      if (!mounted.current) return;
      setLocationMessage(message);
      AccessibilityInfo.announceForAccessibility(message);
    };
    try {
      if (Platform.OS === 'web') {
        report('Use o Expo Go no celular para preencher pela localização, ou digite cidade e UF.');
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        report(permission.canAskAgain
          ? 'Permissão de localização negada. Você pode preencher cidade e UF manualmente.'
          : 'Localização bloqueada. Ative a permissão nas configurações do dispositivo ou preencha cidade e UF.');
        return;
      }
      if (!await Location.hasServicesEnabledAsync()) {
        report('A localização do dispositivo está desativada. Ative-a ou preencha cidade e UF.');
        return;
      }
      const addresses = await Promise.race([
        (async () => {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          stage = 'address';
          return Location.reverseGeocodeAsync(position.coords);
        })(),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('timeout')), 20000);
        }),
      ]);
      const result = resolveAddresses(addresses);
      if (!result) {
        report('Sua posição foi obtida, mas o serviço de endereços não retornou cidade ou UF brasileiras. Tente novamente com internet ou preencha os campos.');
        return;
      }
      if (!mounted.current) return;
      if (result.city) setCity(result.city);
      if (result.state) setState(result.state);
      report(result.city && result.state
        ? `Localização preenchida: ${result.city}, ${result.state}. Confira os campos e ajuste se necessário.`
        : result.state
          ? `Estado identificado: ${result.state}. O serviço não informou a cidade; confira e complete esse campo.`
          : `Cidade identificada: ${result.city}. O serviço não informou a UF; confira e complete esse campo.`);
    } catch {
      report(stage === 'address'
        ? 'Sua posição foi obtida, mas a consulta do endereço falhou ou demorou demais. Verifique a internet e tente novamente.'
        : 'Não foi possível obter sua posição. Verifique se a localização está ativada e tente novamente.');
    } finally {
      clearTimeout(timeout);
      locationPending.current = false;
      if (mounted.current) setLocating(false);
    }
  }

  return { locating, locationMessage, useCurrentLocation };
}
