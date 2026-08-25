# ServiçoPerto

Aplicativo mobile que conecta clientes a prestadores de serviço autônomos
da mesma cidade/estado, por meio de busca com filtros e contato direto via
WhatsApp.

>  Proposta completa da Etapa 01: [`docs/proposta.md`](docs/proposta.md)

## Descrição da aplicação

O ServiçoPerto permite que prestadores de serviço (eletricistas, diaristas,
professores particulares, cabeleireiros, pintores, etc.) se cadastrem com
seus dados e área de atuação, e que clientes busquem esses prestadores
filtrando por cidade, estado e categoria de serviço, entrando em contato
diretamente pelo WhatsApp.

## Problema que a aplicação resolve

Hoje a busca por prestadores de serviço costuma depender de indicações
informais (grupos de WhatsApp, redes sociais, boca a boca), o que é lento e
pouco confiável. O ServiçoPerto centraliza essa busca em um único app,
simples e gratuito tanto para quem procura quanto para quem oferece o
serviço.

## Tecnologias utilizadas

- **Mobile:** React Native + Expo
- **Backend:** Firebase (Authentication + Cloud Firestore)
- **Armazenamento local:** AsyncStorage (sessão do usuário e preferências)
- **Contato entre usuários:** integração via deep link do WhatsApp (`wa.me`)

## Instruções para execução

> Etapa 01: o código-fonte da aplicação ainda será desenvolvido nas
> próximas etapas. Esta seção será atualizada conforme o projeto evoluir.

Pré-requisitos (planejados):
1. Ter o [Node.js](https://nodejs.org/) instalado.
2. Instalar o app **Expo Go** no celular (Android/iOS).
3. Clonar este repositório e instalar as dependências com `npm install`.
4. Rodar `npx expo start` e escanear o QR code com o Expo Go.

## Funcionalidades implementadas

- [ ] Login / cadastro de usuário (cliente ou prestador)
- [ ] Cadastro de prestador de serviço
- [ ] Busca de prestadores com filtro por cidade/estado/categoria
- [ ] Tela de detalhes do prestador com contato via WhatsApp
- [ ] Edição de perfil do prestador

*(lista será atualizada a cada etapa, marcando o que já está pronto)*

## Limitações conhecidas

- Etapa 01: projeto ainda em fase de proposta e planejamento, sem
  código-fonte funcional implementado.
- Filtro de localização será por texto (cidade/estado), sem uso de
  geolocalização/mapa nesta fase inicial.

## Decisões técnicas

As principais decisões técnicas do projeto estão documentadas em
[`docs/arquitetura.md`](docs/arquitetura.md), que será preenchido a partir
do início da implementação.
