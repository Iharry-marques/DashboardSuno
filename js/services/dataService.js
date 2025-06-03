/**
 * @file dataService.js
 * @description Serviço para carregamento e processamento de dados
 * @project Dashboard de Tarefas - SUNO
 */

/**
 * Estrutura esperada para cada item no arquivo dados.json:
 * {
 *   "id": number | string,            // Identificador único da tarefa/item
 *   "name": string,                   // Nome da tarefa
 *   "client": string,                 // Nome do cliente
 *   "project": string,                // Nome do projeto
 *   "start": string,                  // Data de início (formato ISO 8601 ou compatível com moment.js)
 *   "end": string | null,             // Data de fim (formato ISO 8601 ou compatível com moment.js), pode ser null
 *   "responsible": string | null,     // Nome do responsável pela tarefa
 *   "group_subgroup": string | null,  // Caminho completo do grupo/subgrupo (ex: "Criação / Equipe A")
 *   "PipelineStepTitle": string,      // Status da tarefa (ex: "Não iniciada", "Backlog", "Em Produção", "Concluída")
 *   "tipo": string | null             // Tipo do item, geralmente "Tarefa" ou "Subtarefa"
 *   // Outros campos podem existir, mas os acima são os principais utilizados.
 * }
 */

/**
 * Carrega dados do arquivo JSON
 * @param {string} jsonUrl - URL do arquivo JSON
 * @returns {Promise<Array>} - Dados processados
 */
export async function carregarDados(jsonUrl = 'dados.json') {
  try {
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const dadosOriginais = await response.json();
    // Validação básica: Verifica se é um array
    if (!Array.isArray(dadosOriginais)) {
      throw new Error("Formato inválido: O arquivo JSON não contém um array.");
    }
    return dadosOriginais.map(preprocessarDados);
  } catch (error) {
    // Adiciona mais detalhes ao erro, se possível
    let errorMessage = `Falha ao carregar ou processar dados do JSON: ${error.message}`;
    if (error instanceof SyntaxError) {
      errorMessage = `Erro de sintaxe no JSON: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

/**
 * Preprocessa dados para normalizar campos e adicionar informações derivadas.
 * Realiza uma validação implícita ao tentar acessar e processar campos esperados.
 * @param {object} item - Item individual do array de dados.json
 * @returns {object} - Item processado e normalizado
 */
export function preprocessarDados(item) {
  // Validação básica de tipo
  if (typeof item !== 'object' || item === null) {
    console.warn("Item inválido encontrado nos dados:", item);
    return {}; // Retorna objeto vazio ou lança erro, dependendo da política
  }

  const processado = { ...item };
    if (processado.start) {
    processado.start = processado.start
      .replace(" UTC", "Z")
      .replace(" ", "T");
  }
  if (processado.end) {
    processado.end = processado.end
      .replace(" UTC", "Z")
      .replace(" ", "T");
  }

  // Mapear prioridade com base no status (PipelineStepTitle)
  const statusPriority = {
    "Não iniciada": "low",
    "Backlog": "medium",
    "Em Produção": "high",
    // Adicionar outros status se necessário
  };
  // Define prioridade baseada no status, com 'medium' como padrão
  processado.Priority = statusPriority[processado.PipelineStepTitle] || "medium";

  // Lista de grupos principais válidos (usada para extrair TaskOwnerGroup)
  const gruposPrincipais = [
    "Criação",
    "Mídia",
    "Produção",
    "Operações",
    "BI",
    "Estratégia",
  ];

  // Extração e normalização do Grupo Principal (TaskOwnerGroup) e Caminho Completo (TaskOwnerFullPath)
  let grupo = undefined;
  let caminhoCompleto = processado.group_subgroup || ""; // Usa o campo group_subgroup
  processado.TaskOwnerFullPath = caminhoCompleto; // Armazena o caminho original

  if (caminhoCompleto) {
    // Tratamento de casos especiais (ex: "Ana Luisa Andre" pertence a "Produção")
    if (caminhoCompleto.trim() === "Ana Luisa Andre") {
      grupo = "Produção";
    } else {
      const partes = caminhoCompleto.split("/").map((p) => p.trim());
      if (partes.length > 0) {
        // Verifica se a primeira parte é um grupo principal conhecido
        if (gruposPrincipais.includes(partes[0])) {
          grupo = partes[0];
        } 
        // Tratamento de casos especiais onde o grupo principal não está no início
        else if (partes[0] === "Bruno Prosperi") {
          grupo = "Criação";
        } else if (partes[0] === "Carol") {
          grupo = "Operações";
        } else {
          // Se não reconhecido, marca como "Outros" ou loga um aviso
          console.warn(
            `Grupo não reconhecido ou formato inesperado: ${partes[0]} em '${caminhoCompleto}'`
          );
          grupo = "Outros"; // Ou pode ser null/undefined dependendo da necessidade
        }
      }
    }
  }
  processado.TaskOwnerGroup = grupo; // Armazena o grupo principal extraído

  // Normalizar datas: Garante que 'start' e 'end' existam e estejam em formato ISO
  // Se 'start' não existir, usa a data atual como padrão.
  processado.RequestDate = processado.start ? moment(processado.start).toISOString() : new Date().toISOString();
  // Se 'end' não existir, calcula 3 dias após o início.
  processado.TaskClosingDate = processado.end ? moment(processado.end).toISOString() : moment(processado.RequestDate).add(3, "days").toISOString();
  // CurrentDueDate parece ser um sinônimo de TaskClosingDate neste contexto.
  processado.CurrentDueDate = processado.TaskClosingDate;

  // Garante que o campo 'tipo' (Tarefa/Subtarefa) esteja sempre definido, padronizando para "Tarefa".
  processado.tipo = processado.tipo || "Tarefa";

  // Validação implícita: Campos como 'client', 'project', 'name', 'responsible' são usados diretamente.
  // Se estiverem faltando, podem resultar em 'N/A' ou comportamento inesperado nas visualizações.
  // Adicionar validações explícitas aqui se for crítico (ex: verificar se 'name' existe).
  if (!processado.name) {
    console.warn("Tarefa sem nome encontrada:", item);
    processado.name = "Tarefa sem nome"; // Define um padrão
  }

  return processado;
}

/**
 * Processa uma lista de tarefas para agrupar em projetos.
 * @param {Array} tarefas - Lista de tarefas preprocessadas.
 * @returns {Array} - Lista de projetos, cada um contendo suas tarefas e metadados agregados.
 */
export function processarProjetos(tarefas) {
  // Objeto para agrupar tarefas por cliente e projeto
  const projetosPorCliente = {};
  
  tarefas.forEach(tarefa => {
    // Ignora tarefas sem cliente ou projeto definidos para agrupamento
    if (!tarefa.client || !tarefa.project) return;
    
    const chave = `${tarefa.client}::${tarefa.project}`; // Chave única para cada projeto
    
    // Inicializa o objeto do projeto se for a primeira tarefa encontrada para ele
    if (!projetosPorCliente[chave]) {
      projetosPorCliente[chave] = {
        id: chave,
        name: tarefa.project,
        client: tarefa.client,
        tasks: [], // Array para armazenar as tarefas do projeto
        responsibles: new Set(), // Conjunto para armazenar responsáveis únicos
        groups: new Set(), // Conjunto para armazenar grupos/times únicos
        start: tarefa.start, // Data de início inicial (será ajustada)
        end: tarefa.end, // Data de fim inicial (será ajustada)
        status: tarefa.PipelineStepTitle || "Em andamento", // Status inicial
        priority: tarefa.Priority || "medium", // Prioridade inicial
        progress: 0 // Progresso inicial
      };
    }
    
    const projeto = projetosPorCliente[chave];
    
    // Adiciona a tarefa atual ao projeto
    projeto.tasks.push(tarefa);
    
    // Adiciona responsável e grupo (se existirem) aos conjuntos para garantir unicidade
    if (tarefa.responsible) projeto.responsibles.add(tarefa.responsible);
    if (tarefa.TaskOwnerGroup) projeto.groups.add(tarefa.TaskOwnerGroup);
    
    // Ajusta a data de início do projeto para a data mais antiga entre suas tarefas
    if (!projeto.start || (tarefa.start && new Date(tarefa.start) < new Date(projeto.start))) {
      projeto.start = tarefa.start;
    }
    
    // Ajusta a data de fim do projeto para a data mais recente entre suas tarefas
    if (!projeto.end || (tarefa.end && new Date(tarefa.end) > new Date(projeto.end))) {
      projeto.end = tarefa.end;
    }
    
    // Atualiza a prioridade do projeto para a mais alta encontrada entre suas tarefas
    if (tarefa.Priority === "high") {
      projeto.priority = "high";
    } else if (tarefa.Priority === "medium" && projeto.priority !== "high") {
      projeto.priority = "medium";
    } // Prioridade 'low' não sobrescreve 'medium' ou 'high'
  });
  
  // Pós-processamento de cada projeto após agrupar todas as tarefas
  return Object.values(projetosPorCliente).map(projeto => {
    // Converte os Sets de responsáveis e grupos para Arrays ordenados
    projeto.responsibles = Array.from(projeto.responsibles).sort();
    projeto.groups = Array.from(projeto.groups).sort();
    
    // Define o responsável principal (primeiro da lista ordenada)
    projeto.mainResponsible = projeto.responsibles[0] || "Não atribuído";
    
    // Calcula o progresso do projeto com base na porcentagem de tarefas concluídas
    const tarefasConcluidas = projeto.tasks.filter(t => 
      t.PipelineStepTitle === "Concluída" || t.status === "Concluída" // Considera ambos os campos de status
    ).length;
    projeto.progress = projeto.tasks.length > 0 
      ? Math.round((tarefasConcluidas / projeto.tasks.length) * 100) 
      : 0;
    
    // Determina o status geral do projeto
    if (projeto.progress === 100) {
      projeto.status = "Concluído";
    } else {
      // Verifica se alguma tarefa não concluída está atrasada
      const hoje = new Date();
      const temTarefasAtrasadas = projeto.tasks.some(t => 
        t.end && new Date(t.end) < hoje && 
        t.PipelineStepTitle !== "Concluída" && 
        t.status !== "Concluída"
      );
      
      if (temTarefasAtrasadas) {
        projeto.status = "Atrasado";
      } else {
        // Se não concluído e sem tarefas atrasadas, considera "Em andamento"
        projeto.status = "Em andamento"; 
      }
    }
    
    return projeto;
  });
}

// --- Funções de Filtragem --- 
// Estas funções operam sobre os dados JÁ PROCESSADOS (tarefas ou projetos)

/**
 * Filtra dados por período (data de início)
 * @param {Array} dados - Dados a serem filtrados (tarefas ou projetos)
 * @param {number} dias - Número de dias a partir de hoje para incluir (ex: 30 dias atrás)
 * @returns {Array} - Dados filtrados
 */
export function filtrarPorPeriodo(dados, dias = 30) {
  const limite = moment().subtract(dias, "days");
  return dados.filter(item => {
    // Garante que item.start existe e é uma data válida antes de comparar
    return item.start && moment(item.start).isValid() && moment(item.start).isSameOrAfter(limite);
  });
}

/**
 * Filtra dados por cliente
 * @param {Array} dados - Dados a serem filtrados (tarefas ou projetos)
 * @param {string} cliente - Cliente selecionado ("todos" para nenhum filtro)
 * @returns {Array} - Dados filtrados
 */
export function filtrarPorCliente(dados, cliente) {
  if (cliente === "todos" || !cliente) return dados;
  return dados.filter(item => item.client === cliente);
}

/**
 * Filtra dados por grupo principal (TaskOwnerGroup)
 * @param {Array} dados - Dados a serem filtrados (tarefas ou projetos)
 * @param {string} grupo - Grupo selecionado ("todos" para nenhum filtro)
 * @returns {Array} - Dados filtrados
 */
export function filtrarPorGrupo(dados, grupo) {
  if (grupo === "todos" || !grupo) return dados;
  // Para projetos, verifica se o grupo está na lista de grupos do projeto
  if (dados[0] && dados[0].tasks) { // Verifica se são projetos
      return dados.filter(projeto => projeto.groups && projeto.groups.includes(grupo));
  } 
  // Para tarefas, filtra pelo TaskOwnerGroup da tarefa
  else {
      return dados.filter(item => item.TaskOwnerGroup === grupo);
  }
}

/**
 * Filtra dados por subgrupo/caminho completo (TaskOwnerFullPath)
 * @param {Array} dados - Dados a serem filtrados (APENAS TAREFAS)
 * @param {string} grupo - Grupo principal selecionado (necessário para contexto)
 * @param {string} subgrupo - Subgrupo/caminho selecionado ("todos" para nenhum filtro)
 * @returns {Array} - Dados filtrados
 */
export function filtrarPorSubgrupo(dados, grupo, subgrupo) {
  if (subgrupo === "todos" || !subgrupo) return dados;
  
  // Este filtro só faz sentido para tarefas, pois projetos não têm TaskOwnerFullPath
  if (dados[0] && dados[0].tasks) {
      console.warn("Filtro por subgrupo não aplicável a projetos.");
      return dados; 
  }

  return dados.filter(item => {
    const fullPath = item.TaskOwnerFullPath;
    if (!fullPath) return false;

    // Caso especial "Ana Luisa Andre"
    if (subgrupo === "Ana Luisa Andre") {
      return fullPath === "Ana Luisa Andre";
    }

    // Verifica se o caminho completo corresponde exatamente ao subgrupo selecionado
    // OU se o caminho completo começa com o subgrupo selecionado seguido por " / "
    // (indicando que é um nível mais específico dentro do subgrupo)
    return fullPath === subgrupo || fullPath.startsWith(`${subgrupo} / `);
    
    // A lógica anterior que dependia do 'grupo' foi removida pois o 'subgrupo' 
    // já contém o caminho completo ou o nome direto.
  });
}

/**
 * Filtra dados por tipo (Tarefa/Subtarefa)
 * @param {Array} dados - Dados a serem filtrados (APENAS TAREFAS)
 * @param {boolean} mostrarTarefas - Incluir tarefas principais
 * @param {boolean} mostrarSubtarefas - Incluir subtarefas
 * @returns {Array} - Dados filtrados
 */
export function filtrarPorTipoTarefa(dados, mostrarTarefas = true, mostrarSubtarefas = true) {
  if (mostrarTarefas && mostrarSubtarefas) return dados;
  if (!mostrarTarefas && !mostrarSubtarefas) return []; // Se ambos false, retorna vazio

  // Este filtro só faz sentido para tarefas
  if (dados[0] && dados[0].tasks) {
      console.warn("Filtro por tipo de tarefa não aplicável a projetos.");
      return dados; 
  }
  
  return dados.filter(item => {
    const isSubtask = item.tipo === "Subtarefa";
    if (mostrarTarefas && !isSubtask) return true;
    if (mostrarSubtarefas && isSubtask) return true;
    return false;
  });
}

/**
 * Aplica uma sequência de filtros aos dados.
 * @param {Array} dados - Dados originais (tarefas ou projetos).
 * @param {Object} filtros - Objeto contendo os valores dos filtros selecionados 
 *                           (ex: { cliente: 'XPTO', grupo: 'Criação', dias: 90, ... }).
 * @returns {Array} - Dados após aplicação de todos os filtros ativos.
 */
export function aplicarFiltros(dados, filtros) {
  let resultado = [...dados]; // Começa com uma cópia dos dados
  
  // Aplica cada filtro sequencialmente se o valor do filtro estiver definido e não for "todos"
  if (filtros.dias) {
    resultado = filtrarPorPeriodo(resultado, filtros.dias);
  }
  if (filtros.cliente && filtros.cliente !== 'todos') {
    resultado = filtrarPorCliente(resultado, filtros.cliente);
  }
  if (filtros.grupo && filtros.grupo !== 'todos') {
    resultado = filtrarPorGrupo(resultado, filtros.grupo);
  }
  // Filtro de subgrupo só é aplicado se um grupo também estiver selecionado e não for "todos"
  if (filtros.grupo && filtros.grupo !== 'todos' && filtros.subgrupo && filtros.subgrupo !== 'todos') {
    // Passa o grupo selecionado para contexto, se necessário pela função filtrarPorSubgrupo
    resultado = filtrarPorSubgrupo(resultado, filtros.grupo, filtros.subgrupo);
  }
  // Filtro por tipo de tarefa (aplicado apenas se não for para mostrar ambos)
  if (!(filtros.mostrarTarefas !== false && filtros.mostrarSubtarefas !== false)) {
      resultado = filtrarPorTipoTarefa(
          resultado, 
          filtros.mostrarTarefas !== false, // Default true
          filtros.mostrarSubtarefas !== false // Default true
      );
  }
  
  return resultado;
}

