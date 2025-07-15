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
        // ✅ CORREÇÃO 3: Datas convertidas para new Date() na importação
        start: new Date(item.TaskCreationDate),
        end:   new Date(item.CurrentDueDate),
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
 * Agrupa tarefas individuais em projetos.
 * @param {Array} tarefas - A lista de todas as tarefas JÁ MAPEADAS.
 * @returns {Array}
 */
export function processarProjetos(tarefas) {
  // ✅ CORREÇÃO 1: Lógica da função inteira atualizada
  const projetosMap = new Map();
  tarefas.forEach(tarefa => {
    // garante unicidade por cliente + título (ou use JobNumber se preferir)
    const projectKey = `${tarefa.client || 'Sem cliente'} | ${tarefa.project || 'Sem título'}`;

    if (!projetosMap.has(projectKey)) {
      projetosMap.set(projectKey, {
        id: projectKey,
        name: tarefa.project || 'Sem título',
        client: tarefa.client || 'Sem cliente',
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

    // start/end já vêm como Date, mas garantimos a conversão para evitar erros
    const tarefaStart = new Date(tarefa.start);
    const tarefaEnd   = new Date(tarefa.end);

    if (!projeto.start || tarefaStart < projeto.start) projeto.start = tarefaStart;
    if (!projeto.end   || tarefaEnd   > projeto.end)   projeto.end   = tarefaEnd;
  });

  return Array.from(projetosMap.values()).map(proj => ({
    ...proj,
    groups: Array.from(proj.groups),
    group: proj.client               // ← linha do Gantt = cliente
  }));
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