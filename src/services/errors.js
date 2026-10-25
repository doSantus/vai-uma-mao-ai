export function errorMessage(error) {
  const code = error?.code;
  if (code === 'invalid_credentials') return 'E-mail ou senha incorretos.';
  if (code === 'email_not_confirmed') return 'Confirme seu e-mail antes de entrar.';
  if (code === 'otp_expired') return 'Código inválido ou expirado. Solicite outro código.';
  if (code === 'weak_password') return 'Escolha uma senha mais forte, com pelo menos 8 caracteres.';
  if (code === 'user_already_exists' || code === 'email_exists') return 'Já existe uma conta com esse e-mail. Entre ou recupere a senha.';
  if (code === 'same_password') return 'Escolha uma senha diferente da anterior.';
  if (error?.status === 429 || /rate_limit|over_email_send_rate_limit/.test(code || '')) return 'Aguarde antes de tentar novamente. O limite de solicitações foi atingido.';
  if (error?.status === 401 || code === 'PGRST301') return 'Sua sessão expirou. Entre novamente.';
  if (error?.status === 403 || code === '42501') return 'Sua conta não tem permissão para esta operação.';
  if (code === '23514' || code === '22P02') return 'Confira os campos e a categoria do cadastro antes de salvar.';
  if (code === '23503') return 'Este cadastro ou categoria não está mais disponível. Atualize a tela.';
  if (code === '23505') return 'Este registro já existe. Atualize a tela para conferir.';
  if (error?.status >= 500) return 'O serviço está indisponível no momento. Tente novamente em instantes.';
  if (error?.name === 'AbortError' || /timeout|network|fetch/i.test(error?.message || '')) return 'Não foi possível confirmar a operação. Confira sua conexão e atualize os dados antes de tentar novamente.';
  if (error?.userMessage) return error.userMessage;
  return 'Não foi possível concluir a operação. Tente novamente.';
}
export function userError(message) { const error = new Error(message); error.userMessage = message; return error; }
export async function unwrap(request) {
  const result = await request;
  if (result.error) throw Object.assign(new Error(result.error.message || 'Falha na requisição'), result.error,
    { status: result.status || result.error.status });
  return result.data;
}
