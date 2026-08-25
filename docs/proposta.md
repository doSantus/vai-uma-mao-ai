# Proposta e Planejamento da Aplicação Mobile - Etapa 01

## 1. Vai uma mão ai

## 2. Problema que a aplicação pretende resolver

Pessoas que precisam contratar um serviço (eletricista, diarista, professor
particular, encanador, cabeleireiro, etc.) costumam depender de indicações
informais (grupos de WhatsApp, redes sociais, boca a boca), o que torna a
busca lenta, pouco confiável e limitada a quem já conhece alguém. Do outro
lado, prestadores de serviço autônomos não têm um canal simples e gratuito
para se divulgar dentro da própria região.

O "Vai uma mão ai" resolve esse problema conectando **clientes** que procuram um
serviço a **prestadores** cadastrados na mesma cidade/estado, por meio de uma
busca simples com filtros.

## 3. Público-alvo

- **Clientes**: pessoas que precisam contratar um serviço e querem encontrar
  prestadores próximos de forma rápida.
- **Prestadores de serviço autônomos**: profissionais que quer divulgar seus
  serviços (eletricistas, diaristas, professores particulares, cabeleireiros,
  pintores, etc.) sem depender de plataformas pagas ou indicação informal.

## 4. Objetivo principal

Oferecer um aplicativo mobile simples em que prestadores possam se cadastrar
com seus dados e área de atuação, e clientes possam buscar e filtrar esses
prestadores por cidade, estado e categoria de serviço, entrando em contato
diretamente pelo WhatsApp.

## 5. Descrição das principais funcionalidades

**MVP (Etapas iniciais):**
- Cadastro/login de usuário, definindo o perfil como *cliente* ou
  *prestador*.
- Cadastro de prestador: nome, categoria de serviço, cidade, estado,
  telefone/WhatsApp e descrição.
- Busca de prestadores com filtros por cidade, estado e categoria.
- Tela de detalhes do prestador, com botão para contato direto via
  WhatsApp.
- Edição do próprio perfil (para o prestador).

**Evoluções previstas (etapas seguintes):**
- Avaliações/notas dos prestadores.
- Lista de favoritos para o cliente.
- Notificações (ex.: novo interesse recebido pelo prestador).
- Regras de segurança de acesso aos dados (Firestore Rules).
- Testes automatizados das principais telas/fluxos.
- Preparação do app para publicação (build).

## 6. Telas previstas (mínimo de 4)

1. **Login / Cadastro** - usuário escolhe entrar como cliente ou como
   prestador e informa e-mail/senha.
2. **Busca de Prestadores** - lista de prestadores com filtros de cidade,
   estado e categoria de serviço.
3. **Detalhes do Prestador** - dados completos do prestador (descrição,
   categoria, cidade/estado) e botão "Chamar no WhatsApp".
4. **Cadastro/Edição de Perfil do Prestador** - formulário para o prestador
   informar ou atualizar seus dados de divulgação.
5. **Meu Perfil** - dados básicos do usuário logado e opção de
   sair da conta.

## 7. Fluxo básico de navegação entre as telas

```
[Login / Cadastro]
        │
        ▼
 usuário é CLIENTE? ─── sim ──▶ [Busca de Prestadores] ──▶ [Detalhes do Prestador] ──▶ (WhatsApp externo)
        │                                 │
        não (é prestador)                 ▼
        │                          [Meu Perfil]
        ▼
[Cadastro/Edição de Perfil do Prestador] ──▶ [Meu Perfil]
```

A navegação principal (Busca, Perfil) será feita por uma barra de
navegação inferior (*bottom tabs*), com a tela de Detalhes do Prestador e o
formulário de Cadastro/Edição abertos como telas empilhadas (*stack*) sobre
essas abas.

## 8. Tecnologia escolhida para o desenvolvimento mobile

**React Native com Expo.**

Justificativa: o Expo permite rodar o projeto diretamente no celular físico
através do app *Expo Go*, sem necessidade de configurar Android Studio ou
Xcode, um ponto essencial considerando que este é o primeiro contato do
desenvolvedor com desenvolvimento mobile. Além disso, o Expo já fornece de
forma simplificada módulos que serão úteis nas próximas etapas, como
navegação, notificações e acesso a recursos nativos do dispositivo.

## 9. Tecnologia escolhida para o backend

**Firebase (Authentication + Cloud Firestore).**

Justificativa: dispensa a criação e manutenção de um servidor próprio desde
o zero, o que seria uma complexidade desproporcional para uma única pessoa
sem experiência prévia em mobile/backend. Ainda assim, o Firebase permite
trabalhar de forma real com os conceitos exigidos no projeto: comunicação
com API externa, autenticação de usuários e definição de regras de
segurança de acesso aos dados (Firestore Security Rules).

## 10. Necessidade de comunicação com APIs externas

Sim. A aplicação irá se comunicar com:
- **Firebase Authentication** - autenticação de usuários (cliente/prestador).
- **Cloud Firestore** - leitura e escrita dos dados de prestadores e buscas.
- **WhatsApp (deep link `wa.me`)** - para redirecionar o contato entre
  cliente e prestador sem que seja necessário implementar um chat próprio
  nesta fase do projeto.

## 11. Forma prevista de armazenamento de dados

- **Dados principais (prestadores, usuários, categorias):** Cloud Firestore
  (banco de dados na nuvem, no formato de documentos/coleções), permitindo
  consultas simples como filtrar por cidade, estado e categoria.
- **Dados locais no dispositivo:** utilização de `AsyncStorage` para
  armazenar informações leves, como sessão do usuário logado e preferências
  simples (ex.: tema claro/escuro), evitando pedir login a cada abertura do
  app.

## 12. Repositório Git contendo o projeto inicial

Repositório: `https://github.com/doSantus/vai-uma-mao-ai.git`

Tag da entrega desta etapa: **etapa-01**

> Observação: nesta Etapa 01 o objetivo é apenas propor e planejar a
> aplicação. A implementação do código-fonte (telas, navegação e
> integração com o Firebase) será desenvolvida progressivamente a partir
> das próximas etapas, evoluindo esta mesma estrutura inicial.
