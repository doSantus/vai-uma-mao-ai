# Etapa 07 — Estado global e recursos do dispositivo

O Vai uma mão ai usa React Context para compartilhar sessão, perfil e favoritos entre telas e integra a localização nativa à busca e ao cadastro de profissionais. Esta etapa aperfeiçoa a implementação existente e documenta como verificar os requisitos no código e no aparelho.

Repositório: [doSantus/vai-uma-mao-ai](https://github.com/doSantus/vai-uma-mao-ai).

## Mecanismo de gerenciamento de estado

O `DataProvider`, em `src/context/DataContext.js`, combina `createContext`, `useContext`, `useState`, `useEffect` e `useRef`. Em `App.js`, ele envolve `AppNavigator`, oferecendo uma instância compartilhada para toda a navegação. As telas consomem o estado e as operações pelo hook `useData()`.

Context é compatível com React Native e suficiente para o tamanho do aplicativo. Centralizar operações evita que cada tela mantenha uma cópia independente dos favoritos ou da sessão. Não foi necessário adicionar Redux ou outra biblioteca.

| Estado global | Consumidores e justificativa |
| --- | --- |
| Sessão (`authSession` / `session`) | Navegação, perfil e operações autenticadas precisam identificar a mesma conta. |
| Conta e progresso (`data.account`, `onboarding`, `onboardingStep`) | Navegação e cadastro precisam concordar sobre o primeiro acesso e sua conclusão. |
| Perfil e rascunho (`data.own`, `profile`, `providerDraft`) | Perfil e formulário compartilham o cadastro confirmado pelo servidor, inclusive ao retomar um rascunho. |
| Favoritos (`data.favorites`, `favorites`, `favoriteIds`) | Corações na busca e nos detalhes, lista e contador de Favoritos refletem as mesmas alterações. |
| Categorias (`data.categories`) | Busca e formulário utilizam o mesmo catálogo ativo. |
| Prestadores conhecidos (`known`, `providers`) | Busca, detalhes e favoritos reutilizam registros consultados durante a sessão; não é uma cópia de todo o catálogo. |
| Recuperação, atualização e falhas (`recovery`, `revision`, `refreshing`, `loadError`) | Coordenam navegação de recuperação, atualização após gravações e retorno de carregamento/erro. |

Os campos em edição, filtros da busca e mensagens/carregamento de localização permanecem locais às telas. Compartilhar um hook reutiliza comportamento, mas não torna seu estado global. O serviço `preferences` é acessível pelo contexto; os filtros são estado local persistido no AsyncStorage por projeto e UUID.

### Consistência e persistência

`mutate()` serializa gravações; só aplica mudanças ao contexto depois do sucesso do repositório. A revisão dispara novas consultas da busca. A identidade da conta e o contador de requisições descartam leituras antigas de `refreshData()`. Ao trocar de conta, os dados e prestadores conhecidos são limpos e o indicador de atualização é reiniciado. A navegação usa a identidade da sessão como chave, remontando o fluxo da conta.

Favoritar em Busca ou Detalhes chama `toggleFavorite()` e atualiza `favorites`/`favoriteIds`; `FavoriteButton` e `FavoritesScreen` leem esses mesmos valores. Uma falha de gravação mantém o estado anterior e apresenta erro, permitindo repetir. O Supabase persiste favoritos e perfil; o SDK restaura a sessão com AsyncStorage. Context sozinho não persiste dados ao fechar o processo.

Não há sincronização em tempo real entre aparelhos nem fila offline. Atualizações externas são consultadas ao abrir telas ou puxar para atualizar. Os testes do antigo repositório local são históricos e não comprovam, sozinhos, o contexto atual.

## Recurso nativo e justificativa

O recurso escolhido é **localização em primeiro plano**, pela biblioteca `expo-location`. Ele reduz erros de digitação de cidade/UF ao encontrar profissionais e preencher o próprio perfil. A integração usa posição do dispositivo e geocodificação reversa, sem coordenadas fictícias no fluxo de produção.

Código verificável:

- `src/hooks/useDeviceLocation.js`: permissão, disponibilidade, posição, geocodificação, prazo e falhas.
- `src/utils/location.js`: conversão de estados brasileiros para UF e seleção do município.
- `src/components/LocationFields.js`: botão, indicador, campos e mensagens acessíveis.
- `src/screens/SearchScreen.js`: cidade/UF obtidas alimentam filtros da consulta remota.
- `src/screens/ProviderFormScreen.js`: cidade/UF obtidas entram no rascunho ou perfil após salvar.
- `app.json`: configuração do plugin e justificativa da permissão.

### Permissões e privacidade

No Android, o plugin declara `ACCESS_COARSE_LOCATION` e `ACCESS_FINE_LOCATION`; o aplicativo solicita autorização em tempo de execução por `requestForegroundPermissionsAsync()`. No iOS, solicita autorização **When In Use**, com a mensagem `locationWhenInUsePermission` configurada no plugin. Uma autorização aproximada pode reduzir a precisão do município retornado; os campos continuam editáveis.

A solicitação ocorre apenas ao tocar em **Usar minha localização**. Não são solicitadas permissões de segundo plano, câmera, galeria ou notificações. As opções de localização em segundo plano e serviço Android estão explicitamente desabilitadas. Não há monitoramento contínuo.

Latitude e longitude são usadas transitoriamente pelo serviço nativo de geocodificação e não são gravadas no Supabase ou nos filtros pelo aplicativo. Cidade/UF podem ser persistidas nos filtros locais e no perfil quando o usuário salva; um perfil publicado expõe esses campos. Não se deve considerar a geocodificação uma operação garantidamente offline.

No Expo Go, as permissões pertencem ao aplicativo hospedeiro. Para verificar a mensagem e a configuração nativa próprias, use uma development build reconstruída após alterar `app.json`. Referências: [Expo Location SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/location/) e [permissões no Expo](https://docs.expo.dev/guides/permissions/).

### Fluxo de utilização

1. Entrar na conta e abrir Busca ou o cadastro/edição em Perfil.
2. Tocar em **Usar minha localização**. O botão e os campos de cidade/UF ficam temporariamente indisponíveis, com indicador de progresso.
3. Autorizar a localização durante o uso do aplicativo.
4. O hook verifica o serviço, obtém a posição com `Accuracy.Balanced` e chama `reverseGeocodeAsync()`.
5. O aplicativo normaliza o endereço e preenche cidade/UF. O usuário confere e pode corrigir.
6. Na busca, a alteração dos filtros consulta os prestadores. No cadastro, o usuário salva rascunho ou publica o perfil; obter localização não publica dados automaticamente.

### Falhas e indisponibilidade

| Situação | Comportamento |
| --- | --- |
| Permissão negada | Explica a negativa e mantém digitação manual, sem consultar a posição. |
| Permissão bloqueada | Orienta habilitar nas configurações do dispositivo ou preencher manualmente. |
| Serviço de localização desligado | Informa a indisponibilidade e libera nova tentativa. |
| Posição ou endereço demorados | Limite de 20 segundos após a resposta de permissão, incluindo a verificação do serviço; libera a interface e informa a falha. A espera pela decisão do usuário no diálogo não entra nesse prazo. |
| Erro de posição/geocodificação | Diferencia a falha de posição da consulta de endereço; mantém campos existentes e permite tentar novamente. |
| Endereço vazio ou estrangeiro | Não inventa cidade/UF; informa a ausência e preserva os campos. |
| Endereço parcial brasileiro | Preenche o campo identificado e limpa o complementar antigo, evitando misturar cidades/estados de consultas diferentes; pede completar o que falta. |
| Toques repetidos | Uma referência bloqueia consultas simultâneas da mesma instância. |
| Tela desmontada ou resposta após prazo | Não altera campos da tela desmontada; uma posição tardia não inicia geocodificação. Chamadas nativas já iniciadas podem terminar, mas seu resultado é descartado. |
| Web | Orienta usar o celular ou digitar manualmente; não solicita localização. |

As mensagens usam região acessível e anúncio para leitor de tela. A publicação do perfil exige cidade e UF válidas; a busca permite filtros parciais.

## Execução e testes

Configure o Supabase conforme o [README](../README.md#executar) e a [Etapa 05](etapa-05.md). São necessárias URL e chave pública válidas no `.env`, migração aplicada e uma conta confirmada. Não use chaves administrativas. No PowerShell, na raiz:

```powershell
npm ci
# Apenas se o arquivo ainda não existir:
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Preencha .env antes de iniciar.
npx expo start --go --clear
```

Abra em aparelho Android/iOS com Expo Go compatível com SDK 58. Para development build já instalada, use `npx expo start --dev-client --clear`. Em simuladores, configure uma posição simulada pelo sistema; a ausência de GPS/endereço deve ser tratada como indisponibilidade.

### Verificações automatizadas

```powershell
npm test
npx expo-doctor
npx expo export --platform android --platform ios --output-dir dist
```

`tests/deviceLocation.test.cjs` executa o fluxo do hook com APIs nativas, estado e relógio controlados: sucesso, negativa/bloqueio, GPS desligado, web, endereço parcial/vazio, falhas, repetição, desmontagem e timeout. `tests/location.test.cjs` valida a normalização. Os testes de serviços e banco cobrem persistência, isolamento e regras de favoritos/perfis.

Em 17/11/2026, `npm test` passou com **38 testes**. O teste do hook simula as fronteiras React/nativas; não comprova montagem real, diálogo do sistema, qualidade do GPS ou acesso ao Supabase remoto. O roteiro abaixo precisa ser executado no aparelho.

As dependências foram alinhadas às versões recomendadas do SDK 58, com **20/20 verificações do Expo Doctor**. A exportação Android/iOS foi validada. No ambiente Windows de validação, o Hermes falhou no diretório temporário do sandbox; a exportação funcionou com uma pasta temporária dentro do projeto, sem alterar o código para contornar o compilador:

```powershell
New-Item -ItemType Directory -Force .expo/tmp | Out-Null
$env:TEMP = Join-Path (Get-Location) '.expo/tmp'
$env:TMP = $env:TEMP
npx expo export --platform android --platform ios --output-dir dist
```

Essas variáveis valem para a sessão atual do terminal. `.expo` e `dist` são ignorados pelo Git. A instalação informou 37 alertas de vulnerabilidade nas dependências (2 moderados, 34 altos e 1 crítico), ainda sujeitos a análise específica; não foi aplicada uma atualização forçada com possíveis quebras de compatibilidade.

### Roteiro manual de aceitação

Use duas contas confirmadas e pelo menos um prestador publicado. Registre aparelho, sistema, data e resultado; não inclua credenciais nem dados pessoais nas evidências.

| Caso | Ação e resultado esperado |
| --- | --- |
| Estado entre telas | Na Busca, favoritar um prestador; abrir Detalhes e Favoritos. Coração, contador e lista devem concordar. Remover e voltar à Busca; o coração deve ficar desmarcado. |
| Persistência | Favoritar, fechar/reabrir e autenticar se necessário. O favorito deve ser carregado do servidor. |
| Isolamento | Sair da conta A e entrar na B; favoritos e perfil de A não devem aparecer como dados próprios de B. |
| Perfil compartilhado | Salvar rascunho e retomá-lo em Perfil; publicar/editar e conferir Perfil, Busca e Detalhes após atualização. |
| Falha de gravação | Sem internet, tentar favoritar; deve aparecer erro sem confirmar uma alteração que falhou. Restaurar rede e repetir. |
| Localização na busca | Autorizar pelo botão, conferir cidade/UF e resultados filtrados. Corrigir manualmente se necessário. |
| Localização no cadastro | Preencher pela localização, revisar e salvar rascunho; reabrir e conferir os campos persistidos. |
| Negativa e bloqueio | Revogar permissão nas configurações, negar no diálogo e testar o estado bloqueado quando disponível; deve ser possível digitar e continuar. |
| GPS desligado | Desativar localização e tocar no botão; observar mensagem e recuperação ao reativar. |
| Sem endereço/rede | Testar ausência de rede/posição disponível; observar erro ou endereço disponível em cache, sem travamento. Casos determinísticos de endereço parcial e timeout estão nos testes automatizados. |
| Navegação durante consulta | Iniciar localização e sair da tela antes do retorno; não deve preencher outra tela nem quebrar a navegação. |

## Entrega no GitHub

A tag deve apontar para o commit que contém esta implementação e documentação. Não crie a tag antes de confirmar as alterações. Na branch `main`, revise e execute:

```powershell
git status --short
git add README.md app.json package.json package-lock.json src/context/DataContext.js src/hooks/useDeviceLocation.js tests/deviceLocation.test.cjs docs/etapa-07.md
git diff --cached --stat
git commit -m "Conclui etapa 07 com estado global e localizacao nativa"
git tag -a etapa-07 -m "Entrega da Etapa 07"
git push origin main
git push origin etapa-07
```

Se a tag já existir, confira `git show etapa-07` antes de prosseguir; não sobrescreva uma entrega publicada automaticamente. Após o push, confira a [tag etapa-07](https://github.com/doSantus/vai-uma-mao-ai/tree/etapa-07). Os comandos de commit, tag e push ficam para execução pelo responsável, conforme solicitado.
