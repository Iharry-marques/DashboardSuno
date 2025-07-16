/**
 * @file clientsView.js
 * @description Ponto de entrada para a visualização de dashboard por cliente.
 * @project Dashboard de Tarefas - SUNO
 */

import { initCoreView } from '../coreView.js';
import { processarProjetos, mapearDadosBrutos } from '../services/dataService.js';
import { criarTimeline, Mappers } from '../services/timelineService.js';
import { formatarProjetosParaCSV } from '../services/exportService.js';
import {
  preencherSelectClientes,
  preencherSelectGrupos,
} from '../components/filterComponents.js';

// Função para renderizar o tooltip de PROJETOS
function renderProjetoTooltip(item) {
  if (!item || !item.itemData) return '';
  const projeto = item.itemData;
  return `
    <div class="suno-tooltip">
      <div class="tooltip-title">${projeto.name}</div>
      <div class="tooltip-body">
        <div><strong>Cliente:</strong> ${projeto.client}</div>
        <div><strong>Status:</strong> ${projeto.status}</div>
        <div><strong>Progresso:</strong> ${projeto.progress}%</div>
        <div><strong>Tarefas:</strong> ${projeto.tasks.length}</div>
      </div>
    </div>
  `;
}

// Configuração específica para o dashboard de clientes
const clientsConfig = {
  dataProcessor: dados => processarProjetos(mapearDadosBrutos(dados)),
  filterConfig: {
    clienteSelectId: 'cliente-select',
    grupoSelectId: 'grupo-select',
    periodoSelectId: 'periodo-select',
  },
  preencherFiltros: (dados) => {
    preencherSelectClientes(dados, 'cliente-select');
    preencherSelectGrupos(dados, 'grupo-select');
  },
  // ✅ CORREÇÃO 2: Mapper isolado nesta view para garantir grupo = cliente
  timelineCreator: (container, dados) =>
    criarTimeline(container, dados, {
      itemMapper: projeto => {
        const base = Mappers.mapProjetoToTimelineItem(projeto);
        return { ...base, group: projeto.client };   // garante grupo = cliente
      },
      tooltipRenderer: renderProjetoTooltip,
    }),
  exportFormatter: () => ({
    ...formatarProjetosParaCSV(),
    fileName: 'projetos_por_cliente',
  }),
};

// Inicializa a view
initCoreView(clientsConfig);