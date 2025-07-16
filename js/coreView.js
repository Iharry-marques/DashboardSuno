/**
 * @file coreView.js
 * @description Motor de visualização genérico para o Dashboard de Tarefas.
 * Contém logs de depuração para rastrear o fluxo de dados.
 */

// Imports de Serviços e Componentes
import { aplicarFiltros, carregarDados } from './services/dataService.js';
import { exportarParaCSV } from './services/exportService.js';
import {
  ajustarZoom,
  configurarEventoTelaCheia,
  irParaHoje,
  moverTimeline
} from './services/timelineService.js';
import { obterValoresFiltros, configurarFiltroPeriodo, preencherSelectClientes, preencherSelectGrupos } from './components/filterComponents.js';
import { showConfirm, showError, showWarning } from './services/modernNotifications.js';
import { debounce, getEl, showFeedback } from './helpers/utils.js';


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
  const { filterConfig } = config;
  const debouncedUpdate = debounce(() => updateView(config), 300);

  if (filterConfig) {
    Object.keys(filterConfig).forEach(key => {
      const elementId = filterConfig[key];
      const element = getEl(elementId);
      if (element) {
        const eventType = (element.type === 'checkbox' || element.type === 'radio' || element.type === 'select-one') ? 'change' : 'input';
        element.addEventListener(eventType, debouncedUpdate);
      }
    });
  }
}

async function loadData(config) {
    try {
        appState.allData = await carregarDados(appState.settings.jsonUrl);
        
        appState.processedData = config.dataProcessor ? config.dataProcessor(appState.allData) : appState.allData;

        // ✅ DEBUG RESTAURADO: Checa dados por duplicatas
        const ids = appState.processedData.map(d => d.id);
        const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
        if (dup.length) console.warn('[DEBUG DUPLICADOS]', dup.slice(0,10));

        // ✅ DEBUG RESTAURADO: Verifica dados após o processamento inicial
        console.log('[DEBUG 2] Dados após processamento:', appState.processedData.length, 'itens', appState.processedData[0]);

        if (config.preencherFiltros) {
            config.preencherFiltros(appState.processedData);
        }

        if (config.filterConfig.periodoSelectId) {
            configurarFiltroPeriodo(config.filterConfig.periodoSelectId, () => updateView(config));
        }

        updateView(config);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError('Erro ao Carregar Dados', `${error.message}\n\nVerifique o arquivo de dados.`);
    }
}

// <<< NOVA FUNÇÃO ADICIONADA AQUI
function configurarControlesTimeline() {
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnAnterior = document.getElementById('btn-anterior');
  const btnProximo = document.getElementById('btn-proximo');
  const btnHoje = document.getElementById('btn-hoje');

  if (btnZoomIn) btnZoomIn.onclick = () => ajustarZoom(window.timeline, 0.8);
  if (btnZoomOut) btnZoomOut.onclick = () => ajustarZoom(window.timeline, 1.25);
  if (btnAnterior) btnAnterior.onclick = () => moverTimeline(window.timeline, -7);
  if (btnProximo) btnProximo.onclick = () => moverTimeline(window.timeline, 7);
  if (btnHoje) btnHoje.onclick = () => irParaHoje(window.timeline);
}

async function updateView(config) {
  const { filterConfig, timelineCreator, defaultFilters } = config;

  let filtros = obterValoresFiltros(filterConfig);
  console.log('[DEBUG Filtros]', filtros);

  if (defaultFilters) {
    filtros = { ...filtros, ...defaultFilters };
  }
  
  appState.filteredData = aplicarFiltros(appState.processedData, filtros);

  // ✅ DEBUG RESTAURADO: Verifica dados após a filtragem
  console.log('[DEBUG 4] Dados após filtragem:', appState.filteredData.length, 'itens');

  if (timelineCreator) {
    const container = getEl('timeline');
    if (container) {
      // ✅ DEBUG RESTAURADO: Verifica a quantidade de dados enviados para a timeline
      console.log('[DEBUG 5] Chamando criador da timeline com', appState.filteredData.length, 'itens');
      appState.timeline = await timelineCreator(container, appState.filteredData);
      configurarControlesTimeline(); // <-- ALTERAÇÃO: LINHA ADICIONADA AQUI!
    }
  }
}

async function exportData(config) {
  const { exportFormatter } = config;

  if (appState.filteredData.length === 0) {
    showWarning(
      'Nenhum dado para exportar',
      'Ajuste os filtros para ver mais itens.'
    );
    return;
  }

  const confirmed = await showConfirm(
    'Exportar dados para CSV?',
    `Será gerado um arquivo com ${appState.filteredData.length} itens.`
  );

  if (confirmed && exportFormatter) {
    const { headers, formatarLinha, fileName } = exportFormatter();
    exportarParaCSV(
      appState.filteredData,
      headers,
      formatarLinha,
      fileName
    );
  }
}