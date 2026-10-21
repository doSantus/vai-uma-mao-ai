# Etapa 04 — Persistência local de dados

## Objetivo e funcionalidades

O aplicativo **Vai uma mão ai**, desenvolvido com React Native e Expo, permite
buscar profissionais, consultar seus serviços e entrar em contato pelo WhatsApp.
Nesta etapa, foram implementados o armazenamento local do perfil de prestador,
os favoritos e a sessão demonstrativa. Os dados são recuperados após encerrar
e reabrir a aplicação no mesmo dispositivo.

O usuário pode criar, consultar, editar e excluir seu perfil de prestador, além
de adicionar e remover profissionais dos favoritos. O aplicativo usa conta única,
sem seleção entre Cliente e Prestador. O login permanece demonstrativo, sem
integração com banco de dados remoto nem verificação real de senha.

## Mecanismo de persistência e justificativa

Foi utilizada a biblioteca **@react-native-async-storage/async-storage**, na versão
compatível com o SDK Expo do projeto. O AsyncStorage armazena pares de chave e
valor de forma assíncrona no dispositivo e está disponível no Expo Go.

A escolha atende ao volume reduzido de dados e à estrutura simples da aplicação.
Os registros são serializados em JSON, sem necessidade de tabelas, relacionamentos
ou consultas SQL. Não é necessário um servidor para salvar e recuperar esses dados.

O **React Context** disponibiliza os dados carregados para as telas. Ele mantém o
estado durante a execução; a permanência após encerramento é responsabilidade do
AsyncStorage. Senhas não são enviadas ao repositório de persistência nem armazenadas.

Referência: [AsyncStorage na documentação do Expo](https://docs.expo.dev/versions/latest/sdk/async-storage/).

## Estrutura dos dados armazenados

A chave utilizada é `@vai-uma-mao-ai/data-v1`. Seu nome foi mantido para permitir
leitura dos dados anteriores; a versão interna atual do documento é **2**.
O exemplo abaixo representa uma conta com um perfil salvo e dois favoritos:

```json
{
  "version": 2,
  "session": { "email": "joao@example.com" },
  "accounts": [
    {
      "email": "joao@example.com",
      "name": "",
      "role": "conta",
      "profile": {
        "id": "local-identificador-gerado",
        "name": "João Teste Etapa 4",
        "category": "Eletricista",
        "city": "Goiânia",
        "state": "GO",
        "phone": "5562999990000",
        "description": "Instalações residenciais"
      },
      "favoriteIds": ["1", "local-identificador-gerado"]
    }
  ],
  "legacyData": null
}
```

| Campo | Finalidade |
| --- | --- |
| `version` | Identifica a estrutura para validação e compatibilidade |
| `session` | Guarda o e-mail da conta ativa; `null` indica que o usuário saiu |
| `accounts` | Reúne as contas demonstrativas locais, identificadas pelo e-mail |
| `name` | Campo legado; novos cadastros não gravam aqui o nome completo |
| `role` | Novos acessos usam `conta`; tipos antigos são aceitos por compatibilidade |
| `profile` | Perfil de prestador da conta; `null` quando não há cadastro |
| `favoriteIds` | IDs dos profissionais favoritos da conta |
| `legacyData` | Dados anteriores sem proprietário, usados na migração |

O e-mail é normalizado para minúsculas e sem espaços nas extremidades. Cada conta
local tem seu próprio perfil e favoritos. Os seis profissionais de exemplo ficam
em `src/data/mockProviders.js`; a busca combina esses exemplos com o perfil salvo
da conta ativa. Favoritos armazenam IDs, evitando duplicar os dados dos profissionais.

O nome completo informado na tela de criação da conta fica **somente em memória**:
é usado no Perfil e para preencher um novo formulário de prestador. Esse rascunho
é descartado ao sair ou encerrar o aplicativo. Quando o usuário toca em **Salvar**
no formulário de prestador, o nome passa a integrar o perfil persistente. Um perfil
já salvo tem prioridade sobre o preenchimento sugerido.

## Operações de persistência implementadas

As operações estão centralizadas em [`src/data/localRepository.js`](../src/data/localRepository.js).

| Operação | Método e comportamento |
| --- | --- |
| Criar dados | `saveProfile` gera um ID para o primeiro perfil e reúne os campos informados |
| Armazenar dados | `mutate` serializa o documento com `JSON.stringify` e grava com `AsyncStorage.setItem` |
| Recuperar dados | `load` usa `getItem`, interpreta o JSON, valida a estrutura e recupera a conta ativa |
| Atualizar dados | `saveProfile` substitui os campos do perfil existente, preservando seu ID |
| Remover dados | `deleteProfile` salva `profile: null` e retira seu ID dos favoritos |
| Favoritar e desfavoritar | `toggleFavorite` inclui ou remove o ID na lista da conta ativa |
| Manter sessão | `signIn` ativa a sessão pelo e-mail e `signOut` grava sessão nula sem apagar as contas |

A exclusão de um registro regrava o documento sem ele; não é necessário apagar a
chave inteira. Perfil, favoritos e sessão ficam em uma única chave. Uma fila
serializa as escritas para impedir que ações próximas sobrescrevam alterações.
O estado confirmado só muda depois de uma gravação bem-sucedida.

Em falhas de escrita, a tela informa o problema e permite tentar novamente. Em
falhas de leitura ou estrutura inválida, a aplicação mostra uma tela de recuperação,
sem substituir os dados armazenados. A navegação só é liberada após o carregamento.

A migração da versão 1 preserva o perfil e os favoritos antigos: a primeira conta
que entrar recebe esses registros uma única vez. A mudança é confirmada junto com
a escrita do login. Se essa escrita falhar, o conteúdo anterior permanece intacto.

O compartilhamento de estado entre telas está em
[`src/context/DataContext.js`](../src/context/DataContext.js). A navegação em
[`src/navigation/index.js`](../src/navigation/index.js) abre a busca quando há sessão
e o login quando não há. Sair desmonta as telas da conta anterior.

## Telas que utilizam os dados persistidos

| Tela | Utilização |
| --- | --- |
| Login e cadastro | Ativa a sessão demonstrativa pelo e-mail; nome do novo cadastro permanece em memória |
| Perfil | Mostra identificação da conta e nome disponível; permite sair e trocar de conta |
| Meu perfil de prestador | Cria, exibe, edita e exclui o perfil, com confirmação de exclusão |
| Busca | Exibe exemplos e perfil salvo; oferece botão de favoritar |
| Detalhes do profissional | Consulta pelo ID, mostra os dados atuais e permite favoritar/desfavoritar |
| Favoritos | Mostra os profissionais salvos pela conta ativa e permite removê-los |

A edição do perfil é refletida na busca, nos detalhes e nos favoritos. Quando o
perfil é excluído, deixa de aparecer na busca e é removido dos favoritos.

Busca e formulário de prestador compartilham a pesquisa de categoria com sugestões
e o preenchimento opcional de cidade/UF por `expo-location`. Os filtros de pesquisa
e as coordenadas são temporários; cidade/UF do prestador só são persistidas ao salvar
o formulário. Os componentes oferecem rótulos de acessibilidade, indicação de
carregamento e botões com áreas de toque adequadas.

## Instruções para execução

Pré-requisitos: Node.js com npm e Expo Go no celular, compatível com o SDK do projeto.
No terminal, dentro da pasta do repositório:

```powershell
npm install
npx expo start
```

Abra o projeto pelo QR code no Expo Go. Computador e celular devem estar na mesma
rede. Se houver impedimento de conexão, encerre o servidor com `Ctrl + C` e execute:

```powershell
npx expo start --tunnel
```

Mantenha o servidor ativo durante a demonstração. O código é servido pelo computador,
mas os registros persistidos ficam no dispositivo em que o aplicativo é executado.

## Procedimento de teste de encerramento e reabertura

O roteiro abaixo permite verificar criação, armazenamento, recuperação, atualização,
remoção e apresentação dos registros. Ele deve ser executado no celular para
complementar as verificações automatizadas.

1. Na aba **Cadastrar**, informe João Teste Etapa 4, `joao@example.com` e uma senha
   de teste não vazia. O acesso é demonstrativo, sem validação em servidor.
2. Abra **Perfil → Meu perfil de prestador**. Confira o nome preenchido, digite
   `ele` e selecione Eletricista. Informe Goiânia/GO, telefone `5562999990000`
   e descrição “Instalações residenciais”. Toque em **Salvar** e aguarde a confirmação.
3. Na **Busca**, limpe filtros incompatíveis, procure João e abra seus detalhes.
   Favorite esse perfil e um profissional de exemplo. Confira os dois em **Favoritos**.
4. Aguarde os indicadores de gravação terminarem. Encerre completamente o Expo Go,
   removendo-o dos aplicativos recentes. Reabra o mesmo projeto no mesmo dispositivo.
5. Confira que a busca abre sem pedir login. Verifique o e-mail no Perfil, João na
   busca, os dados no formulário e os dois favoritos. Isso verifica a recuperação.
6. Edite a descrição para “Instalações residenciais e comerciais”. Salve, encerre
   e reabra novamente. Confira a nova descrição nos detalhes, também pelos Favoritos.
7. Remova o profissional de exemplo dos favoritos. Encerre e reabra; ele deve continuar
   na busca, mas não nos favoritos. João deve permanecer favorito.
8. Exclua seu cadastro em **Meu perfil de prestador** e confirme. Encerre e reabra;
   João deve estar ausente da busca e dos favoritos, e não deve haver perfil salvo.
9. Toque em **Perfil → Sair**, encerre e reabra. A tela inicial deve ser o login.
10. Entre com outro e-mail de teste que ainda não tenha sido usado, favorite um
    exemplo e reabra. Confira a sessão e o favorito dessa conta. Saia e volte para
    `joao@example.com`: o favorito da segunda conta não deve aparecer na primeira.

Não desinstale nem limpe os dados do Expo Go durante o teste, pois essas ações
removem o armazenamento local. Sair encerra a sessão, mas preserva as contas.
Se houver dados antigos da versão 1, eles serão atribuídos à primeira conta que
entrar após a atualização, podendo alterar o estado inicial da demonstração.

## Verificações automatizadas e evidências

Para executar os testes:

```powershell
npm test
```

Os arquivos `tests/localRepository.test.cjs` e `tests/location.test.cjs` cobrem
persistência do CRUD e favoritos entre novas instâncias do repositório, concorrência,
falhas de leitura/escrita, sessão, saída, isolamento entre contas, migração e
interpretação dos endereços. O adaptador usado nos testes de persistência mantém
strings em memória e não substitui a verificação do AsyncStorage no celular.

Para validar os bundles Android e iOS:

```powershell
npx expo export --platform android --platform ios --output-dir dist
```

Na validação de desenvolvimento, os 15 testes passaram e ambos os bundles foram
gerados. Não há registro aqui de execução do roteiro completo em dispositivo físico.
Capturas de tela ou vídeo do roteiro podem complementar a entrega, mostrando os
mesmos registros antes e depois do encerramento, sem substituir a inspeção do código.

## Limitações e próximos passos

- A conta é única; não há seletor Cliente/Prestador nem configuração para mudar tipo.
- O login é demonstrativo: qualquer senha não vazia atende à validação local da tela.
- Não há autenticação real, banco remoto ou sincronização entre dispositivos.
- O nome do novo cadastro de conta não persiste, salvo quando gravado como parte do perfil de prestador.
- Cada e-mail possui um perfil de prestador local; os exemplos não são editáveis.
- AsyncStorage não oferece criptografia para os dados armazenados; não são guardadas senhas.
- A sessão persiste até Sair; a integração futura com autenticação deverá substituir esse fluxo demonstrativo.

## Repositório e entrega

Repositório: [doSantus/vai-uma-mao-ai](https://github.com/doSantus/vai-uma-mao-ai).

A entrega deve conter a implementação, o README atualizado e este arquivo
`docs/etapa-04.md` no mesmo repositório das etapas anteriores. A tag Git `etapa-04`
deve identificar o commit final da entrega. Este documento não comprova que os
commits ou a tag já foram enviados; isso deve ser conferido no GitHub após o push.
