import 'react-native-url-polyfill/auto';
import './pkceCrypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { createTimeoutFetch } from './http';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
// Falhar de forma explícita, sem reativar o login demonstrativo por engano.
export const isConfigured = /^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(url)
  && !url.includes('seu-projeto') && key.length > 30 && key.startsWith('sb_publishable_');
export const supabase = isConfigured ? createClient(url, key, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true,
    detectSessionInUrl: false, flowType: 'pkce', lock: processLock },
  global: { fetch: createTimeoutFetch(fetch) },
}) : null;
