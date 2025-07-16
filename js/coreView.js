/**
 * @file coreView.js
 * @description Motor de visualização genérico para o Dashboard de Tarefas.
 */
import { aplicarFiltros, carregarDados } from './services/dataService.js';
import { exportarParaCSV } from './services/exportService.js';
import { ajustarZoom, configurarEventoTelaCheia, irParaHoje, moverTimeline } from './services/timelineService.js';
import { obterValoresFiltros, configurarFiltroPeriodo } from './components/filterComponents.js';
import { showConfirm, showError, showWarning } from './services/modernNotifications.js';
import { debounce, getEl } from './helpers/utils.js';
// ✅ IMPORTA A FUNÇÃO CORRETA
import { initializeTooltips } from './tooltipEnhancements.js';

const appState = {
  allData: [],
  filteredData: [],
  processedData: [],
  timeline: null,
  settings: {
    jsonUrl: 'dados.json'
  }
};

export function initCoreView(config) {
  console.log('🚀 Inicializando Core View...');
  setupEventListeners(config);
  loadData(config);
}

function setupEventListeners(config) {
  const { filterConfig, exportConfig } = config;
  const debouncedUpdate = debounce(() => updateView(config), 300);
  if (filterConfig) {
    Object.keys(filterConfig).forEach(key => {
      const element = getEl(filterConfig[key]);
      if (element) {
        element.addEventListener((element.tagName === 'SELECT' || element.type === 'checkbox') ? 'change' : 'input', debouncedUpdate);
      }
    });
  }
  if (exportConfig?.elementId) {
    const exportBtn = getEl(exportConfig.elementId);
    if(exportBtn) exportBtn.onclick = () => exportData(config);
  }
}

async function loadData(config) {
    try {
        appState.allData = await carregarDados(appState.settings.jsonUrl);
        appState.processedData = config.dataProcessor ? config.dataProcessor(appState.allData) : appState.allData;
        if (config.preencherFiltros) config.preencherFiltros(appState.processedData);
        if (config.filterConfig.periodoSelectId) configurarFiltroPeriodo(config.filterConfig.periodoSelectId, () => updateView(config));
        updateView(config);
    } catch (error) {
        console.error('Erro fatal ao carregar dados:', error);
        showError('Erro ao Carregar Dados', `${error.message}\n\nVerifique o arquivo de dados.`);
    }
}

function configurarControlesTimeline() {
  const btnZoomIn = getEl('btn-zoom-in'), btnZoomOut = getEl('btn-zoom-out'), btnAnterior = getEl('btn-anterior'), btnProximo = getEl('btn-proximo'), btnHoje = getEl('btn-hoje');
  if (btnZoomIn) btnZoomIn.onclick = () => ajustarZoom(window.timeline, 0.8);
  if (btnZoomOut) btnZoomOut.onclick = () => ajustarZoom(window.timeline, 1.25);
  if (btnAnterior) btnAnterior.onclick = () => moverTimeline(window.timeline, -7);
  if (btnProximo) btnProximo.onclick = () => moverTimeline(window.timeline, 7);
  if (btnHoje) btnHoje.onclick = () => irParaHoje(window.timeline);
}

async function updateView(config) {
  const { filterConfig, timelineCreator, defaultFilters } = config;
  let filtros = obterValoresFiltros(filterConfig);
  if (defaultFilters) filtros = { ...filtros, ...defaultFilters };
  appState.filteredData = aplicarFiltros(appState.processedData, filtros);

  if (timelineCreator) {
    const container = getEl('timeline');
    if (container) {
      window.timeline = null;
      appState.timeline = await timelineCreator(container, appState.filteredData);
      if (appState.timeline) {
        console.log('%c[Core View] Timeline pronta. Comandando inicialização dos tooltips...', 'color: green; font-weight: bold;');
        configurarControlesTimeline();
        configurarEventoTelaCheia();
        // ✅ CHAMA A FUNÇÃO IMPORTADA NO MOMENTO CERTO
        initializeTooltips();
      } else {
        console.error('%c[Core View] FALHA: A timeline não foi criada.', 'color: red; font-weight: bold;');
      }
    }
  }
}

async function exportData(config) {
  if (appState.filteredData.length === 0) {
    showWarning('Nenhum dado para exportar', 'Ajuste os filtros para gerar o arquivo.');
    return;
  }
  const confirmed = await showConfirm('Exportar dados para CSV?', `Será gerado um arquivo com ${appState.filteredData.length} itens.`);
  if (confirmed && config.exportConfig?.formatter) {
    const { headers, formatarLinha, fileName } = config.exportConfig.formatter();
    exportarParaCSV(appState.filteredData, headers, formatarLinha, fileName);
  }
}