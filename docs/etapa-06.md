# Etapa 6 — Integração com API ou serviço externo

O aplicativo Vai uma mão ai utiliza o Supabase para autenticar usuários e consultar,
criar, atualizar e excluir dados remotos. A integração foi implementada na Etapa 5
e atende também aos requisitos técnicos desta etapa. Este documento apresenta o
contrato de comunicação, os estados da interface e as instruções para testar a integração.

## Serviço utilizado e configuração

O serviço externo é o **Supabase**, com Auth para autenticação e API REST/RPC
para acesso ao PostgreSQL. A aplicação usa o SDK `@supabase/supabase-js`, que envia
requisições HTTPS e serializa os dados em JSON. O aplicativo não se conecta diretamente
ao PostgreSQL com senha de banco.

A URL base tem o formato `https://<referencia-do-projeto>.supabase.co` e é configurada
por `EXPO_PUBLIC_SUPABASE_URL`. A chave pública é informada em
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. O arquivo `.env.example` contém placeholders;
cada instalação deve preencher seu próprio `.env`, ignorado pelo Git.

A chave publishable identifica o projeto e o token de sessão autentica o usuário.
O SDK gerencia os cabeçalhos de autenticação. As políticas Row Level Security (RLS)
no banco restringem leitura e escrita conforme a conta autenticada. Senhas de banco,
chaves administrativas, credenciais SMTP e segredos OAuth não pertencem ao aplicativo
nem devem ser versionados. Exemplos deste documento usam dados fictícios.

## Código responsável pela integração

| Arquivo | Responsabilidade |
| --- | --- |
| `src/services/supabase.js` | Validar configuração e inicializar o SDK e a sessão |
| `src/services/http.js` | Aplicar timeout de 20 segundos e cancelamento ao fetch |
| `src/services/authService.js` | Cadastro, login, confirmação e recuperação de senha |
| `src/data/supabaseRepository.js` | Consultas, funções RPC, edição, exclusão e favoritos |
| `src/services/errors.js` | Propagar falhas e produzir mensagens para o usuário |
| `src/context/DataContext.js` | Integrar serviços às telas e atualizar o estado após respostas |
| `src/screens/SearchScreen.js` | Busca remota, paginação e estados de consulta |
| `src/screens/ProviderFormScreen.js` | Envio do formulário e feedback de gravação |
| `supabase/migrations/202610250001_etapa05.sql` | Tabelas, funções, restrições e políticas de acesso |

## Endpoints e métodos HTTP

Os caminhos abaixo são relativos à URL base. O SDK monta a URL, filtros e corpo;
os métodos do repositório não são chamadas diretas ao banco.

| Operação | Método | Endpoint | Dados principais |
| --- | --- | --- | --- |
| Consultar conta | GET | `/rest/v1/profiles` | Filtro `id`; retorna perfil privado |
| Consultar categorias | GET | `/rest/v1/categories` | Ordenação por nome; retorna lista |
| Consultar prestador próprio ou detalhes | GET | `/rest/v1/providers` | Filtro `user_id` ou `id`, incluindo categoria |
| Consultar favoritos | GET | `/rest/v1/favorites` | Filtro `user_id`, prestadores relacionados e paginação de 200 |
| Buscar prestadores | POST | `/rest/v1/rpc/search_providers` | Filtros e paginação em JSON; retorna lista |
| Criar ou recuperar rascunho | POST | `/rest/v1/rpc/begin_provider` | Sem parâmetros; retorna prestador |
| Salvar rascunho, publicar ou editar | POST | `/rest/v1/rpc/save_provider` | `p_data` e `p_publish`; retorna prestador salvo |
| Concluir primeiro acesso | PATCH | `/rest/v1/profiles` | Filtro `id` e corpo com `onboarding_step` |
| Adicionar favorito | POST | `/rest/v1/favorites` | `user_id` e `provider_id` |
| Remover favorito | DELETE | `/rest/v1/favorites` | Filtros `user_id` e `provider_id` |
| Excluir perfil profissional | DELETE | `/rest/v1/providers` | Filtro `user_id` |

A consulta por RPC usa POST mesmo sendo uma leitura. A edição de prestador também
usa POST em `save_provider`, pois a função SQL salva o perfil e o progresso do
primeiro acesso em uma transação. PATCH é utilizado para concluir o primeiro acesso.

O serviço de autenticação utiliza os seguintes endpoints por meio do SDK:

| Operação | Método | Endpoint |
| --- | --- | --- |
| Cadastrar conta | POST | `/auth/v1/signup` |
| Entrar com senha | POST | `/auth/v1/token?grant_type=password` |
| Confirmar e-mail ou código de recuperação | POST | `/auth/v1/verify` |
| Reenviar confirmação | POST | `/auth/v1/resend` |
| Solicitar recuperação | POST | `/auth/v1/recover` |
| Atualizar senha | PUT | `/auth/v1/user` |
| Encerrar sessão neste aparelho | POST | `/auth/v1/logout?scope=local` |

Google OAuth é uma integração adicional e depende de configuração e development build.
Não é necessário habilitá-lo para demonstrar a integração de dados desta etapa.

## Estrutura dos dados enviados e recebidos

### Consulta de prestadores

Exemplo de corpo enviado a `/rest/v1/rpc/search_providers`:

```json
{
  "p_name": "Ana",
  "p_city": "São Paulo",
  "p_state": "SP",
  "p_category": null,
  "p_offset": 0,
  "p_limit": 20
}
```

`p_category` recebe o identificador da categoria ou `null`. A consulta inclui a
relação `categories(name)` na seleção. Exemplo de resposta com os campos utilizados
pelo aplicativo (o serviço pode retornar outros campos, como datas):

```json
[
  {
    "id": "11111111-1111-4111-8111-111111111111",
    "user_id": "22222222-2222-4222-8222-222222222222",
    "display_name": "Ana Serviços",
    "category_id": 1,
    "description": "Serviços de manutenção residencial.",
    "city": "São Paulo",
    "state": "SP",
    "whatsapp": "5511999990000",
    "service_modes": ["at_customer"],
    "service_regions": "Centro",
    "status": "published",
    "categories": { "name": "Eletricista" }
  }
]
```

O identificador `1` é ilustrativo: deve-se usar uma categoria existente no projeto.
Sem resultados, a resposta é `[]`. O repositório converte os nomes do serviço para
o modelo da interface, por exemplo `display_name` em `name`, `whatsapp` em `phone`
e `at_customer` em “No endereço do cliente”.

### Gravação do perfil

Exemplo de corpo enviado a `/rest/v1/rpc/save_provider`:

```json
{
  "p_data": {
    "display_name": "Ana Serviços",
    "category_id": 1,
    "description": "Serviços de manutenção residencial.",
    "city": "São Paulo",
    "state": "SP",
    "whatsapp": "5511999990000",
    "service_modes": ["at_customer"],
    "service_regions": "Centro"
  },
  "p_publish": true
}
```

O aplicativo normaliza UF e telefone antes do envio. `p_publish: false` salva
rascunho; `true` solicita publicação com validação dos campos obrigatórios.
A função determina o proprietário pela sessão autenticada. O retorno solicitado
com `.single()` é um objeto de prestador salvo, com ID e status; não inclui
necessariamente a relação `categories`, cujo nome também pode ser resolvido pelo
catálogo carregado. A interface só confirma a gravação após a resposta sem erro.

### Favoritos e primeiro acesso

Adicionar favorito envia um objeto com UUIDs:

```json
{
  "user_id": "22222222-2222-4222-8222-222222222222",
  "provider_id": "11111111-1111-4111-8111-111111111111"
}
```

A inclusão e a remoção de favoritos não dependem de um objeto no corpo da resposta:
o app verifica o erro da operação. A restrição de unicidade impede duplicatas.
Concluir o primeiro acesso envia `{"onboarding_step":"complete"}` e solicita o
perfil privado atualizado como resposta. A exclusão do prestador solicita seu ID
no retorno; o banco remove os favoritos relacionados em cascata.

Na autenticação são enviados campos como `email`, `password` e, na confirmação,
`token` e `type`. O cadastro inclui o nome em `options.data.full_name` na chamada
do SDK. A confirmação de senha existe apenas na interface e não é enviada.
O SDK recebe dados de usuário/sessão conforme a operação; senhas e códigos digitados
não são gravados pelo aplicativo nem devem aparecer na documentação ou em logs.

## Fluxo de comunicação

1. O cliente Supabase é inicializado com a URL e a chave pública do ambiente.
   Sem configuração válida, o aplicativo apresenta uma orientação de configuração.
2. O usuário autentica e o SDK mantém a sessão, com renovação de token enquanto
   o aplicativo está ativo.
3. `DataContext` carrega conta, perfil profissional, categorias e favoritos.
4. A tela chama uma operação do contexto, que utiliza o repositório ou o serviço Auth.
5. O SDK realiza a requisição HTTPS. O Supabase valida sessão, políticas RLS,
   restrições e regras das funções SQL antes de devolver o resultado.
6. Em sucesso, o app converte os dados e atualiza a interface. Em erro, mantém
   feedback e permite corrigir ou repetir a ação.

A busca aplica um intervalo de 350 ms após alteração dos filtros e consulta páginas
de 20 registros. Respostas antigas são desconsideradas quando a consulta muda.
As gravações do contexto são enfileiradas e verificam a conta ativa. Não há fila
offline nem sincronização em tempo real: a atualização acontece ao abrir telas,
após operações e ao puxar para atualizar.

## Tratamento dos estados

| Estado | Comportamento implementado |
| --- | --- |
| Carregamento | Indicador ao carregar conta/busca, atualização da lista e botão com espera ao publicar |
| Sucesso | Prestadores exibidos, favoritos atualizados e alertas de rascunho salvo, cadastro publicado ou excluído |
| Erro | Mensagens de conexão, sessão, permissão, validação e indisponibilidade; opção de tentar novamente nas consultas |
| Ausência de dados | Busca mostra “Nenhum prestador encontrado”; favoritos mostram estado vazio; consulta de detalhe trata perfil indisponível |

`errors.js` trata, entre outros, status 401/403, 429, 5xx e falhas de rede/timeout.
O timeout é de 20 segundos. Se a conexão falhar após uma possível gravação no servidor,
o app orienta atualizar os dados antes de tentar novamente, pois o resultado pode
ser incerto. Campos do formulário são preservados em caso de falha.

## Executar a integração

1. Em um projeto Supabase novo, execute uma vez a migração
   `supabase/migrations/202610250001_etapa05.sql` no SQL Editor. Não a repita no
   projeto já configurado.
2. Habilite Email e Confirm email no Auth e configure SMTP. Os templates estão em
   `supabase/templates/confirmation.html` e `supabase/templates/recovery.html`;
   o campo `{{ .Token }}` permite digitar o código recebido no aplicativo.
3. Instale dependências e prepare o arquivo de ambiente:

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

4. Preencha a URL e a chave publishable em `.env`. Mantenha
   `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=false` se Google não estiver configurado.
5. Inicie o aplicativo e abra no Expo Go compatível com o SDK do projeto:

```powershell
npx expo start --go --clear
```

## Testar e demonstrar

| Cenário | Procedimento e resultado esperado |
| --- | --- |
| Autenticação | Criar conta, confirmar código recebido e entrar; carregar dados da conta |
| Envio | Preencher e publicar um perfil; receber confirmação e encontrá-lo na busca |
| Consulta | Filtrar por nome/cidade/categoria e abrir detalhes; conferir dados remotos |
| Atualização | Editar descrição; atualizar a busca em outra conta e conferir o novo texto |
| Favoritos | Favoritar, reabrir o app e conferir persistência; desfavoritar e atualizar |
| Carregamento | Observar indicadores durante a consulta e o envio |
| Ausência de dados | Usar filtro sem correspondência e conferir a mensagem de lista vazia |
| Falha de rede | Desconectar a rede e consultar/salvar; conferir erro e ausência de confirmação falsa; reconectar e atualizar |
| Exclusão | Excluir o perfil com confirmação; atualizar busca/favoritos e conferir sua remoção |

Para verificação automatizada:

```powershell
npm test
```

Na execução local de **11/11/2026**, os **31 testes passaram**. A suíte inclui
contratos HTTP com o SDK real e respostas controladas, métodos, JSON, autenticação,
propagação de erros, timeout e testes de banco com PGlite para CRUD, transações e RLS.
Esses testes não validam a disponibilidade do Supabase remoto, entrega de e-mail
ou execução no aparelho. O roteiro manual acima deve ser executado para demonstrar
a integração real; esta atualização de documentação não registra sua conclusão.

## Entrega

Repositório: https://github.com/doSantus/vai-uma-mao-ai

A entrega utiliza o mesmo repositório das etapas anteriores, com o código da
integração, este documento e o README atualizado. Após revisar e commitar os arquivos,
crie a tag `etapa-06` no commit da entrega e publique a branch `main` e a tag no GitHub.
A criação e o envio da tag não são realizados pela simples inclusão deste documento.
