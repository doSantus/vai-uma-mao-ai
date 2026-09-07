# Vai uma mão ai

Aplicativo mobile que conecta clientes a prestadores de serviço autônomos
da mesma cidade/estado, por meio de busca com filtros e contato direto via
WhatsApp.

> Proposta completa da Etapa 01: [`docs/proposta.md`](docs/proposta.md)
> Documentação da Etapa 02 (interface e navegação): [`docs/etapa-02.md`](docs/etapa-02.md)

## Descrição da aplicação

O "Vai uma mão ai" permite que prestadores de serviço (eletricistas, diaristas,
professores particulares, cabeleireiros, pintores, etc.) se cadastrem com
seus dados e área de atuação, e que clientes busquem esses prestadores
filtrando por cidade, estado e categoria de serviço, entrando em contato
diretamente pelo WhatsApp.

## Problema que a aplicação resolve

Hoje a busca por prestadores de serviço costuma depender de indicações
informais (grupos de WhatsApp, redes sociais, boca a boca), o que é lento e
pouco confiável. O "Vai uma mão ai" centraliza essa busca em um único app,
simples e gratuito tanto para quem procura quanto para quem oferece o
serviço.

## Tecnologias utilizadas

- **Mobile:** React Native + Expo
- **Navegação:** React Navigation (`native-stack` + `bottom-tabs`)
- **Backend (planejado a partir da Etapa 03):** Firebase (Authentication + Cloud Firestore)
- **Armazenamento local (planejado):** AsyncStorage (sessão do usuário e preferências)
- **Contato entre usuários:** integração via deep link do WhatsApp (`wa.me`)

## Estrutura do projeto

```
vai-uma-mao-ai/
├── README.md
├── App.js
├── app.json
├── package.json
├── docs/
│   ├── proposta.md       # proposta da Etapa 01
│   ├── etapa-02.md       # documentação da Etapa 02 (interface/navegação)
│   └── arquitetura.md    # decisões técnicas do projeto, atualizado a cada etapa
├── src/
├── components/       # blocos de UI reutilizáveis (Button, Input, Screen, etc.)
├── screens/          # telas da aplicação
├── navigation/       # configuração de rotas (stacks + bottom tabs)
├── data/             # dados mockados usados nesta etapa
├── theme/            # cores, espaçamentos e tipografia
└── utils/            # helpers (ex.: responsividade)

```

## Instruções para execução

Pré-requisitos:
1. Ter o [Node.js](https://nodejs.org/) instalado.
2. Instalar o app **Expo Go** no celular (Android/iOS).

Passos:
```bash
npm install
npx expo install --fix   # alinha as versões das libs à versão do Expo SDK
npx expo start
```
Escaneie o QR code exibido no terminal/navegador com o app Expo Go. A
aplicação também pode ser executada em emulador Android
(`npx expo start --android`) ou simulador iOS (`npx expo start --ios`).

## Funcionalidades implementadas

- [x] Camada visual e navegação entre as 5 telas principais (Etapa 02)
- [x] Busca de prestadores com filtro por cidade/estado/categoria (sobre dados mockados)
- [x] Tela de detalhes do prestador com contato via WhatsApp
- [x] Formulário de cadastro/edição de perfil do prestador (validação local, sem persistência)
- [ ] Login / cadastro de usuário real (autenticação com Firebase)
- [ ] Persistência dos dados de prestadores (Cloud Firestore)

*(lista será atualizada a cada etapa, marcando o que já está pronto)*

## Limitações conhecidas

- Etapa 02: interface e navegação implementadas, mas sem persistência de
  dados nem comunicação com servidor — login, busca e cadastro usam dados
  mockados/em memória.
- Não há autenticação real nem regras de acesso a dados nesta fase.
- Filtro de localização é por texto (cidade/estado), sem uso de
  geolocalização/mapa.
- Ainda sem testes automatizados.

## Decisões técnicas

As principais decisões técnicas do projeto estão documentadas em
[`docs/arquitetura.md`](docs/arquitetura.md), atualizado a cada etapa. As
decisões específicas de interface desta etapa também estão detalhadas em
[`docs/etapa-02.md`](docs/etapa-02.md).
