import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { unwrap, userError } from './errors';
import { createOAuthCallback } from './oauthCallback';
WebBrowser.maybeCompleteAuthSession();
export const OAUTH_REDIRECT = 'vaiumamaoai://auth/callback';
export const googleAvailable = process.env.EXPO_PUBLIC_GOOGLE_AUTH_ENABLED === 'true' && Constants.appOwnership !== 'expo';
// Android pode entregar o mesmo retorno pelo navegador e pelo evento Linking.
export const handleOAuthUrl=createOAuthCallback((code,options)=>
  unwrap(supabase.auth.exchangeCodeForSession(code,options)),OAUTH_REDIRECT);
export async function signInWithGoogle() {
  if (!googleAvailable) throw userError('Google requer configuração do provedor e uma versão de desenvolvimento instalada no celular.');
  const { url } = await unwrap(supabase.auth.signInWithOAuth({ provider: 'google', options: {
    redirectTo: OAUTH_REDIRECT, skipBrowserRedirect: true,
  } }));
  const result = await WebBrowser.openAuthSessionAsync(url, OAUTH_REDIRECT);
  if (result.type === 'success') await handleOAuthUrl(result.url);
  // Fechar o navegador deixa a pessoa na tela de acesso; não cria sessão fictícia.
}
