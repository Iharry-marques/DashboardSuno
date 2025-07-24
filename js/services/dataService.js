/**
 * @file dataService.js
 * @description Serviço para carregar, mapear e filtrar dados.
 */
export async function carregarDados(url = 'dados.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

export function mapearDadosBrutos(dadosBrutos) {
    if (!Array.isArray(dadosBrutos)) return [];
    const mapeados = dadosBrutos.map(item => ({
        id: item.UniqueTaskID,
        tipo: item.TipoTarefa,
        client: (item.ClientNickname || item.Cliente || item.DisplayName || '').trim(),
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

export function processarProjetos(tarefas) {
  const projetosMap = new Map();
  tarefas.forEach((tarefa) => {
    const projectKey = tarefa.project || `Projeto Avulso - ${tarefa.client}`;
    if (!projetosMap.has(projectKey)) {
      projetosMap.set(projectKey, {
        id: projectKey, name: projectKey,
        client: (tarefa.client || 'Cliente Desconhecido').trim(),
        tasks: [], groups: new Set(),
        start: null, end: null, status: 'Em andamento', priority: 'medium'
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
    proj.group = proj.client;
    return proj;
  });
}

export function processarClientesHierarquico(tarefas) {
  const grupos = new window.vis.DataSet();
  const clientes = new Map();
  const projetos = new Map();

  tarefas.forEach(t => {
      const projKey = t.project || `Projeto Avulso - ${t.client}`;
      if (!projetos.has(projKey)) {
          projetos.set(projKey, { id: projKey, name: projKey, client: t.client, tasks: [] });
      }
      projetos.get(projKey).tasks.push(t);
  });

  projetos.forEach(proj => {
      if (!clientes.has(proj.client)) {
          clientes.set(proj.client, { id: proj.client, content: proj.client, nestedGroups: [] });
      }
      clientes.get(proj.client).nestedGroups.push(proj.id);
      grupos.add({ id: proj.id, content: proj.name });
  });

  clientes.forEach(c => grupos.add(c));
  return { grupos, tarefas };
}

export function aplicarFiltros(dados, filtros) {
    if (!dados) return [];
    return dados.filter(item => {
        if (filtros.grupo && filtros.grupo !== 'todos' && item.group !== filtros.grupo) {
            return false;
        }
        if (filtros.cliente && filtros.cliente !== 'todos' && item.client !== filtros.cliente) {
            return false;
        }
        return true;
    });
}