/**
 * @file dashboardView.js
 * @description Ponto de entrada para a visualização de dashboard por equipe.
 * @project Dashboard de Tarefas - SUNO
 */

import moment from 'moment';
import { initCoreView } from '../coreView.js';
import { mapearDadosBrutos } from '../services/dataService.js';
import { criarTimeline, Mappers } from '../services/timelineService.js';
import { formatarTarefasParaCSV } from '../services/exportService.js';
import {
  preencherSelectClientes,
  preencherSelectGrupos,
} from '../components/filterComponents.js';

// Constantes para melhorar a legibilidade e manutenção
const GRUPO_PADRAO_FILTRO = 'CRIAÇÃO';
const TEXTO_SEM_RESPONSAVEL = 'Sem responsável';

// Função para renderizar o tooltip de TAREFAS (sem alteração)
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
  dataProcessor: mapearDadosBrutos,
  defaultFilters: {
    grupo: GRUPO_PADRAO_FILTRO,
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
  // ✅ CORREÇÃO: timelineCreator foi atualizado para agrupar pelo responsável.
  timelineCreator: (container, dados) =>
    criarTimeline(container, dados, {
      // usamos o mapper padrão…
      itemMapper: tarefa => {
        const base = Mappers.mapTarefaToTimelineItem(tarefa);
        // …mas forçamos a linha (group) a ser o responsável
        return { ...base, group: tarefa.responsible || TEXTO_SEM_RESPONSAVEL };
      },
      tooltipRenderer: renderTarefaTooltip,
    }),
  exportFormatter: () => ({
    ...formatarTarefasParaCSV(),
    fileName: 'tarefas_por_equipe',
  }),
};

// Inicializa a view
initCoreView(dashboardConfig);