/**
 * @file dataService.js
 * @description Serviço para carregamento e processamento de dados
 * @project Dashboard de Tarefas - SUNO
 */

/**
 * Estrutura esperada para cada item no arquivo dados.json:
 * {
 * "UniqueTaskID": string,
 * "TipoTarefa": string,
 * "ClientNickname": string,
 * "JobTitle": string,
 * "TaskTitle": string,
 * "TaskCreationDate": string,
 * "CurrentDueDate": string | null,
 * "TaskOwnerDisplayName": string | null,
 * "TaskOwnerFunctionGroupName": string | null, // 'CRIAÇÃO', 'MÍDIA', 'PRODUÇÃO', etc.
 * "TaskOwnerGroupName": string | null,       // Caminho completo do grupo (ex: "Criação / Equipe A")
 * "PipelineStepTitle": string,
 * ...
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
    if (!Array.isArray(dadosOriginais)) {
      throw new Error("Formato inválido: O arquivo JSON não contém um array.");
    }
    return dadosOriginais.map(preprocessarDados);
  } catch (error) {
    let errorMessage = `Falha ao carregar ou processar dados do JSON: ${error.message}`;
    if (error instanceof SyntaxError) {
      errorMessage = `Erro de sintaxe no JSON: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

/**
 * Preprocessa dados para normalizar campos e adicionar informações derivadas.
 * @param {object} item - Item individual do array de dados.json
 * @returns {object} - Item processado e normalizado
 */
export function preprocessarDados(item) {
  if (typeof item !== 'object' || item === null) {
    console.warn("Item inválido encontrado nos dados:", item);
    return {};
  }

  // Mapeia os campos do novo JSON para a estrutura que a aplicação espera
  const processado = {
    id: item.UniqueTaskID,
    name: item.TaskTitle,
    client: item.ClientNickname,
    project: item.JobTitle,
    start: item.TaskCreationDate,
    end: item.CurrentDueDate,
    responsible: item.TaskOwnerDisplayName,
    group_subgroup: item.TaskOwnerGroupName, // Mantido para referência, mas a lógica agora usa os campos abaixo
    PipelineStepTitle: item.PipelineStepTitle,
    tipo: item.TipoTarefa,
    ParentTaskID: item.ParentTaskID,

    // ** ALTERAÇÃO PRINCIPAL **
    // Mapeia o grupo funcional (Área) e o caminho completo do grupo
    TaskOwnerGroup: item.TaskOwnerFunctionGroupName, // Ex: 'CRIAÇÃO', 'MÍDIA'
    TaskOwnerFullPath: item.TaskOwnerGroupName,     // Ex: 'Criação / Bruno Prosperi'
    
    // Adiciona outros campos originais que podem ser úteis
    ...item
  };

  // Tratamento de data/hora: remove " UTC" e substitui espaço por "T"
  if (processado.start) {
    processado.start = processado.start.replace(" UTC", "Z").replace(" ", "T");
  }
  if (processado.end) {
    processado.end = processado.end.replace(" UTC", "Z").replace(" ", "T");
  }

  // Mapear prioridade com base no status
  const statusPriority = {
    "Não iniciada": "low",
    "Backlog": "medium",
    "Em Produção": "high",
  };
  processado.Priority = statusPriority[processado.PipelineStepTitle] || "medium";

  // Normalizar datas para garantir que existam
  processado.RequestDate = processado.start ? moment(processado.start).toISOString() : new Date().toISOString();
  processado.TaskClosingDate = processado.end ? moment(processado.end).toISOString() : moment(processado.RequestDate).toISOString();
  processado.CurrentDueDate = processado.TaskClosingDate;

  // Garante que o campo 'tipo' esteja sempre definido
  processado.tipo = processado.tipo || (processado.ParentTaskID ? "Subtarefa" : "Tarefa");

  if (!processado.name) {
    processado.name = "Tarefa sem nome";
  }

  return processado;
}


/**
 * Processa uma lista de tarefas para agrupar em projetos.
 * @param {Array} tarefas - Lista de tarefas preprocessadas.
 * @returns {Array} - Lista de projetos, cada um contendo suas tarefas e metadados agregados.
 */
export function processarProjetos(tarefas) {
  const projetosPorCliente = {};
  
  tarefas.forEach(tarefa => {
    if (!tarefa.client || !tarefa.project) return;
    
    const chave = `${tarefa.client}::${tarefa.project}`;
    
    if (!projetosPorCliente[chave]) {
      projetosPorCliente[chave] = {
        id: chave,
        name: tarefa.project,
        client: tarefa.client,
        tasks: [],
        responsibles: new Set(),
        groups: new Set(), // Agora irá armazenar as áreas: 'CRIAÇÃO', 'MÍDIA', etc.
        start: tarefa.start,
        end: tarefa.end,
        status: tarefa.PipelineStepTitle || "Em andamento",
        priority: tarefa.Priority || "medium",
        progress: 0
      };
    }
    
    const projeto = projetosPorCliente[chave];
    projeto.tasks.push(tarefa);
    if (tarefa.responsible) projeto.responsibles.add(tarefa.responsible);
    
    // Adiciona a ÁREA (TaskOwnerGroup) ao conjunto de grupos do projeto
    if (tarefa.TaskOwnerGroup) projeto.groups.add(tarefa.TaskOwnerGroup);
    
    if (!projeto.start || (tarefa.start && new Date(tarefa.start) < new Date(projeto.start))) {
      projeto.start = tarefa.start;
    }
    
    if (!projeto.end || (tarefa.end && new Date(tarefa.end) > new Date(projeto.end))) {
      projeto.end = tarefa.end;
    }
    
    if (tarefa.Priority === "high") {
      projeto.priority = "high";
    } else if (tarefa.Priority === "medium" && projeto.priority !== "high") {
      projeto.priority = "medium";
    }
  });
  
  return Object.values(projetosPorCliente).map(projeto => {
    projeto.responsibles = Array.from(projeto.responsibles).sort();
    projeto.groups = Array.from(projeto.groups).sort();
    projeto.mainResponsible = projeto.responsibles[0] || "Não atribuído";
    
    const tarefasConcluidas = projeto.tasks.filter(t => 
      t.PipelineStepTitle === "Concluída" || t.status === "Concluída"
    ).length;
    projeto.progress = projeto.tasks.length > 0 
      ? Math.round((tarefasConcluidas / projeto.tasks.length) * 100) 
      : 0;
    
    if (projeto.progress === 100) {
      projeto.status = "Concluído";
    } else {
      const hoje = new Date();
      const temTarefasAtrasadas = projeto.tasks.some(t => 
        t.end && new Date(t.end) < hoje && 
        t.PipelineStepTitle !== "Concluída" && 
        t.status !== "Concluída"
      );
      
      if (temTarefasAtrasadas) {
        projeto.status = "Atrasado";
      } else {
        projeto.status = "Em andamento"; 
      }
    }
    
    return projeto;
  });
}

// --- Funções de Filtragem --- 

export function filtrarPorPeriodo(dados, dias = 30) {
  const limite = moment().subtract(dias, "days");
  return dados.filter(item => {
    return item.start && moment(item.start).isValid() && moment(item.start).isSameOrAfter(limite);
  });
}

export function filtrarPorCliente(dados, cliente) {
  if (cliente === "todos" || !cliente) return dados;
  return dados.filter(item => item.client === cliente);
}

export function filtrarPorGrupo(dados, grupo) {
    if (grupo === "todos" || !grupo) return dados;
    // Para projetos, verifica se a área está na lista de grupos do projeto
    if (dados[0] && dados[0].tasks) { 
        return dados.filter(projeto => projeto.groups && projeto.groups.includes(grupo));
    } 
    // Para tarefas, filtra pelo TaskOwnerGroup (a área) da tarefa
    else {
        return dados.filter(item => item.TaskOwnerGroup === grupo);
    }
}

export function filtrarPorSubgrupo(dados, grupo, subgrupo) {
  if (subgrupo === "todos" || !subgrupo) return dados;
  
  if (dados[0] && dados[0].tasks) {
      console.warn("Filtro por subgrupo não aplicável a projetos.");
      return dados; 
  }

  return dados.filter(item => {
    const fullPath = item.TaskOwnerFullPath;
    if (!fullPath) return false;

    if (subgrupo === "Ana Luisa Andre") {
      return fullPath === "Ana Luisa Andre";
    }

    return fullPath === subgrupo || fullPath.startsWith(`${subgrupo} / `);
  });
}

export function filtrarPorTipoTarefa(dados, mostrarTarefas = true, mostrarSubtarefas = true) {
  if (mostrarTarefas && mostrarSubtarefas) return dados;
  if (!mostrarTarefas && !mostrarSubtarefas) return [];

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

export function filtrarPorNome(dados, nome) {
  if (!nome || !nome.trim()) return dados;
  const nomeLower = nome.trim().toLowerCase();
  return dados.filter(item => (item.responsible || '').toLowerCase().includes(nomeLower));
}

export function aplicarFiltros(dados, filtros) {
  let resultado = [...dados];
  
  if (filtros.dias) {
    resultado = filtrarPorPeriodo(resultado, filtros.dias);
  }
  if (filtros.cliente && filtros.cliente !== 'todos') {
    resultado = filtrarPorCliente(resultado, filtros.cliente);
  }
  // Remover filtro de grupo/subgrupo
  // if (filtros.grupo && filtros.grupo !== 'todos') {
  //   resultado = filtrarPorGrupo(resultado, filtros.grupo);
  // }
  // if (filtros.grupo && filtros.grupo !== 'todos' && filtros.subgrupo && filtros.subgrupo !== 'todos') {
  //   resultado = filtrarPorSubgrupo(resultado, filtros.grupo, filtros.subgrupo);
  // }
  if (filtros.nome) {
    resultado = filtrarPorNome(resultado, filtros.nome);
  }
  if (!(filtros.mostrarTarefas !== false && filtros.mostrarSubtarefas !== false)) {
      resultado = filtrarPorTipoTarefa(
          resultado, 
          filtros.mostrarTarefas !== false,
          filtros.mostrarSubtarefas !== false
      );
  }
  
  return resultado;
}