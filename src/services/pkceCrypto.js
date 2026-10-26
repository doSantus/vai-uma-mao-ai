import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

// O Supabase usa estas duas operações WebCrypto para PKCE. Em Hermes, forneça
// a implementação nativa, evitando fallback para Math.random ou desafio plain.
if (Platform.OS !== 'web') {
  if (!globalThis.crypto) globalThis.crypto = {};
  if (!globalThis.crypto.getRandomValues) globalThis.crypto.getRandomValues = Crypto.getRandomValues;
  if (!globalThis.crypto.subtle) globalThis.crypto.subtle = {};
  if (!globalThis.crypto.subtle.digest) globalThis.crypto.subtle.digest = (algorithm, bytes) => {
    const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
    if (name !== 'SHA-256') throw new Error('Algoritmo não suportado pelo adaptador PKCE.');
    return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  };
}
