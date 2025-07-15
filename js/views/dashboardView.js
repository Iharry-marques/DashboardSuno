/**
 * @file dashboardView.js
 * @description Ponto de entrada para a visualização de dashboard por equipe.
 * @project Dashboard de Tarefas - SUNO
 */

import { initCoreView } from '../coreView.js';
import { criarTimeline, Mappers } from '../services/timelineService.js';
import { formatarTarefasParaCSV } from '../services/exportService.js';
import {
  preencherSelectClientes,
  preencherSelectGrupos,
} from '../components/filterComponents.js';

// Função para renderizar o tooltip de TAREFAS
function renderTarefaTooltip(item) {
  if (!item || !item.itemData) return '';
  const tarefa = item.itemData;
  return `
    <div class="suno-tooltip">
      <div class="tooltip-title">${tarefa.content}</div>
      <div class="tooltip-body">
        <div><strong>Cliente:</strong> ${tarefa.client}</div>
        <div><strong>Responsável:</strong> ${tarefa.responsible || 'N/A'}</div>
        <div><strong>Status:</strong> ${tarefa.status}</div>
        <div><strong>Prazo:</strong> ${moment(tarefa.end).format('DD/MM/YYYY')}</div>
      </div>
    </div>
  `;
}

// Configuração específica para o dashboard de equipes
const dashboardConfig = {
  defaultFilters: {
    grupo: 'CRIAÇÃO',
  },
  filterConfig: {
    clienteSelectId: 'cliente-select',
    grupoSelectId: 'grupo-select',
    periodoSelectId: 'periodo-select',
    mostrarTarefasId: 'mostrar-tarefas',
    mostrarSubtarefasId: 'mostrar-subtarefas',
  },
  preencherFiltros: (dados) => {
    preencherSelectClientes(dados, 'cliente-select');
    preencherSelectGrupos(dados, 'grupo-select');
  },
  // Passa a função genérica `criarTimeline` com as configurações específicas
  timelineCreator: (container, dados) =>
    criarTimeline(container, dados, {
      itemMapper: Mappers.mapTarefaToTimelineItem,
      tooltipRenderer: renderTarefaTooltip,
    }),
  exportFormatter: () => ({
    ...formatarTarefasParaCSV(),
    fileName: 'tarefas_por_equipe',
  }),
};

// Inicializa a view
initCoreView(dashboardConfig);