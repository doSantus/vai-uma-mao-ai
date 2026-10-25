import { unwrap, userError } from './errors';
export const normalizeEmail = (email) => email.trim().toLowerCase();
export function createAuthService(client) {
  return {
    signIn: ({ email, password }) => unwrap(client.auth.signInWithPassword({ email: normalizeEmail(email), password })),
    async signUp({ email, password, name }) {
      const result = await unwrap(client.auth.signUp({ email: normalizeEmail(email), password,
        options: { data: { full_name: name.trim().replace(/\s+/g, ' ') } } }));
      if (result.session) {
        await client.auth.signOut({ scope: 'local' });
        throw userError('A confirmação de e-mail precisa estar habilitada no Supabase para concluir este cadastro.');
      }
      return result;
    },
    verifyEmail: (email, token) => unwrap(client.auth.verifyOtp({ email: normalizeEmail(email), token: token.trim(), type: 'email' })),
    resend: (email) => unwrap(client.auth.resend({ type: 'signup', email: normalizeEmail(email) })),
    recover: (email) => unwrap(client.auth.resetPasswordForEmail(normalizeEmail(email))),
    verifyRecovery: (email, token) => unwrap(client.auth.verifyOtp({ email: normalizeEmail(email), token: token.trim(), type: 'recovery' })),
    updatePassword: (password) => unwrap(client.auth.updateUser({ password })),
    signOut: () => unwrap(client.auth.signOut({ scope: 'local' })),
  };
}
