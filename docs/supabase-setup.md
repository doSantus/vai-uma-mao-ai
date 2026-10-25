# Configuração do Supabase

Este guia ativa o backend implementado. É necessário criar um projeto Supabase:
nenhum projeto, domínio de e-mail ou cliente Google foi provisionado automaticamente.
Não compartilhe senha do banco, token pessoal, SMTP password, service_role ou sb_secret.

## 1 Criar projeto e banco

1. Entre em https://supabase.com/dashboard e crie um projeto na sua organização.
   Escolha a região e o plano desejados; guarde a senha do banco fora do repositório.
2. Aguarde o projeto ficar disponível. Abra SQL Editor → New query.
3. Cole e execute **uma vez** todo o conteúdo de
   `supabase/migrations/202610250001_etapa05.sql`. A migração usa uma transação:
   qualquer erro reverte a execução. Não repita se ela já foi aplicada com sucesso.
4. Verifique `profiles`, `providers`, `categories`, `favorites` e RLS habilitada nas quatro.
   As categorias são criadas pela migração; não são criados profissionais fictícios.
5. Em Connect/Project Settings → API, copie a Project URL e a chave **publishable**
   (`sb_publishable_...`). A aplicação aceita essa chave pública; não aceita chaves secretas.

## 2 Configurar o aplicativo

```powershell
Copy-Item .env.example .env
```

Preencha `.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

A URL deve ser HTTPS. `.env` é ignorado pelo Git; `.env.example` não contém credenciais.
Chaves EXPO_PUBLIC ficam no aplicativo distribuído: só a chave pública pode estar ali.
A proteção dos dados depende das políticas RLS, não do sigilo da chave pública.

```powershell
npm ci
npx expo start --go --clear
```

No Expo Go SDK 58, é possível testar senha, código de e-mail, CRUD e favoritos.
Sem configuração válida, o aplicativo mostra instruções de conexão em vez de simular login.

## 3 Configurar e-mail e confirmação

1. Em Authentication, habilite o provedor Email com senha e a opção **Confirm email**.
   Deixe login anônimo desabilitado. Configure o mínimo de senha para 8 caracteres.
2. Configure um provedor SMTP próprio (host, porta, usuário, senha e remetente autorizado).
   O serviço padrão de e-mail do Supabase é restrito e não serve como envio geral a usuários.
   O provedor escolhido pode exigir domínio verificado e ter limites/custos próprios.
3. Em Email Templates → Confirm signup, use `supabase/templates/confirmation.html`.
4. Em Email Templates → Reset password, use `supabase/templates/recovery.html`.
5. Os templates precisam conter `{{ .Token }}`: a interface usa código digitado, não um link.
6. Configure a validade do OTP (sugestão: 600 segundos) e os limites de envio.
   A interface aguarda 60 segundos entre reenvios; o limite efetivo é sempre o do servidor.
7. Cadastre um endereço seu e teste recebimento, código errado, expiração e reenvio.
   Teste também Esqueci minha senha e entrada com a nova senha.

O código fixo da prévia foi removido. `123456` só funcionaria se fosse realmente o
código emitido pelo Supabase naquele momento. Senhas nunca são salvas pela aplicação.

## 4 Configurar Google

O fluxo implementado abre o navegador do sistema e usa OAuth com PKCE pelo Supabase.
A volta ao aplicativo usa `vaiumamaoai://auth/callback`. Não há segredo Google no celular.

1. Crie um projeto no Google Cloud e configure a tela de consentimento OAuth.
   Use os escopos básicos de identidade, e-mail e perfil. Em modo de teste, cadastre
   os usuários de teste permitidos pelo Google.
2. Crie um cliente OAuth do tipo **Web application**. No campo Authorized redirect URIs,
   use o callback exibido pelo Supabase, normalmente
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
3. Em Supabase → Authentication → Providers → Google, habilite o provedor e configure
   Client ID e Client Secret. O segredo fica somente no painel do Supabase.
4. Em Authentication → URL Configuration → Redirect URLs, autorize exatamente
   `vaiumamaoai://auth/callback`. Configure também uma Site URL válida para o projeto.
5. Altere `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true` e gere uma development build.
   O botão fica desabilitado no Expo Go porque o retorno OAuth usa o scheme do app.

```powershell
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --profile development --platform android
npx expo start --dev-client --clear
```

É necessário ter conta Expo/EAS e instalar a build resultante no aparelho. Configure
as variáveis EXPO_PUBLIC no ambiente EAS usado pela build; arquivos ignorados pelo Git
não devem ser a única fonte da configuração de uma build na nuvem. Avalie limites/custos
do serviço antes de iniciar a build. Para iOS, siga os requisitos de assinatura da Apple.
O identificador do aplicativo pode ser definido pelo EAS durante a configuração.

Teste aceitar, cancelar e recusar o Google; fechar/reabrir o app durante o retorno;
entrar novamente; e entrar por Google com e-mail já cadastrado. A associação de
identidades é responsabilidade do Supabase Auth, nunca de comparação local de e-mails.

## 5 Validação com duas contas

1. A cria conta e confirma e-mail. Responde Sim e salva um rascunho.
2. B entra em outro aparelho: não pode encontrar nem ler o rascunho de A.
3. A publica o cadastro. B atualiza a busca, encontra o perfil e o favorita.
4. A edita a descrição. B atualiza detalhes/favoritos e vê a alteração.
5. B não pode alterar nem excluir o registro de A, mesmo chamando a API diretamente.
6. A exclui o perfil. B atualiza a busca/favoritos: o registro desaparece.
7. A mantém sua conta e pode cadastrar um novo perfil. Sair e reabrir pede login.

Não é necessária conexão em tempo real: as telas atualizam ao ganhar foco, puxar
para atualizar ou após operações do próprio usuário. Leituras/gravações remotas
exigem conexão. Em timeout, a resposta pode se perder depois de o servidor salvar;
atualize os dados antes de repetir a operação.

## Referências oficiais

- https://supabase.com/docs/guides/auth/quickstarts/react-native
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.expo.dev/guides/authentication/
