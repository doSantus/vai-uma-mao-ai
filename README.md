# Vai uma mão ai

> **Cadastro atual:** conta única, com nome completo, e-mail e senha de demonstração.
> Não há seleção Cliente/Prestador nem configuração para alterar o tipo de conta.
> O nome do novo cadastro fica apenas em memória, preenchendo o perfil e o nome de
> um novo cadastro de prestador. Sair ou encerrar o app descarta esse rascunho.
> A sessão por e-mail e os favoritos mantêm a persistência anterior. Se o usuário
> salvar explicitamente o formulário de prestador, seus campos continuam persistentes.
> As referências a modos Cliente/Prestador abaixo descrevem a versão anterior;
> os dados antigos seguem compatíveis, mas o seletor não faz parte da interface atual.

Aplicativo mobile que conecta clientes a prestadores de serviço autônomos
da mesma cidade/estado, por meio de busca com filtros e contato direto via
WhatsApp.

> Proposta completa da Etapa 01: [`docs/proposta.md`](docs/proposta.md)
> Documentação da Etapa 02 (interface e navegação): [`docs/etapa-02.md`](docs/etapa-02.md)
> Documentação da Etapa 04 (persistência local): [`docs/etapa-04.md`](docs/etapa-04.md)

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
- **Armazenamento local:** AsyncStorage (sessão demonstrativa, modo Cliente/Prestador, perfil e favoritos por conta)
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
│   └── etapa-04.md       # persistência e roteiro de demonstração
├── src/
├── components/       # blocos de UI reutilizáveis (Button, Input, Screen, etc.)
├── screens/          # telas da aplicação
├── navigation/       # configuração de rotas (stacks + bottom tabs)
├── data/             # exemplos e repositório de persistência
├── context/          # dados compartilhados entre as telas
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
npx expo start
```
Escaneie o QR code exibido no terminal/navegador com o app Expo Go. A
aplicação também pode ser executada em emulador Android
(`npx expo start --android`) ou simulador iOS (`npx expo start --ios`).

## Funcionalidades implementadas

- [x] Camada visual e navegação entre as 5 telas principais (Etapa 02)
- [x] Busca por cidade/estado/profissão sobre exemplos e perfil cadastrado localmente
- [x] Tela de detalhes do prestador com contato via WhatsApp
- [x] Cadastro, edição e exclusão do perfil de prestador com persistência local
- [x] Favoritar e desfavoritar na busca e nos detalhes, com aba Favoritos
- [x] Recuperação da sessão, do modo de acesso, do perfil e dos favoritos ao reabrir o aplicativo
- [x] Sair e trocar de conta mantendo os dados locais de cada e-mail
- [ ] Login / cadastro de usuário real (autenticação com Firebase)
- [ ] Sincronização dos dados entre dispositivos (Cloud Firestore)

*(lista será atualizada a cada etapa, marcando o que já está pronto)*

## Limitações conhecidas

- Os dados persistidos pertencem ao dispositivo: um perfil de prestador e uma
  lista de favoritos. Os exemplos do catálogo são somente para demonstração.
- Não há autenticação real nem regras de acesso a dados nesta fase.
- Filtro por cidade/estado com preenchimento opcional pela localização do
  dispositivo; ainda sem mapa ou busca por distância.
- O login continua demonstrativo: não há verificação real de senha. O e-mail
  identifica a conta local. Sair encerra a sessão sem apagar perfil/favoritos.
  Cada e-mail tem seus próprios dados, e senhas não são armazenadas.
- Desinstalar o aplicativo/Expo Go ou limpar seus dados remove o armazenamento local.

## Decisões técnicas

As decisões de persistência e o roteiro para testar fechamento/reabertura estão
em [`docs/etapa-04.md`](docs/etapa-04.md). As decisões iniciais de interface estão
em [`docs/etapa-02.md`](docs/etapa-02.md).

Execute `npm test` para validar criação, edição, exclusão, favoritos, concorrência
e falhas de armazenamento. Os testes usam um adaptador em memória; o roteiro no
Expo Go verifica o armazenamento nativo no dispositivo.

## Busca por profissão e localização

A busca oferece sugestões ao digitar parte de uma profissão. Toque em uma
sugestão para aplicar o filtro; use **Limpar profissão** para removê-lo.
A comparação ignora acentos e maiúsculas, e prioriza nomes que começam pelo
texto digitado. As sugestões usam o catálogo local de categorias.

O botão **Usar minha localização** solicita permissão de localização durante
uso, obtém a posição e consulta cidade e estado com `expo-location`.
A aplicação converte o nome do estado brasileiro para UF e mantém os campos
editáveis. Aceita nomes de estado em português/inglês, siglas e códigos como
`BR-SP`; quando `city` está vazio, considera `subregion` como alternativa de
município, descartando divisões explicitamente regionais. Confira o resultado,
pois os campos administrativos variam conforme o serviço do dispositivo.
Resultados parciais preenchem somente o campo identificado e pedem para conferir
o outro. As mensagens distinguem falha ao obter posição de falha ao consultar endereço.
Negar a permissão, desligar o GPS ou uma falha na consulta não
impede a busca manual. A consulta tem limite de espera de 20 segundos após
a verificação da permissão e dos serviços. Não há acompanhamento em segundo plano.
O preenchimento automático é destinado ao Android/iOS; na web, os campos são manuais.

### Bibliotecas e acessibilidade

- React e componentes do React Native: estado do campo, sugestões e seleção,
  sem biblioteca adicional de autocomplete.
- `expo-location`: `requestForegroundPermissionsAsync`,
  `getCurrentPositionAsync` e `reverseGeocodeAsync`.
- `@expo/vector-icons`, já presente: ícones de busca e localização.
- Recursos nativos de acessibilidade: rótulos, dicas, identificação dos botões,
  anúncio do resultado da localização e alvos de toque com altura mínima de 48.
- Filtros e resultados compartilham a rolagem vertical para permitir acesso aos
  campos e sugestões em telas pequenas e com tamanho de fonte aumentado.

### Teste no Expo Go

1. Execute `npm install` e `npx expo start`, depois abra o projeto no Expo Go.
2. Digite `ele` no campo Profissão e selecione Eletricista; confira os resultados.
3. Limpe a profissão e digite `moveis`; confira a sugestão Montador(a) de móveis.
4. Digite um termo inexistente e confira a mensagem sem sugestões.
5. Toque em Usar minha localização, permita o acesso e confira cidade/UF.
6. Edite ou limpe cidade/UF manualmente e confira a atualização da busca.
7. Verifique também permissão negada, GPS desativado e conexão indisponível.
8. Com TalkBack/VoiceOver e fonte ampliada, navegue pelos campos e sugestões.

Os prestadores de exemplo são de Goiás, somados ao seu cadastro local. Uma localização real
fora das cidades cadastradas pode mostrar zero resultados; limpe cidade/UF
para consultar todos. A mensagem personalizada de permissão em `app.json`
é aplicada a builds próprios; o Expo Go utiliza suas permissões nativas.

## Sessão persistente e troca de conta

Depois de entrar, o aplicativo restaura a sessão e o tipo Cliente/Prestador ao
reabrir. Em Perfil aparecem o e-mail e o tipo de acesso. Para trocar de conta,
use **Perfil → Sair** e entre com outro e-mail. Ao voltar ao e-mail anterior,
seu perfil e seus favoritos serão recuperados. O tipo de acesso não restringe
funcionalidades nesta demonstração.

Os dados antigos, ainda sem conta, são vinculados uma única vez ao primeiro
e-mail que entrar após a atualização. A senha serve apenas à validação da tela
demonstrativa e não é passada ao armazenamento. Não use isso como autenticação
de produção.

## Categoria e localização no cadastro do prestador

Em **Perfil → Meu perfil de prestador**, a categoria é escolhida digitando parte
da profissão e tocando em uma sugestão. O campo começa vazio em cadastros novos;
na edição, mostra a categoria salva. Limpar ou alterar o texto exige selecionar
uma sugestão novamente antes de salvar.

O botão **Usar minha localização** preenche cidade/UF com o mesmo tratamento da
busca, incluindo permissão, falhas e resultados parciais. Os campos podem ser
corrigidos manualmente. A localização só integra o cadastro persistente ao salvar.

`CategoryAutocomplete` e `LocationFields` são componentes React Native reutilizados
nas duas telas. O hook `useDeviceLocation` centraliza o uso de `expo-location`.
Nenhuma biblioteca adicional foi necessária.

Para conferir no Expo Go: abra um cadastro novo, digite `ele`, selecione Eletricista,
teste o botão de localização, complete os demais campos e salve. Reabra o formulário
para conferir os valores persistidos. Teste também limpar a categoria e tentar salvar,
negar a permissão de localização e preencher cidade/UF manualmente.
