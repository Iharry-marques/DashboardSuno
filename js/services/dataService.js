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
    return dadosBrutos.map(item => ({
        id: item.UniqueTaskID,
        tipo: item.TipoTarefa,
        client: item.ClientNickname,
        project: item.JobTitle,
        content: item.TaskTitle,
        start: item.TaskCreationDate,
        end: item.CurrentDueDate,
        responsible: item.TaskOwnerDisplayName,
        group: item.TaskOwnerFunctionGroupName, // A propriedade correta!
        fullPath: item.TaskOwnerGroupName,
        status: item.PipelineStepTitle,
        priority: item.JobHealth, // Supondo que JobHealth mapeia para prioridade
    }));
}


/**
 * Agrupa tarefas individuais em projetos.
 * @param {Array} tarefas - A lista de todas as tarefas JÁ MAPEADAS.
 * @returns {Array}
 */
export function processarProjetos(tarefas) {
  const projetosMap = new Map();
  tarefas.forEach((tarefa) => {
    const projectKey = tarefa.project || `Projeto Avulso - ${tarefa.client}`;
    if (!projetosMap.has(projectKey)) {
      projetosMap.set(projectKey, {
        id: projectKey, name: projectKey, client: tarefa.client, tasks: [],
        groups: new Set(), start: null, end: null, status: 'Em andamento', priority: 'medium'
      });
    }
    const projeto = projetosMap.get(projectKey);
    projeto.tasks.push(tarefa);
    if(tarefa.group) projeto.groups.add(tarefa.group);
    const tarefaStart = new Date(tarefa.start);
    const tarefaEnd = new Date(tarefa.end);
    if (!projeto.start || tarefaStart < projeto.start) projeto.start = tarefaStart;
    if (!projeto.end || tarefaEnd > projeto.end) projeto.end = tarefaEnd;
  });

  return Array.from(projetosMap.values()).map(proj => {
    proj.groups = Array.from(proj.groups);
    proj.group = proj.client; // Para compatibilidade com a timeline
    return proj;
  });
}

/**
 * Aplica uma série de filtros aos dados.
 * @param {Array} dados - Os dados a serem filtrados.
 * @param {object} filtros - Um objeto com os valores dos filtros.
 * @returns {Array}
 */
export function aplicarFiltros(dados, filtros) {
    if (!dados) return []; // Guarda para previnir o erro "Cannot read properties of null"
    
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