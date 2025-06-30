# Dashboard de Tarefas - SUNO (Refatorado)

Este projeto apresenta um dashboard interativo para visualização e gerenciamento de tarefas e projetos, com diferentes perspectivas (Timeline por Equipe, Timeline por Cliente, Kanban por Time).

## Estrutura do Projeto

O projeto segue uma estrutura modular para facilitar a manutenção e escalabilidade:

```
/DashboardSuno/
|-- css/                     # Arquivos de estilo
|   |-- base.css             # Estilos globais, reset, variáveis
|   |-- components.css       # Estilos para componentes reutilizáveis (cards, botões, etc.)
|   |-- kanban.css           # Estilos específicos da visualização Kanban
|   |-- layout.css           # Estilos de layout principal (header, footer, grid)
|   |-- timeline.css         # Estilos específicos da visualização Timeline (Vis.js)
|
|-- js/                      # Arquivos JavaScript
|   |-- components/          # Componentes de UI e lógica reutilizável
|   |   |-- filterComponents.js # Funções para criar e gerenciar filtros (selects, checkboxes)
|   |   |-- uiComponents.js     # Funções de UI genéricas (loading, notificações, modais)
|   |
|   |-- services/            # Serviços para lógica de negócio e acesso a dados
|   |   |-- dataService.js      # Carregamento, pré-processamento e filtragem de dados (dados.json)
|   |   |-- exportService.js    # Funcionalidade de exportação para CSV
|   |   |-- timelineService.js  # Lógica específica da biblioteca Vis.js (criação, manipulação)
|   |
|   |-- views/               # Lógica específica de cada página/visualização
|   |   |-- clientsView.js      # Lógica da página clientes.html (Timeline por Cliente)
|   |   |-- dashboardView.js    # Lógica da página index.html (Timeline por Equipe)
|   |   |-- kanbanView.js       # Lógica da página kanban.html (Kanban por Time)
|   |
|   |-- index.js             # Ponto de entrada principal, carrega a view correta
|
|-- index.html               # Página principal (Timeline por Equipe)
|-- clientes.html            # Página de visualização por Cliente (Timeline)
|-- kanban.html              # Página de visualização Kanban (por Time)
|-- dados.json               # Arquivo mock com os dados de tarefas
|-- todo.md                  # Checklist de refatoração (interno)
|-- README.md                # Este arquivo
```

## Formato do arquivo `dados.json`

O dashboard agora utiliza o resultado de uma consulta no Monday.com focada nas
tarefas do time de **Criação**. Os campos mais importantes são:

| Campo no JSON           | Descrição                                   |
|-------------------------|----------------------------------------------|
| `UniqueTaskID`          | Identificador único da tarefa/subtarefa      |
| `TaskTitle`             | Nome da tarefa                               |
| `ClientNickname`        | Nome do cliente                              |
| `JobTitle`              | Nome do projeto                              |
| `CurrentDueDate`        | Data de entrega (utilizada como início/fim)   |
| `TaskOwnerDisplayName`  | Responsável pela tarefa                      |
| `TaskOwnerGroupName`    | Caminho completo do grupo (ex: `Criação / ...`) |
| `PipelineStepTitle`     | Status atual                                 |
| `ParentTaskID`          | Se presente, indica que é uma subtarefa       |

Campos adicionais do Monday são preservados no JSON, mas os acima são os que o
`dataService.js` utiliza para normalizar as informações exibidas nas telas.

## Como Rodar o Projeto

Como este é um projeto front-end estático (HTML, CSS, JavaScript) que consome um arquivo JSON local, ele pode ser rodado diretamente em um navegador web:

1.  **Servidor Local (Recomendado):**
    *   Para evitar problemas com CORS ao carregar o `dados.json` via `fetch`, é recomendado usar um servidor web local.
    *   Se você tem Python instalado, navegue até a pasta raiz do projeto (`/DashboardSuno/`) pelo terminal e execute:
        ```bash
        python -m http.server
        ```
        (Para Python 2, use `python -m SimpleHTTPServer`)
    *   Abra seu navegador e acesse `http://localhost:8000` (ou a porta indicada pelo servidor).
2.  **Abertura Direta (Pode falhar):**
    *   Você pode tentar abrir os arquivos `index.html`, `clientes.html` ou `kanban.html` diretamente no navegador.
    *   **Atenção:** Dependendo das configurações de segurança do seu navegador, a leitura do `dados.json` local via `fetch` pode ser bloqueada por políticas de mesma origem (CORS). Se a aplicação não carregar os dados, utilize a opção de servidor local.

## Fluxo Principal e Dependências

1.  **Inicialização (`js/index.js`):**
    *   Detecta qual página HTML foi carregada (`index.html`, `clientes.html`, `kanban.html`).
    *   Verifica a acessibilidade do `dados.json`.
    *   Carrega dinamicamente o módulo JavaScript da `view` correspondente (`dashboardView.js`, `clientsView.js`, `kanbanView.js`).
    *   Inicializa funcionalidades globais como o controle de zoom do site.
2.  **Carregamento de Dados (View -> `dataService.js`):**
    *   Cada `view` chama a função `carregarDados` do `dataService`.
    *   `dataService.js` utiliza `fetch` para buscar o conteúdo de `dados.json`.
    *   Os dados brutos são processados pela função `preprocessarDados` para normalizar campos, extrair informações (como `TaskOwnerGroup`) e definir padrões (como `Priority`).
    *   Para a visualização de Clientes e Kanban, a função `processarProjetos` é chamada para agrupar tarefas em projetos.
3.  **Preenchimento de Filtros (View -> `filterComponents.js`):**
    *   A `view` utiliza funções do `filterComponents.js` (como `preencherSelectClientes`, `preencherSelectGrupos`) para popular os elementos `<select>` com base nos dados carregados.
4.  **Aplicação de Filtros (View -> `dataService.js`):**
    *   Quando um filtro é alterado na interface, a `view` captura o evento.
    *   A `view` chama `obterValoresFiltros` (`filterComponents.js`) para pegar os valores atuais de todos os filtros.
    *   A `view` chama `aplicarFiltros` (`dataService.js`) passando os dados (tarefas ou projetos) e os valores dos filtros.
    *   `dataService.js` aplica a sequência de filtros correspondente (período, cliente, grupo, subgrupo, tipo de tarefa).
5.  **Renderização da Visualização (View -> `timelineService.js` ou Lógica Interna):**
    *   **Timeline (`dashboardView.js`, `clientsView.js`):**
        *   A `view` chama `criarTimelineTarefas` ou `criarTimelineProjetos` do `timelineService.js`, passando os dados filtrados e o container HTML.
        *   `timelineService.js` utiliza a biblioteca `Vis.js` para criar e configurar a timeline interativa, formatando os itens e grupos.
    *   **Kanban (`kanbanView.js`):**
        *   A `view` possui lógica interna (`renderizarKanban`, `criarCartaoProjeto`) para criar as colunas (baseadas nos Times) e os cards (representando Projetos) dinamicamente no HTML.
6.  **Interações (Timeline, Kanban, Filtros):**
    *   Eventos de clique, zoom, navegação na timeline são gerenciados pelo `timelineService.js` e pela `view`.
    *   Eventos de mudança nos filtros disparam a re-filtragem e re-renderização.
    *   A exportação para CSV é acionada pela `view`, que chama `exportarParaCSV` do `exportService.js`, passando os dados formatados.

**Dependências Externas:**

*   **Vis.js (Timeline):** Biblioteca para criação de gráficos e timelines interativas. Incluída via CDN nos arquivos HTML.
*   **Moment.js:** Biblioteca para manipulação de datas. Incluída via CDN nos arquivos HTML.
*   **Bootstrap (v5):** Framework CSS e JS para componentes de UI e layout. Incluído via CDN nos arquivos HTML.
*   **Font Awesome:** Biblioteca de ícones. Incluída via CDN nos arquivos HTML.
*   **Inter Font:** Fonte utilizada no projeto. Incluída via Google Fonts no CSS.

## Como Adicionar Novas Funcionalidades

*   **Nova Visualização/Página:**
    1.  Crie um novo arquivo HTML (ex: `relatorio.html`).
    2.  Crie um novo arquivo JS em `js/views/` (ex: `reportView.js`).
    3.  Adicione a lógica de carregamento para a nova página em `js/index.js`.
    4.  Implemente a lógica específica da nova view em `reportView.js`, utilizando os `services` e `components` existentes ou criando novos se necessário.
    5.  Adicione os estilos específicos em um novo arquivo CSS (ex: `css/report.css`) ou nos arquivos existentes, se apropriado.
*   **Novo Componente de UI:**
    1.  Adicione a função do componente em `js/components/uiComponents.js` ou `js/components/filterComponents.js` (ou crie um novo arquivo de componente se for muito específico).
    2.  Adicione os estilos necessários em `css/components.css`.
*   **Nova Lógica de Negócio/Dados:**
    1.  Adicione funções ao `js/services/dataService.js` para manipulação de dados ou crie um novo serviço em `js/services/` se a lógica for distinta (ex: `authService.js`).

Lembre-se de manter a separação de responsabilidades entre `views`, `components` e `services`.
