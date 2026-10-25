# Etapa 05 — Aplicação mobile integrada ao Supabase

## Objetivo e situação

O Vai uma mão ai conecta pessoas a prestadores locais. Nesta etapa, as telas de
cadastro, busca, detalhes, perfil e favoritos passaram a usar Supabase Auth e APIs
HTTPS do Supabase/PostgreSQL. O fluxo de negócio principal é criar, consultar, editar
e excluir um perfil profissional; autenticação e favoritos complementam a operação.

O código da integração, a migração SQL, os templates de e-mail e os testes locais
estão preparados. **A ativação em um projeto Supabase real está pendente**: o projeto
na nuvem ainda não foi criado pelo responsável. Envio real de e-mail, Google e fluxo
completo em dois dispositivos ainda precisam ser verificados após a configuração.
Esta distinção evita apresentar testes simulados como demonstração de backend remoto.

## Fluxo completo implementado

1. A pessoa informa nome completo, e-mail e senha na tela Cadastrar.
2. O Supabase Auth recebe a solicitação. Com Confirm email habilitado e SMTP configurado,
   envia o código pelo template de confirmação. A senha é entregue ao serviço por HTTPS.
3. A pessoa digita o código. O aplicativo chama verifyOtp; somente uma resposta válida
   cria a sessão. Código errado/expirado exibe erro e permite solicitar outro.
4. Após autenticar, o app carrega o perfil privado e apresenta “Você é prestador de serviços?”.
5. Não conclui o primeiro acesso e abre a busca. Sim cria/recupera um rascunho privado
   e abre o formulário. A mesma conta também pode buscar e favoritar prestadores.
6. A pessoa informa nome de divulgação, categoria, descrição, cidade/UF, WhatsApp,
   formas de atendimento e, opcionalmente, bairros/regiões.
7. Salvar rascunho mantém o perfil privado e permite retomar em Perfil. Publicar valida
   os campos no cliente e no banco, grava o registro e o disponibiliza na busca.
8. A busca consulta o backend por nome, cidade, UF e categoria, em páginas de 20 registros.
   Nome/cidade ignoram acentos e maiúsculas. Detalhes recupera o registro pelo ID.
9. O dono edita o perfil; outros usuários veem a atualização ao atualizar/reabrir a tela.
10. O dono confirma a exclusão. O banco remove o perfil e os favoritos relacionados
    em cascata. A conta continua disponível e pode divulgar serviços novamente.

Quem escolheu Não pode usar Perfil → Divulgar meus serviços posteriormente. O nome
da conta é separado do nome profissional. Um cadastro em rascunho nunca é listado
na busca. Voltar do formulário sem salvar descarta somente alterações não enviadas.

## Funcionalidades integradas

| Funcionalidade | Comportamento nesta etapa |
| --- | --- |
| E-mail e senha | Supabase Auth, sessão persistente e logout local ao aparelho |
| Confirmação | Código real validado no servidor, template, expiração e reenvio |
| Recuperação de senha | Solicitar e-mail, validar código do tipo recovery e definir nova senha |
| Google | OAuth/PKCE, navegador do sistema, callback do app; exige configuração e development build |
| Primeiro acesso | Estado salvo em profiles; opção de divulgar serviços ou ir à busca |
| Prestador | Rascunho, publicação, consulta, edição e exclusão no banco |
| Busca | Consulta paginada, filtros e atualização por foco/puxar para atualizar |
| Favoritos | Por UUID autenticado, privados, sem duplicatas, sem copiar dados do prestador |
| Localização | expo-location com permissão, tratamento de falhas e campos editáveis |
| Contato | Deep link externo do WhatsApp; não há chat interno |
| Persistência local | Sessão do SDK e filtros por projeto/UUID no AsyncStorage |

Não são usadas as contas demonstrativas nem os profissionais fictícios na execução
atual. Os arquivos do repositório local antigo permanecem como histórico/testes e os
dados antigos não são apagados nem importados automaticamente por coincidência de e-mail.

## Arquitetura e responsabilidades

```mermaid
flowchart TD
    UI[Telas React Native e navegação] --> CTX[DataContext]
    CTX --> AUTH[Serviços de autenticação e OAuth]
    CTX --> REPO[Repositório de dados]
    AUTH --> SB[Supabase Auth]
    REPO --> API[API REST e funções RPC via HTTPS]
    API --> DB[PostgreSQL com RLS e constraints]
    CTX --> LOCAL[AsyncStorage para filtros]
    SB --> SESSION[Sessão persistida pelo SDK]
```

O frontend apresenta dados, valida entradas para orientar o usuário e controla
carregamento/erros. O backend autentica e autoriza, aplica integridade e persiste os
dados compartilhados. O aplicativo usa apenas a chave pública publishable. Nenhuma
chave de administração ou segredo Google/SMTP deve ser incluído no bundle.

O timeout das requisições é de 20 segundos. A aplicação não repete automaticamente
uma escrita de resultado incerto: em perda de conexão depois de o servidor salvar,
a pessoa é orientada a atualizar os dados antes de tentar de novo. Escritas do app
são enfileiradas, com verificação da conta ativa; respostas de contas anteriores não
são aplicadas à conta atual. O SDK renova a sessão quando o aplicativo está ativo.

## Banco de dados

```mermaid
erDiagram
    AUTH_USERS ||--o| PROFILES : possui
    PROFILES ||--o| PROVIDERS : divulga
    CATEGORIES o|--o{ PROVIDERS : classifica
    PROFILES ||--o{ FAVORITES : salva
    PROVIDERS ||--o{ FAVORITES : recebe
```

| Tabela | Campos e restrições principais |
| --- | --- |
| auth.users | Gerenciada pelo Supabase Auth; contas e identidades de autenticação |
| profiles | id referenciando auth.users, full_name, onboarding_step, datas; leitura/escrita privada |
| categories | id, name único, is_active; leitura por autenticados, gestão administrativa |
| providers | id, user_id único, display_name, category_id, description, city, state, whatsapp, service_modes, service_regions, status e datas |
| favorites | Chave composta user_id/provider_id, data de criação e referências com exclusão em cascata |

`onboarding_step` usa choose, provider_form ou complete. `status` usa draft ou published.
`service_modes` é uma lista validada de at_customer, own_location e online. As relações
com contas usam UUID, nunca e-mail como chave de propriedade.

RLS limita a alteração do prestador ao dono; permite leitura dos publicados por
usuários autenticados e dos rascunhos somente pelo dono. Perfil privado e favoritos
são acessíveis somente pelo proprietário. Categorias não podem ser alteradas pelo app.
O usuário não tem permissão para transferir o user_id de um perfil profissional.

O trigger de auth.users cria profiles com nome inicial e progresso choose. A função
begin_provider cria/recupera o rascunho e atualiza o primeiro acesso na mesma transação.
A função save_provider grava o formulário e conclui o primeiro acesso atomicamente.
Ambas executam como o chamador, mantendo RLS. O banco valida os campos mínimos para
publicação, limites de texto, UF e formatos aceitos. A categoria referenciada existe
por chave estrangeira; a função de publicação verifica se ela está ativa.

A migração está em `supabase/migrations/202610250001_etapa05.sql`. Foi preparada para
execução única e contém a carga inicial de categorias. Não contém dados pessoais reais.

## Comunicação HTTP conforme o material da disciplina

O SDK oficial encapsula fetch, requisições assíncronas e conversão JSON. Não existe
acesso direto ao banco com senha pelo aplicativo. O token da sessão é enviado em
Authorization; a chave pública identifica o projeto. O serviço decide o acesso via RLS.

| Operação | Requisição utilizada |
| --- | --- |
| Consultar perfil/categorias/favoritos/detalhes | GET em /rest/v1, filtros pela URL |
| Concluir primeiro acesso | PATCH em /rest/v1/profiles |
| Favoritar | POST em /rest/v1/favorites, corpo JSON |
| Desfavoritar/excluir perfil | DELETE com filtros pela URL |
| Iniciar/salvar cadastro | POST em /rest/v1/rpc/begin_provider ou save_provider; transação no servidor |
| Buscar com normalização/paginação | POST em /rest/v1/rpc/search_providers; função somente de leitura |
| Autenticação, código e recuperação | Endpoints /auth/v1 gerenciados pelo SDK |

A busca é um exemplo de RPC de leitura com POST: não se apresenta esse endpoint como
GET. A escolha permite normalizar acentos e limitar a paginação no banco. A exclusão
é DELETE; edições de formulário usam RPC para salvar também o progresso atomicamente.

Respostas 2xx permitem atualizar o estado confirmado. Erros 401/403, validações,
limites 429 e falhas 5xx recebem mensagens específicas quando o serviço fornece o
status/código. Nem todo 4xx significa erro de programação do frontend: pode indicar
permissão, sessão, limite ou uma entrada que o usuário precisa corrigir.

## Persistência local conforme o material da disciplina

React Context mantém estado volátil; AsyncStorage mantém sessão/preferências entre
execuções. Os filtros são serializados com JSON.stringify e recuperados com JSON.parse.
`preferences.js` oferece leitura, gravação e remoção e separa as chaves por projeto e
UUID. A chave antiga de demonstração é preservada e nunca promovida a autenticação.

O AsyncStorage não é o banco principal nem uma fila offline. Não oferece criptografia
própria; a sessão é persistida pelo SDK conforme a integração React Native do Supabase.
As senhas e códigos digitados não são gravados pelo aplicativo. Dados estruturados
compartilhados, como prestadores e favoritos, pertencem ao PostgreSQL remoto.

## Entradas inválidas e feedback

- Cadastro exige nome/sobrenome, e-mail válido e senha de pelo menos 8 caracteres.
- A confirmação exige código numérico e validação real pelo Supabase. Não há código fixo.
- A recuperação valida o código como recovery e exige repetir a nova senha.
- Publicação exige categoria válida, nome, descrição de 10 a 1.000 caracteres,
  cidade, UF brasileira, WhatsApp 55 + DDD + número e forma de atendimento.
- Rascunhos permitem campos vazios; valores preenchidos ainda respeitam limites e formatos do banco.
- Botões mostram espera e evitam envios duplicados. Falhas preservam campos para correção.
- Há mensagens de sucesso ao salvar/publicar/excluir e confirmação antes de excluir.
- O coração e o anúncio de acessibilidade indicam a alteração de favorito.
- Busca, detalhes e favoritos oferecem atualização e repetição em caso de erro.
- Negar localização mantém a alternativa manual. Falha em abrir WhatsApp produz aviso.

## Execução e configuração

Siga `docs/supabase-setup.md` para criar o projeto, executar SQL, configurar Auth/SMTP,
preencher `.env`, habilitar Google e preparar a development build.

```powershell
npm ci
Copy-Item .env.example .env
# Preencher .env com URL HTTPS e chave publishable
npx expo start --go --clear
```

Senha, OTP e CRUD podem ser testados no Expo Go SDK 58. Google usa uma development
build com scheme vaiumamaoai e callback vaiumamaoai://auth/callback. Templates de
confirmação e recuperação ficam em `supabase/templates`. Não há credenciais no Git.

## Roteiro de teste e demonstração

1. Criar uma conta A com e-mail real e confirmar o código recebido.
2. Testar código errado, expirado e reenvio após o intervalo.
3. Responder Sim, salvar um rascunho incompleto, encerrar e reabrir o aplicativo.
4. Retomar o rascunho em Perfil; conferir que não aparece na busca.
5. Completar os campos e publicar. Encontrar o perfil na busca e conferir detalhes.
6. Em outra conta B/aparelho, encontrar e favoritar o perfil de A; reabrir e conferir.
7. A altera a descrição. B atualiza a tela e verifica o novo texto.
8. Tentar alterar/excluir o perfil de A com sessão B: a API deve negar/afetar zero linhas.
9. A exclui o perfil e confirma. B atualiza busca/favoritos: o perfil desaparece.
10. Conferir que A continua com conta válida, mesmo sem perfil profissional.
11. Testar uma conta nova escolhendo Não; posteriormente usar Divulgar meus serviços.
12. Alterar filtros, encerrar e reabrir. Conferir que persistem apenas para a mesma conta.
13. Sair, reabrir e confirmar a tela de login. Entrar por senha e testar recuperação.
14. Na development build, testar Google, cancelamento e retorno por deep link.
15. Desligar a conexão ao consultar/salvar: conferir mensagem e ausência de sucesso falso.
16. Negar localização, preencher manualmente e testar abertura do WhatsApp.

Screenshots ou vídeo devem mostrar registros reais e o mesmo ID antes/depois da edição.
Não há captura de execução em aparelho ou entrega real de e-mail nesta validação local.

## Testes automatizados e resultados

```powershell
npm test
npx expo-doctor
npx expo export --platform android --platform ios --output-dir dist
```

- Testes de regressão do repositório local anterior e de normalização de localização.
- PostgreSQL via PGlite executando a migração, CRUD, rollback, constraints, RLS entre
  duas contas, rascunho privado, favoritos únicos e exclusão em cascata.
- SDK Supabase com HTTP controlado verificando métodos, corpo JSON, headers e erros.
- Autenticação verificando payloads de senha/OTP/recovery e propagação de erro do servidor.
- Timeout/cancelamento de fetch e persistência/isolamento dos filtros locais.

A execução local registrou 30 testes aprovados, 20/20 verificações do Expo Doctor e
bundles Android/iOS gerados. O PGlite simula apenas o schema Auth para os testes SQL;
não executa GoTrue, PostgREST, SMTP ou Google. Os testes HTTP usam respostas controladas.
No ambiente Windows utilizado, TEMP/TMP foram apontados para `dist/.expo-temp` para
permitir geração do bytecode Hermes; o resultado foi salvo em `dist/etapa05`.

## Repositório e entrega

Repositório: https://github.com/doSantus/vai-uma-mao-ai

A entrega inclui este documento, README, código mobile, SQL, templates e testes no
mesmo repositório. A tag etapa-05 identifica o código preparado para a etapa; a tag
não comprova que serviços externos foram configurados ou que o roteiro remoto passou.
Antes da apresentação final, concluir a ativação e registrar os resultados reais do
roteiro com duas contas, incluindo código de e-mail e Google.

## Referências utilizadas

- ETAPA 05.docx, enunciado fornecido pelo usuário: integração mobile/backend, fluxo completo,
  validação, feedback e itens de entrega.
- Jáderson Cruz. Integração com Serviços Web: O Protocolo HTTP no Ecossistema Mobile.
  Material fornecido, páginas 4–20: request/response, métodos, headers, JSON, status e async/await.
- Jáderson Cruz. Persistência Local de Dados: AsyncStorage (RN) vs. SharedPreferences/Hive (Flutter).
  Material fornecido, páginas 2, 5, 7–9 e 17: volatilidade, serialização, CRUD e limites do AsyncStorage.
- https://supabase.com/docs/guides/auth/quickstarts/react-native
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.expo.dev/guides/authentication/
