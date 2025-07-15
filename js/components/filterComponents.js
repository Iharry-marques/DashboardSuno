/**
 * @file filterComponents.js
 * @description Componentes de filtros reutilizáveis. Corrigido para lidar com dados ausentes.
 */

import { getEl } from '../helpers/utils.js';

/**
 * Preenche o select de clientes com base nos dados.
 */
export function preencherSelectClientes(dados, selectId) {
  const select = getEl(selectId);
  if (!select || !dados || dados.length === 0) return;

  const clientesExcluidos = ["ENGIE", "EUDORA", "GM", "JOHNSON'S BABY", "O.U.i", "OVVI", "SUPERDIGITAL"];
  
  const clientes = [...new Set(dados.map(item => item.client).filter(Boolean))]
    .filter(cliente => !clientesExcluidos.includes(cliente))
    .sort();

  select.innerHTML = '<option value="todos">Todos os Clientes</option>';
  clientes.forEach(cliente => {
    select.add(new Option(cliente, cliente));
  });
}

/**
 * Preenche o select de grupos com base nos dados.
 */
export function preencherSelectGrupos(dados, selectId) {
  const select = getEl(selectId);
  if (!select || !dados || dados.length === 0) return;

  let grupos;
  if (dados[0]?.tasks) { // Se for lista de projetos
    const allTarefas = dados.flatMap(proj => proj.tasks || []);
    grupos = [...new Set(allTarefas.map(item => item.TaskOwnerGroup).filter(Boolean))].sort();
  } else { // Se for lista de tarefas
    grupos = [...new Set(dados.map(item => item.TaskOwnerGroup).filter(Boolean))].sort();
  }
  
  select.innerHTML = '<option value="todos">Todos os Grupos</option>';
  grupos.forEach(grupo => {
    select.add(new Option(grupo, grupo));
  });
}

/**
 * Preenche o select de subgrupos com base no grupo selecionado.
 */
export function preencherSelectSubgrupos(dados, grupoSelecionado, selectId) {
    const subgrupoSelect = getEl(selectId);
    if (!subgrupoSelect || grupoSelecionado === "todos") {
        if(subgrupoSelect) subgrupoSelect.innerHTML = '<option value="todos">Todos os Subgrupos</option>';
        return;
    }

    subgrupoSelect.innerHTML = '<option value="todos">Todos os Subgrupos</option>';

    const tarefasDoGrupo = dados.filter(item => item.TaskOwnerGroup === grupoSelecionado);
    const subgrupos = new Set();

    tarefasDoGrupo.forEach(item => {
        // ✅ A CORREÇÃO ESTÁ AQUI!
        // Verifica se 'TaskOwnerFullPath' existe antes de usar o .split()
        if (item.TaskOwnerFullPath && typeof item.TaskOwnerFullPath === 'string') {
            const partes = item.TaskOwnerFullPath.split('/');
            if (partes.length > 1) {
                // Remove o nome do grupo principal para extrair apenas o subgrupo
                const subgrupo = partes.slice(1).join(' / ').trim();
                if (subgrupo) {
                    subgrupos.add(subgrupo);
                }
            }
        }
    });
    
    // Ordenar e adicionar subgrupos ao select
    [...subgrupos].sort().forEach(sub => {
        subgrupoSelect.add(new Option(sub, sub));
    });
}

/**
 * Configura os filtros de período com uma opção "Todo o Período" como padrão.
 */
export function configurarFiltroPeriodo(selectId, callback = null) {
  const periodoSelect = getEl(selectId);
  if (!periodoSelect) return;

  periodoSelect.innerHTML = `
    <option value="0" selected>Todo o Período</option>
    <option value="30">Últimos 30 dias</option>
    <option value="90">Últimos 90 dias</option>
    <option value="180">Últimos 6 meses</option>
    <option value="365">Último ano</option>
  `;

  if (callback) {
    periodoSelect.addEventListener('change', callback);
  }
}

/**
 * Configura os filtros de tipo de tarefa.
 */
export function configurarFiltroTipoTarefa(tarefasId, subtarefasId, callback = null) {
  const tarefasCheckbox = getEl(tarefasId);
  if (tarefasCheckbox) {
    tarefasCheckbox.checked = true;
    if (callback) tarefasCheckbox.addEventListener('change', callback);
  }

  const subtarefasCheckbox = getEl(subtarefasId);
  if (subtarefasCheckbox) {
    subtarefasCheckbox.checked = true;
    if (callback) subtarefasCheckbox.addEventListener('change', callback);
  }
}

/**
 * Obtém os valores atuais dos filtros.
 */
export function obterValoresFiltros(config = {}) {
  const cliente = getEl(config.clienteSelectId)?.value || "todos";
  const grupo = getEl(config.grupoSelectId)?.value || "todos";
  const subgrupo = getEl(config.subgrupoSelectId)?.value || "todos";
  const dias = parseInt(getEl(config.periodoSelectId)?.value || "0", 10);
  const mostrarTarefas = getEl(config.mostrarTarefasId)?.checked !== false;
  const mostrarSubtarefas = getEl(config.mostrarSubtarefasId)?.checked !== false;

  return { cliente, grupo, subgrupo, dias, mostrarTarefas, mostrarSubtarefas };
}