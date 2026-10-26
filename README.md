# Vai uma mão ai

Aplicativo mobile para encontrar prestadores por profissão, cidade e estado, salvar
favoritos e entrar em contato pelo WhatsApp. Toda pessoa cria uma conta única e pode
optar por divulgar serviços depois do cadastro.

## Etapa 5 e situação da entrega

A integração com **Supabase Auth + PostgreSQL** está implementada no código, incluindo
migração SQL, regras de acesso, autenticação por senha, confirmação por código,
recuperação de senha e Google por OAuth/PKCE. Os testes locais incluem execução das
regras de banco e chamadas HTTP com respostas controladas.

**Situação em 25/10/2026:** o projeto Supabase foi criado, o ambiente local foi conectado
e a migração foi executada com sucesso. A API reconhece as quatro tabelas e nega acesso
anônimo. A confirmação de e-mail está habilitada. O responsável configurou SMTP e
relatou testes de cadastro no aplicativo. Ainda falta concluir e registrar o roteiro
completo com duas contas, recuperação de senha e Google; o Google continua desabilitado.
Sem URL e chave pública válidas, o aplicativo mostra a tela de configuração; não simula login.

- [Documentação completa da Etapa 5](docs/etapa-05.md)
- [Proposta original](docs/proposta.md)
- [Etapa 2](docs/etapa-02.md) e [Etapa 4](docs/etapa-04.md), referentes às versões anteriores

## Mudança de Firebase para Supabase

A proposta inicial previa **Firebase Authentication + Cloud Firestore**. Na Etapa 5,
essa escolha foi substituída por **Supabase Auth + PostgreSQL**. Trata-se de uma mudança
da arquitetura planejada: os dados locais demonstrativos não foram migrados de um banco Firebase.

O motivo principal foi a adequação do banco relacional às relações entre contas,
prestadores, categorias e favoritos. No projeto, PostgreSQL permite definir essas
relações com chaves estrangeiras, impedir favoritos duplicados com uma chave composta
e remover os favoritos relacionados quando um prestador é excluído. As funções SQL
também permitem salvar o perfil e seu progresso na mesma transação, enquanto as
políticas RLS controlam quais registros cada usuário pode consultar e alterar.

O Supabase reúne esses recursos com autenticação e API acessíveis pelo aplicativo,
sem exigir um servidor próprio para esta etapa. A decisão foi pela adequação ao modelo
de dados e ao uso de SQL; não significa que Firebase seja incapaz de atender ao projeto
ou que Supabase seja superior em qualquer cenário. A proposta e as etapas anteriores
permanecem como histórico; esta documentação descreve a implementação atual.

## Executar

Pré-requisitos: Node.js 22.13+ na linha 22, 24.3+ na linha 24 ou 26+, npm e Expo Go SDK 58.
Para Google, use uma development build com o scheme do aplicativo.

1. Crie o projeto Supabase e execute `supabase/migrations/202610250001_etapa05.sql`.
2. No Supabase Auth, configure Custom SMTP e mantenha **Confirm email** habilitado.
   Em Emails, use `supabase/templates/confirmation.html` para Confirm signup e
   `supabase/templates/recovery.html` para Reset password; ambos usam `{{ .Token }}`.
3. Prepare o ambiente:

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

4. Preencha a URL e a chave **publishable** em `.env`. Nunca use service_role/sb_secret.
5. Inicie:

```powershell
npx expo start --go --clear
```

Abra o QR code no Expo Go. Se necessário, acrescente `--tunnel`. Para uma development
build já instalada, use `npx expo start --dev-client --clear`.

## Fluxo principal

Cadastrar nome, e-mail, senha e confirmação de senha → confirmar código recebido → responder se oferece
serviços → preencher cadastro → publicar → encontrar na busca → consultar detalhes →
editar → excluir com confirmação. Escolher Não abre a busca; Perfil permite divulgar
serviços depois. Um rascunho pode ser salvo incompleto e retomado, sem exposição pública.

Nome de divulgação, categoria, descrição, cidade/UF, WhatsApp e formas de atendimento
são obrigatórios para publicar. Regiões atendidas são opcionais. O nome da conta é
privado e independente do nome profissional. Todos podem buscar e favoritar profissionais.

## Funcionalidades

- Cadastro e login reais com e-mail/senha, verificação por código, reenvio e recuperação.
- Confirmação de senha obrigatória e idêntica antes do envio do cadastro.
- Tratamento de cadastro repetido, inclusive resposta com identidades vazias do Auth,
  orientando a entrar ou recuperar a senha sem apresentar uma nova conta como criada.
- Google por Supabase OAuth/PKCE, condicionado à configuração e à development build.
- Primeiro acesso persistido no banco e perfil profissional opcional.
- CRUD de prestador, rascunhos privados e perfis publicados consultáveis por autenticados.
- Busca remota paginada, sem distinção de acentos no nome/cidade, filtros e atualização.
- Favoritos privados por usuário, sem duplicatas, com exclusão em cascata.
- Detalhes atualizados e contato por WhatsApp externo.
- Sugestões de categoria e localização opcional; preenchimento manual continua disponível.
- Sessão restaurada pelo Supabase Auth; filtros salvos em JSON no AsyncStorage por projeto/UUID.
- Validações no aplicativo e banco, estados de espera, mensagens de erro e repetição manual.

## Arquitetura

Telas/React Navigation → DataContext → serviços de autenticação e repositório → Supabase.
O SDK envia HTTPS/JSON com chave pública e token de acesso. As políticas RLS aplicam
as permissões no banco. As funções SQL de cadastro executam múltiplas alterações em
uma transação, sem desabilitar RLS.

- `src/services`: cliente Supabase, autenticação, OAuth, timeout e mensagens de erro.
- `src/data/supabaseRepository.js`: consultas, publicação, edição, exclusão e favoritos.
- `src/data/preferences.js`: filtros locais por conta.
- `supabase/migrations`: tabelas, índices, constraints, triggers, funções e políticas RLS.
- `supabase/templates`: templates dos e-mails de confirmação e recuperação.
- `tests`: regressões locais, contratos HTTP e PostgreSQL/RLS com PGlite.

Tecnologias: Expo SDK 58, React Native 0.88, React 19.3, React Navigation, Supabase JS,
AsyncStorage, expo-location, expo-web-browser e expo-linking.

## Verificação

```powershell
npm test
npx expo-doctor
npx expo export --platform android --platform ios --output-dir dist
```

Os testes do banco usam PostgreSQL embutido (PGlite) com um schema Auth mínimo simulado;
as tabelas, funções e políticas do aplicativo são executadas de verdade. Os testes HTTP
usam o SDK oficial com respostas controladas. Eles não validam entrega de e-mail,
consentimento Google, configuração do projeto remoto ou execução no aparelho.

A última execução de `npm test` aprovou **31 testes**. A configuração base também passou
em 20/20 verificações do Expo Doctor e na exportação Android/iOS. As verificações locais
não substituem o roteiro manual da Etapa 5. O visual verde original foi mantido.

## Publicação do código

Versione o código, os testes, `README.md`, `docs/etapa-05.md`,
a migração SQL e os templates. `.env`, `node_modules` e `dist` são ignorados pelo Git.
Cada pessoa que clonar o repositório precisa configurar seu próprio `.env`; nunca
inclua senha SMTP, senha do banco ou chaves administrativas na entrega.

A tag local `etapa-05` foi criada na implementação inicial. Alterações posteriores,
como confirmação de senha e esta atualização da documentação, precisam de um novo
commit e não passam a integrar essa tag automaticamente. Confira o commit da tag
antes de usá-la como referência da entrega final.

## Dados anteriores e limites

O armazenamento demonstrativo da Etapa 4 foi preservado, mas não é usado como sessão
real nem importado automaticamente. E-mails iguais não comprovam propriedade de dados.
Os profissionais fictícios não fazem parte do catálogo remoto.

Não há fila de gravação offline nem sincronização em tempo real. O app atualiza dados
ao abrir telas, após operações e ao puxar para atualizar. AsyncStorage não oferece
criptografia própria: é usado pelo SDK para sessão e pelo app para filtros; senhas
não são armazenadas. Limpar os dados do aplicativo remove sessão/preferências locais,
mas não os dados remotos. A confirmação de e-mail não certifica qualificação profissional.

Repositório: [doSantus/vai-uma-mao-ai](https://github.com/doSantus/vai-uma-mao-ai).
