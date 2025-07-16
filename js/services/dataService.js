/**
 * @file dataService.js
 * @description Serviço para carregar, mapear e filtrar dados.
 */

/**
 * Carrega os dados brutos do arquivo JSON.
 * @param {string} url - URL do arquivo de dados.
 * @returns {Promise<Array>}
 */
export async function carregarDados(url = 'dados.json') {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Mapeia os dados brutos para o modelo de dados consistente usado pela aplicação.
 * @param {Array} dadosBrutos - Os dados diretamente do JSON.
 * @returns {Array} - Os dados transformados.
 */
export function mapearDadosBrutos(dadosBrutos) {
    if (!Array.isArray(dadosBrutos)) return [];

    const mapeados = dadosBrutos.map(item => ({
        id: item.UniqueTaskID,
        tipo: item.TipoTarefa,
        client: item.ClientNickname,
        project: item.JobTitle,
        content: item.TaskTitle,
        start: item.TaskCreationDate,
        end: item.CurrentDueDate,
        responsible: item.TaskOwnerDisplayName,
        area: item.TaskOwnerFunctionGroupName,
        group: item.TaskOwnerFunctionGroupName,
        status: item.PipelineStepTitle,
        priority: item.JobHealth,
    }));
    
    const unicosMap = new Map();
    for (const t of mapeados) {
      if (!unicosMap.has(t.id)) unicosMap.set(t.id, t);
    }
    return Array.from(unicosMap.values());
}


/**
 * Agrupa tarefas individuais em projetos, garantindo datas válidas.
 * @param {Array} tarefas - A lista de todas as tarefas JÁ MAPEADAS.
 * @returns {Array}
 */
export function processarProjetos(tarefas) {
  // <<< LOG SOLICITADO (1): Verificando os dados que chegam na função.
  if (tarefas && tarefas.length > 0) {
    console.log('[DEBUG Por Cliente] Primeira tarefa recebida:', tarefas[0]);
    console.log('[DEBUG Por Cliente] Todas as chaves da primeira tarefa:', Object.keys(tarefas[0] || {}));
  } else {
    console.warn('[DEBUG Por Cliente] A função processarProjetos foi chamada com um array de tarefas vazio ou inválido.');
  }

  console.log('[ProcessarProjetos] 1. Iniciando agrupamento de tarefas em projetos...');
  const projetosMap = new Map();
  
  tarefas.forEach((tarefa) => {
    const projectKey = tarefa.project || `Projeto Avulso - ${tarefa.client}`;
    
    if (!projetosMap.has(projectKey)) {
      projetosMap.set(projectKey, {
        id: projectKey,
        name: tarefa.project || `Projeto Avulso - ${tarefa.client}`,
        client: tarefa.client,
        tasks: [],
        groups: new Set(),
        start: null,
        end: null,
        status: 'Em andamento',
        priority: 'medium'
      });
    }
    
    const projeto = projetosMap.get(projectKey);
    projeto.tasks.push(tarefa);
    if (tarefa.group) projeto.groups.add(tarefa.group);

    const tarefaStart = tarefa.start ? new Date(tarefa.start) : null;
    const tarefaEnd = tarefa.end ? new Date(tarefa.end) : null;

    if (tarefaStart && (!projeto.start || tarefaStart < projeto.start)) {
        projeto.start = tarefaStart;
    }
    if (tarefaEnd && (!projeto.end || tarefaEnd > projeto.end)) {
        projeto.end = tarefaEnd;
    }
  });

  // <<< LOG SOLICITADO (2): Verificando o resultado do agrupamento antes da validação final.
  console.log('[DEBUG Por Cliente] Primeiro projeto agrupado:', projetosMap.size ? Array.from(projetosMap.values())[0] : 'Nenhum projeto foi agrupado.');

  console.log('[ProcessarProjetos] 3. Agrupamento concluído. Realizando pós-processamento e validação de datas...');

  const finalProjects = Array.from(projetosMap.values()).map(proj => {
    proj.groups = Array.from(proj.groups);
    proj.group = proj.client;

    if (!proj.start) {
        console.warn(`[ProcessarProjetos] ALERTA: Projeto "${proj.name}" sem data de início. Aplicando data atual como fallback.`);
        proj.start = new Date();
    }
    if (!proj.end) {
        console.warn(`[ProcessarProjetos] ALERTA: Projeto "${proj.name}" sem data de fim. Aplicando data de início como fallback.`);
        proj.end = proj.start;
    }

    proj.start = proj.start instanceof Date ? proj.start.toISOString() : proj.start;
    proj.end = proj.end instanceof Date ? proj.end.toISOString() : proj.end;

    return proj;
  });

  if (finalProjects.length > 0) {
      console.log('[ProcessarProjetos] 4. Pós-processamento finalizado. Exemplo do primeiro projeto processado:', finalProjects[0]);
  }

  return finalProjects;
}


/**
 * Aplica uma série de filtros aos dados.
 * @param {Array} dados - Os dados a serem filtrados.
 * @param {object} filtros - Um objeto com os valores dos filtros.
 * @returns {Array}
 */
export function aplicarFiltros(dados, filtros) {
    if (!dados) return [];
    
    return dados.filter(item => {
        if (filtros.grupo && filtros.grupo !== 'todos' && item.group !== filtros.grupo) {
            return false;
        }
        if (filtros.cliente && filtros.cliente !== 'todos' && item.client !== filtros.cliente) {
            return false;
        }
        const dias = filtros.dias || 0;
        if (dias > 0) {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - dias);
            if (!item.start || new Date(item.start) < dataLimite) {
                return false;
            }
        }
        if (filtros.hasOwnProperty('mostrarTarefas')) {
            const isSubtask = item.tipo === 'Subtarefa';
            if (!((filtros.mostrarTarefas && !isSubtask) || (filtros.mostrarSubtarefas && isSubtask))) {
                return false;
            }
        }
        return true;
    });
}