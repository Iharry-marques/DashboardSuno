/**
 * @file clientsView.js - VERSÃO CORRIGIDA
 * @description Visualização do dashboard por cliente
 * @project Dashboard de Tarefas - SUNO
 */

// Garantir que as bibliotecas externas estejam disponíveis
const vis = window.vis;
const moment = window.moment;
const bootstrap = window.bootstrap;

import { carregarDados, processarProjetos, aplicarFiltros } from '../services/dataService.js';
import { formatarProjetosParaCSV, exportarParaCSV } from '../services/exportService.js';
import { 
  criarTimelineProjetos, 
  moverTimeline, 
  irParaHoje, 
  ajustarZoom,
  configurarEventoTelaCheia,
  CONFIG 
} from '../services/timelineService.js';
import { 
  getEl, 
  mostrarLoading, 
  mostrarNotificacao, 
  atualizarAnoRodape 
} from '../components/uiComponents.js';
import {
  preencherSelectClientes,
  preencherSelectGrupos,
  configurarFiltroPeriodo,
  obterValoresFiltros
} from '../components/filterComponents.js';

// Estado da aplicação
let appState = {
  allData: [],
  filteredData: [],
  timeline: null,
  isLoading: false,
  projects: [], // Array para armazenar projetos
  settings: {
    dataSource: localStorage.getItem("dataSource") || "json",
    jsonUrl: localStorage.getItem("jsonUrl") || "dados.json",
  },
};

/**
 * Inicializa o dashboard de clientes
 */
export function initClientsDashboard() {
  console.log("Inicializando dashboard por cliente");
  
  // Atualizar o ano no rodapé
  atualizarAnoRodape();
  
  // Configurar event listeners
  setupEventListeners();
  
  // Carregar dados
  carregarDadosClientes();
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
  // Botões de navegação da timeline
  getEl("btn-anterior")?.addEventListener("click", () => moverTimeline(appState.timeline, -7));
  getEl("btn-hoje")?.addEventListener("click", () => irParaHoje(appState.timeline));
  getEl("btn-proximo")?.addEventListener("click", () => moverTimeline(appState.timeline, 7));
  getEl("btn-zoom-out")?.addEventListener("click", () => ajustarZoom(appState.timeline, 0.7));
  getEl("btn-zoom-in")?.addEventListener("click", () => ajustarZoom(appState.timeline, 1.3));
  
  // Botão de exportação
  getEl("exportar-dados")?.addEventListener("click", exportarCSV);
  
  // Verificando ambos os possíveis IDs para o select de cliente
  const clienteSelect = getEl("cliente-select") || getEl("cliente-principal-select");
  if (clienteSelect) {
    clienteSelect.addEventListener("change", atualizarFiltros);
  }
  
  // Verificando ambos os possíveis IDs para o select de grupo
  const grupoSelect = getEl("grupo-principal-select") || getEl("grupo-select");
  if (grupoSelect) {
    grupoSelect.addEventListener("change", atualizarFiltros);
  }
  
  getEl("periodo-select")?.addEventListener("change", atualizarFiltros);
}

/**
 * Carrega os dados do JSON
 */
async function carregarDadosClientes() {
  try {
    const timelineContainer = getEl("timeline");
    mostrarLoading(timelineContainer, true);
    appState.isLoading = true;
    
    appState.allData = await carregarDados(appState.settings.jsonUrl);
    
    // Processar projetos a partir das tarefas
    appState.projects = processarProjetos(appState.allData);
    
    preencherFiltros();
    await atualizarFiltros(); // **CORREÇÃO: Aguardar criação da timeline**
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    
    const timelineContainer = getEl("timeline");
    if (timelineContainer) {
      timelineContainer.innerHTML = `
        <div class="alert alert-danger m-3">
          <h5>Erro ao carregar dados</h5>
          <p>${error.message}</p>
          <p>Verifique se o arquivo JSON está disponível e formatado corretamente.</p>
        </div>
      `;
    }
    
    mostrarNotificacao("Erro ao carregar dados", error.message, "error");
  } finally {
    appState.isLoading = false;
    mostrarLoading(getEl("timeline"), false);
  }
}

/**
 * Preenche os filtros com base nos dados carregados
 */
function preencherFiltros() {
  if (!appState.projects || appState.projects.length === 0) return;
  
  // Preencher selects de cliente e grupo
  preencherSelectClientes(appState.projects, 'cliente-principal-select,cliente-select');
  
  // Coletar grupos únicos dos projetos
  const grupos = new Set();
  appState.projects.forEach(projeto => {
    projeto.groups.forEach(grupo => grupos.add(grupo));
  });
  
  // Preencher select de grupos
  const grupoSelect = getEl("grupo-principal-select") || getEl("grupo-select");
  if (grupoSelect) {
    grupoSelect.innerHTML = '<option value="todos">Todos</option>';
    
    // Adicionar grupos encontrados
    [...grupos].sort().forEach(grupo => {
      grupoSelect.add(new Option(grupo, grupo));
    });
  }
  
  // Configurar filtro de período
  configurarFiltroPeriodo('periodo-select', atualizarFiltros);
}

/**
 * Atualiza os filtros e a visualização - VERSÃO CORRIGIDA (ASYNC)
 */
async function atualizarFiltros() {
  if (!appState.projects || appState.projects.length === 0) return;
  
  // Obter valores dos filtros
  const filtros = obterValoresFiltros({
    clienteSelectId: 'cliente-principal-select,cliente-select',
    grupoSelectId: 'grupo-principal-select,grupo-select',
    periodoSelectId: 'periodo-select'
  });
  
  // Aplicar filtros
  appState.filteredData = aplicarFiltros(appState.projects, filtros);
  
  // **CORREÇÃO: Aguardar criação da timeline**
  await criarTimeline(appState.filteredData);
}

/**
 * Cria a timeline com os dados filtrados - VERSÃO CORRIGIDA (ASYNC)
 * @param {Array} projetos - Projetos filtrados para exibir na timeline
 */
async function criarTimeline(projetos) {
  const container = getEl("timeline");
  if (!container) return;
  
  // Limpar container
  container.innerHTML = "";
  
  if (!projetos || projetos.length === 0) {
    container.innerHTML = '<div class="alert alert-info m-3">Nenhum projeto encontrado</div>';
    return;
  }
  
  try {
    console.log("Criando timeline com", projetos.length, "projetos...");
    
    // **CORREÇÃO: Aguardar criação da timeline**
    const timelineResult = await criarTimelineProjetos(container, projetos, {
      priorityClasses: CONFIG.priorityClasses,
      clientColors: CONFIG.clientColors
    });
    
    if (timelineResult) {
      appState.timeline = timelineResult.timeline;

      // Configurar evento de fullscreen
      const btnFullscreenGantt = getEl("btn-fullscreen-gantt");
      if (btnFullscreenGantt && container) {
        btnFullscreenGantt.onclick = () => {
          if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
              container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
              container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
              container.msRequestFullscreen();
            }
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
            }
          }
        };
      }
      
      console.log("Timeline de projetos criada e configurada com sucesso!");
    }
  } catch (error) {
    console.error("Erro ao criar timeline:", error);
    container.innerHTML = `<div class="alert alert-danger m-3">Erro ao criar timeline: ${error.message}</div>`;
  }
}

/**
 * Exporta os dados filtrados para CSV
 */
function exportarCSV() {
  if (!appState.filteredData || appState.filteredData.length === 0) {
    mostrarNotificacao("Exportação", "Não há dados para exportar.", "warning");
    return;
  }
  
  const { headers, formatarLinha } = formatarProjetosParaCSV();
  
  exportarParaCSV(
    appState.filteredData,
    headers,
    formatarLinha,
    "projetos_por_cliente"
  );
}

// Inicializar imediatamente, já que o script é carregado após o DOM estar pronto
initClientsDashboard();