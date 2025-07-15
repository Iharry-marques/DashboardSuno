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
/////
/**
 * Carrega e processa os dados.
 */
async function loadData(config) {
    try {
        appState.allData = await carregarDados(appState.settings.jsonUrl);
        appState.processedData = config.dataProcessor ? config.dataProcessor(appState.allData) : appState.allData;

        if (config.preencherFiltros) {
            config.preencherFiltros(appState.processedData);
        }

        // Configura o callback para o filtro de período APÓS preencher
        if (config.filterConfig.periodoSelectId) {
            configurarFiltroPeriodo(config.filterConfig.periodoSelectId, () => updateView(config));
        }

        updateView(config);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError('Erro ao Carregar Dados', `${error.message}\n\nVerifique o arquivo de dados.`);
    }
}

async function updateView(config) {
  const { filterConfig, timelineCreator, defaultFilters } = config;

  let filtros = obterValoresFiltros(filterConfig);

  if (defaultFilters) {
    filtros = { ...filtros, ...defaultFilters };
  }

  appState.filteredData = aplicarFiltros(appState.processedData, filtros);
  
  if (timelineCreator) {
    const container = getEl('timeline');
    if (container) {
      appState.timeline = await timelineCreator(container, appState.filteredData);
    }
  }
}


/**
 * Exporta os dados filtrados para CSV.
 */
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