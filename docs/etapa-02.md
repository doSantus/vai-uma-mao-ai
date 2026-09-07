# Etapa 02 — Interface e Navegação da Aplicação

Esta etapa evolui a proposta da Etapa 01 (`docs/proposta.md`) para uma
primeira versão **visual e navegável** do app, em React Native + Expo.
Não há persistência de dados nem comunicação com servidor nesta fase — o
foco é a camada de interface e a estrutura de componentes/telas.

## 1. Telas implementadas

| Tela | Arquivo | Descrição |
|---|---|---|
| Login / Cadastro | `src/screens/LoginScreen.js` | Tela inicial do app. Alterna entre "Entrar" e "Cadastrar" e permite escolher o perfil (Cliente/Prestador). |
| Busca de Prestadores | `src/screens/SearchScreen.js` | Lista de prestadores (dados mockados) com busca por nome e filtros de cidade, UF e categoria. |
| Detalhes do Prestador | `src/screens/ProviderDetailsScreen.js` | Perfil completo do prestador selecionado, com botão de contato via WhatsApp (deep link `wa.me`). |
| Cadastro/Edição de Perfil do Prestador | `src/screens/ProviderFormScreen.js` | Formulário para o prestador informar/atualizar seus dados de divulgação. |
| Meu Perfil | `src/screens/ProfileScreen.js` | Dados do usuário logado, atalho para o cadastro de prestador e opção de sair. |

Isso cobre a tela inicial + 4 telas adicionais exigidas pelo enunciado (5 telas no total, coerente com a proposta da Etapa 01).

## 2. Navegação entre as telas

Estrutura implementada em `src/navigation/index.js`:

- **Stack raiz**: `Login` → `Main`.
- **Main**: `Bottom Tabs` com duas abas — **Busca** e **Perfil**.
  - Aba **Busca**: stack interno `SearchHome` → `ProviderDetails`.
  - Aba **Perfil**: stack interno `ProfileHome` → `ProviderForm`.

Essa combinação (tabs na navegação principal + stacks empilhados dentro de
cada aba) segue o padrão recomendado pelo React Navigation para apps com
navegação primária por abas e fluxos secundários (detalhe, formulário) que
precisam de botão de "voltar".

## 3. Principais componentes utilizados

Bibliotecas de terceiros:
- `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs` — navegação (stacks + abas).
- `react-native-screens` e `react-native-safe-area-context` — dependências exigidas pelo React Navigation e tratamento de área segura (notch, barra de status).
- `@expo/vector-icons` (Ionicons) — ícones (busca, localização, WhatsApp, abas, etc.).

Componentes próprios (`src/components/`), usados nas 5 telas:
- **Screen** — wrapper de tela (SafeArea + `KeyboardAvoidingView` + largura máxima em telas grandes).
- **Button** — botão com variantes (`primary`, `secondary`, `outline`, `ghost`, `whatsapp`) e estado de carregamento.
- **Input** — campo de texto com label, ícone opcional, suporte a multilinha e mensagem de erro.
- **Avatar** — círculo com iniciais do nome (evita depender de foto de perfil nesta fase).
- **Badge** — "pílula" para destacar a categoria de serviço.
- **ProviderCard** — card de prestador usado na listagem de busca.
- **FilterBar** — busca por nome + filtros de cidade/UF/categoria.
- **EmptyState** — estado de "nenhum resultado encontrado".
- **SegmentedControl** — seletor Cliente/Prestador na tela de login.

## 4. Componentes reutilizáveis

Os nove componentes de `src/components/` foram desenhados para não conhecer
nenhuma tela específica — recebem tudo por *props* — e por isso são
reaproveitados em mais de um lugar:

- **Screen** é usado nas 5 telas.
- **Button** é usado em Login, Detalhes do Prestador (variante `whatsapp`), Formulário de Prestador e Meu Perfil (variante `outline` para "Sair").
- **Input** é usado em Login, Busca (dentro do `FilterBar`) e no Formulário de Prestador.
- **Avatar** é usado no `ProviderCard`, em Detalhes do Prestador e em Meu Perfil.
- **Badge** é usado no `ProviderCard` e em Detalhes do Prestador.

Essa separação entre `components/` (blocos reutilizáveis) e `screens/`
(telas que combinam esses blocos e a lógica de cada fluxo) é a organização
de diretórios adotada no projeto.

## 5. Elementos de entrada de dados

- **Login/Cadastro**: campos de e-mail e senha (com `secureTextEntry`), campo de nome (somente no modo Cadastro), seletor de perfil Cliente/Prestador.
- **Busca de Prestadores**: campo de texto para busca por nome, campos de cidade e UF, chips de seleção única para categoria.
- **Cadastro/Edição de Perfil do Prestador**: nome, chips de categoria, cidade, UF, telefone/WhatsApp (`keyboardType="phone-pad"`) e descrição (campo multilinha).

Todos os formulários fazem validação simples no cliente (campos
obrigatórios) antes de prosseguir, exibindo mensagem de erro abaixo do
campo — sem envio real dos dados para um servidor nesta etapa.

## 6. Estratégias de adaptação a diferentes tamanhos de tela

- **Flexbox como base**: nenhuma tela usa posicionamento absoluto ou
  dimensões fixas para o layout principal; tudo é organizado com `flex`,
  `flexDirection` e `gap`/`margin`, o que já adapta o conteúdo a diferentes
  alturas e larguras de tela.
- **Largura máxima em telas grandes**: o componente `Screen` aplica
  `maxWidth` e centraliza o conteúdo quando `isTablet` (`largura >= 768px`,
  ver `src/utils/responsive.js`) é verdadeiro, evitando que formulários e
  textos fiquem esticados de ponta a ponta em tablets.
- **SafeAreaView**: todas as telas respeitam a área segura do dispositivo
  (notch, ilha dinâmica, barra de status), evitando que conteúdo fique
  escondido atrás de elementos do sistema.
- **KeyboardAvoidingView**: nas telas com formulário, o teclado não cobre
  os campos de entrada.
- **Listas com rolagem**: a lista de prestadores (`FlatList`) e os chips de
  categoria (`ScrollView horizontal`) rolam em vez de estourar a tela em
  dispositivos menores.
- **Escala de fonte**: `src/utils/responsive.js` disponibiliza uma função
  `scale()`/`moderateScale()` baseada na largura da tela (referência de
  375px), pronta para ser usada em textos que precisem crescer/diminuir
  proporcionalmente conforme o dispositivo, além das constantes `isTablet`
  e `isSmallDevice` para ajustes pontuais.

## 7. Instruções para execução da aplicação

Pré-requisitos:
1. [Node.js](https://nodejs.org/) instalado (LTS recomendado).
2. App **Expo Go** instalado no celular (Android ou iOS).

Passos:
```bash

npm install
npx expo install --fix
npx expo start
```
Em seguida, escaneie o QR code exibido no terminal/navegador com o app
Expo Go (Android: opção de escanear dentro do próprio app; iOS: câmera
nativa). A aplicação também pode ser aberta em um emulador Android
(`npx expo start --android`) ou simulador iOS (`npx expo start --ios`), se
configurados na máquina.

Fluxo de teste sugerido:
1. Abrir o app → tela de Login.
2. Preencher e-mail/senha (qualquer valor) e tocar em "Entrar" → cai na aba Busca.
3. Testar os filtros (nome, cidade, UF, categoria) sobre a lista de prestadores mockados.
4. Tocar em um prestador → ver a tela de Detalhes → testar o botão "Chamar no WhatsApp".
5. Ir para a aba Perfil → "Meu perfil de prestador" → testar o formulário de cadastro.
6. Tocar em "Sair" → volta para a tela de Login.

## 8. Principais decisões de interface tomadas nesta etapa

- **Paleta e tipografia centralizadas** (`src/theme/index.js`): evita
  "cores mágicas" espalhadas pelas telas e facilita qualquer ajuste futuro
  de identidade visual sem precisar mexer em cada componente.
- **Verde-petróleo como cor primária**: transmite a ideia de confiança e
  parceria (conecta cliente e prestador), reservando o verde do WhatsApp
  apenas para o botão de contato, que é uma ação bem específica e
  reconhecível para o usuário.
- **Navegação por abas na base + telas empilhadas**: a Busca e o Perfil são
  os dois destinos que o usuário acessa com mais frequência, por isso
  ficam fixos na barra inferior; Detalhes e Formulário são fluxos
  secundários, então ficam empilhados com botão de voltar.
- **Dados mockados em vez de mocks "soltos" na tela**: os prestadores de
  exemplo ficam isolados em `src/data/mockProviders.js`, simulando o
  formato que viria do Firestore nas próximas etapas — isso deve reduzir o
  retrabalho quando a integração com o backend for implementada.
- **Cards em vez de lista simples de texto**: a listagem de prestadores usa
  cards com avatar, categoria em destaque (badge) e localização, pensando
  em como o cliente compara rapidamente várias opções.
- **Chips de categoria em vez de um seletor tipo `<select>`**: em mobile,
  chips com rolagem horizontal são mais rápidos de tocar do que abrir um
  menu suspenso, tanto na busca quanto no formulário de cadastro.
- **Sem autenticação/persistência real neste momento**: propositalmente
  fora do escopo da Etapa 02; os formulários já validam campos obrigatórios
  no cliente, para que a transição para Firebase Authentication/Firestore
  na próxima etapa seja apenas a troca da função de submit, sem redesenhar
  as telas.


