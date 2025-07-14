/**
 * @file dashboardView.js - MODERNIZADO
 * @description Visualização principal do dashboard por equipe com sistema moderno
 * @project Dashboard de Tarefas - SUNO
 */

// Garantir que as bibliotecas externas estejam disponíveis
const vis = window.vis;
const moment = window.moment;
const bootstrap = window.bootstrap;

// Função para mostrar o loading moderno
function mostrarLoading(mensagem = 'Carregando...') {
  // Evita múltiplos loadings
  if (document.getElementById('modern-loading-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'modern-loading-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(15,23,42,0.6)';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  overlay.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>${mensagem}</p>
    </div>
  `;

  document.body.appendChild(overlay);
}

// Função para esconder o loading moderno
function esconderLoading() {
  const overlay = document.getElementById('modern-loading-overlay');
  if (overlay) overlay.remove();
}

// Imports modernos
import { carregarDados, aplicarFiltros } from '../services/dataService.js';
import { formatarTarefasParaCSV, exportarParaCSV } from '../services/exportService.js';
import { 
  criarTimelineTarefas, 
  moverTimeline, 
  irParaHoje, 
  ajustarZoom,
  configurarEventoTelaCheia,
  CONFIG 
} from '../services/timelineService.js';
import { 
  getEl, 
  atualizarAnoRodape 
} from '../components/uiComponents.js';
import {
  preencherSelectClientes,
  preencherSelectGrupos,
  preencherSelectSubgrupos,
  configurarFiltroPeriodo,
  configurarFiltroTipoTarefa,
  obterValoresFiltros
} from '../components/filterComponents.js';

// Sistema moderno de notificações
import { 
  showSuccess, 
  showError, 
  showWarning, 
  showLoading, 
  hideLoading,
  showConfirm 
} from '../services/modernNotifications.js';

// Sistema moderno de tooltips
import { 
  createSimpleTooltip, 
  initAutoTooltips,
  destroyTooltips 
} from '../services/modernTooltipService.js';

// Estado da aplicação
let appState = {
  allData: [],
  filteredData: [],
  timeline: null,
  isLoading: false,
  settings: {
    dataSource: localStorage.getItem("dataSource") || "json",
    jsonUrl: localStorage.getItem("jsonUrl") || "dados.json",
  },
  // Novos estados para UX moderna
  lastUpdateTime: null,
  autoRefreshInterval: null,
  performanceMetrics: {
    loadTime: 0,
    filterTime: 0,
    renderTime: 0
  }
};

/**
 * Inicializa o dashboard com melhorias modernas
 */
export function initDashboard() {
  console.log("🚀 Inicializando dashboard moderno por equipe");
  
  // Métricas de performance
  const startTime = performance.now();
  
  // Atualizar o ano no rodapé
  atualizarAnoRodape();
  
  // Configurar event listeners
  setupEventListeners();
  
  // Configurar tooltips automáticos
  initAutoTooltips();
  
  // Configurar animações AOS se disponível
  if (window.AOS) {
    window.AOS.init({
      duration: 600,
      easing: 'ease-out',
      once: true
    });
  }
  
  // Carregar dados
  carregarDadosDashboard().then(() => {
    appState.performanceMetrics.loadTime = performance.now() - startTime;
    console.log(`⚡ Dashboard carregado em ${appState.performanceMetrics.loadTime.toFixed(2)}ms`);
  });
}

/**
 * Configura os event listeners com melhorias UX
 */
function setupEventListeners() {
  // Botões de navegação da timeline com feedback visual
  const btnAnterior = getEl("btn-anterior");
  const btnHoje = getEl("btn-hoje");
  const btnProximo = getEl("btn-proximo");
  const btnZoomOut = getEl("btn-zoom-out");
  const btnZoomIn = getEl("btn-zoom-in");
  
  if (btnAnterior) {
    btnAnterior.addEventListener("click", () => {
      moverTimeline(appState.timeline, -7);
      showFeedback(btnAnterior, "← Semana anterior");
    });
    createSimpleTooltip(btnAnterior, "Semana anterior", "Navigate para a semana passada");
  }
  
  if (btnHoje) {
    btnHoje.addEventListener("click", () => {
      irParaHoje(appState.timeline);
      showFeedback(btnHoje, "📍 Hoje");
    });
    createSimpleTooltip(btnHoje, "Ir para hoje", "Centraliza a timeline na data atual");
  }
  
  if (btnProximo) {
    btnProximo.addEventListener("click", () => {
      moverTimeline(appState.timeline, 7);
      showFeedback(btnProximo, "Próxima semana →");
    });
    createSimpleTooltip(btnProximo, "Próxima semana", "Navigate para a próxima semana");
  }
  
  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => {
      ajustarZoom(appState.timeline, 0.7);
      showFeedback(btnZoomOut, "🔍 Zoom out");
    });
    createSimpleTooltip(btnZoomOut, "Diminuir zoom", "Mostra mais tempo na tela");
  }
  
  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => {
      ajustarZoom(appState.timeline, 1.3);
      showFeedback(btnZoomIn, "🔍 Zoom in");
    });
    createSimpleTooltip(btnZoomIn, "Aumentar zoom", "Mostra menos tempo com mais detalhes");
  }
  
  // Botão de exportação com confirmação
  const btnExportar = getEl("exportar-dados");
  if (btnExportar) {
    btnExportar.addEventListener("click", async () => {
      if (appState.filteredData.length === 0) {
        showWarning("Nenhum dado para exportar", "Ajuste os filtros para ver mais tarefas");
        return;
      }
      
      const confirmed = await showConfirm(
        "Exportar dados para CSV?", 
        `Será gerado um arquivo com ${appState.filteredData.length} tarefas`
      );
      
      if (confirmed) {
        exportarCSV();
      }
    });
    createSimpleTooltip(btnExportar, "Exportar para CSV", "Baixa as tarefas filtradas");
  }
  
  // Filtros com debounce para melhor performance
  const debouncedUpdate = debounce(atualizarFiltros, 300);
  
  const clienteSelect = getEl("cliente-principal-select");
  if (clienteSelect) {
    clienteSelect.addEventListener("change", debouncedUpdate);
  }
  
  const periodoSelect = getEl("periodo-select");
  if (periodoSelect) {
    periodoSelect.addEventListener("change", debouncedUpdate);
  }
  
  // Remover eventos de grupo/subgrupo
  // Adicionar evento para input de nome já está em preencherFiltros
  
  // Filtros de tipo de tarefa
  const tarefasCheckbox = getEl("mostrar-tarefas");
  const subtarefasCheckbox = getEl("mostrar-subtarefas");
  
  if (tarefasCheckbox) {
    tarefasCheckbox.addEventListener("change", debouncedUpdate);
  }
  
  if (subtarefasCheckbox) {
    subtarefasCheckbox.addEventListener("change", debouncedUpdate);
  }
  
  // Detectar mudanças na janela para otimizar timeline
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (appState.timeline) {
        appState.timeline.redraw();
      }
    }, 250);
  });
  
  // Detectar visibilidade da página para pausar animações
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Página está oculta, pausar animações pesadas
      console.log("📱 Página oculta - otimizando performance");
    } else {
      // Página está visível, retomar animações
      console.log("👁️ Página visível - retomando animações");
      if (window.AOS) {
        window.AOS.refresh();
      }
    }
  });
}

/**
 * Mostra feedback visual em botões
 * @param {HTMLElement} button - Botão
 * @param {string} text - Texto do feedback
 */
function showFeedback(button, text) {
  if (!button) return;
  
  // Adicionar classe de feedback
  button.classList.add('btn-feedback');
  
  // Criar tooltip temporário
  const feedback = document.createElement('div');
  feedback.className = 'btn-feedback-text';
  feedback.textContent = text;
  feedback.style.cssText = `
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    animation: fadeInUp 0.3s ease;
  `;
  
  button.style.position = 'relative';
  button.appendChild(feedback);
  
  // Remover após 1 segundo
  setTimeout(() => {
    button.classList.remove('btn-feedback');
    if (feedback.parentNode) {
      feedback.remove();
    }
  }, 1000);
}

/**
 * Carrega os dados do JSON com melhorias UX
 */
async function carregarDadosDashboard() {
  try {
    const timelineContainer = getEl("timeline");
    
    // Loading moderno global
    mostrarLoading('Carregando dashboard...');
    appState.isLoading = true;
    
    const startTime = performance.now();
    
    // Carregar dados
    appState.allData = await carregarDados(appState.settings.jsonUrl);
    
    const loadTime = performance.now() - startTime;
    appState.performanceMetrics.loadTime = loadTime;
    
    // Fechar loading
    esconderLoading();
    
    // Preencher filtros
    preencherFiltros();
    
    // Aplicar filtros e criar timeline
    await atualizarFiltros();
    
    // Sucesso com métricas
    /* Comentado para remover notificação inicial
    showSuccess(
      "Dashboard carregado!", 
      `${appState.allData.length} tarefas carregadas em ${loadTime.toFixed(0)}ms`
    );
    */
    
    // Atualizar timestamp
    appState.lastUpdateTime = new Date();
    // updateLastUpdateDisplay(); // Comentado para remover o display de "Atualizado às"
    
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    
    esconderLoading();
    
    showError(
      "Erro ao carregar dados",
      `${error.message}\n\nVerifique se o arquivo dados.json está disponível.`
    );
    
    const timelineContainer = getEl("timeline");
    if (timelineContainer) {
      timelineContainer.innerHTML = `
        <div class="alert alert-danger m-4 animate__animated animate__fadeIn">
          <div class="d-flex align-items-center mb-3">
            <i class="fas fa-exclamation-triangle me-2 text-danger"></i>
            <h5 class="mb-0">Erro ao carregar dados</h5>
          </div>
          <p class="mb-2">${error.message}</p>
          <p class="mb-3 text-muted">Verifique se o arquivo JSON está disponível e formatado corretamente.</p>
          <button class="btn btn-accent btn-sm" onclick="location.reload()">
            <i class="fas fa-redo me-1"></i>
            Tentar novamente
          </button>
        </div>
      `;
    }
    
  } finally {
    appState.isLoading = false;
    // Removido showLoadingState para evitar conflito de loading global
  }
}

/**
 * Mostra/oculta estado de loading moderno
 * @param {HTMLElement} container - Container
 * @param {boolean} show - Mostrar ou ocultar
 */
function showLoadingState(container, show) {
  if (!container) return;

  if (show) {
    container.innerHTML = `
      <div class="loading-container animate__animated animate__fadeIn">
        <div class="loading-spinner"></div>
        <p class="mt-3">Carregando dados...</p>
        <div class="loading-progress">
          <div class="progress-bar-modern">
            <div class="progress-fill-modern"></div>
          </div>
        </div>
      </div>
    `;
    
    // Animar barra de progresso
    setTimeout(() => {
      const fill = container.querySelector('.progress-fill-modern');
      if (fill) {
        fill.style.width = '100%';
      }
    }, 100);
  } else {
    const loading = container.querySelector('.loading-container');
    if (loading) {
      loading.classList.add('animate__fadeOut');
      setTimeout(() => loading.remove(), 300);
    }
  }
}

/**
 * Preenche os filtros com base nos dados carregados
 */
function preencherFiltros() {
  if (!appState.allData || appState.allData.length === 0) return;
  
  console.log("🔧 Preenchendo filtros...");
  
  // Preencher select de clientes normalmente
  preencherSelectClientes(appState.allData, 'cliente-principal-select');
  // Adicionar input de filtro de nome se não existir
  let nomeInput = getEl('responsavel-nome-input');
  if (!nomeInput) {
    const filtrosContainer = getEl('filtros-container') || document.body;
    nomeInput = document.createElement('input');
    nomeInput.type = 'text';
    nomeInput.id = 'responsavel-nome-input';
    nomeInput.placeholder = 'Filtrar por responsável...';
    nomeInput.className = 'form-control filtro-nome';
    nomeInput.style = 'max-width: 250px; margin-left: 1rem; display: inline-block;';
    filtrosContainer.appendChild(nomeInput);
    nomeInput.addEventListener('input', debounce(atualizarFiltros, 300));
  }
  // Filtro de período permanece
  configurarFiltroPeriodo('periodo-select', atualizarFiltros);
  // Filtros de tipo de tarefa permanecem
  configurarFiltroTipoTarefa('mostrar-tarefas', 'mostrar-subtarefas', atualizarFiltros);
  
  console.log("✅ Filtros preenchidos com sucesso");
}

/**
 * Atualiza o select de subgrupos com base no grupo selecionado
 */
function atualizarSubgrupos() {
  const grupoSelecionado = getEl("grupo-select")?.value || "todos";
  preencherSelectSubgrupos(appState.allData, grupoSelecionado, 'subgrupo-select');
}

/**
 * Atualiza os filtros e a visualização com métricas de performance
 */
async function atualizarFiltros() {
  if (!appState.allData || appState.allData.length === 0) return;
  const startTime = performance.now();
  try {
    // Obter valores dos filtros
    const filtros = obterValoresFiltros({
      clienteSelectId: 'cliente-principal-select',
      periodoSelectId: 'periodo-select',
      mostrarTarefasId: 'mostrar-tarefas',
      mostrarSubtarefasId: 'mostrar-subtarefas'
    });
    // Sempre filtrar por CRIAÇÃO
    let resultado = appState.allData.filter(item => item.TaskOwnerGroup === 'CRIAÇÃO');
    // Filtro por nome
    const nomeInput = getEl('responsavel-nome-input');
    const nomeFiltro = nomeInput ? nomeInput.value.trim().toLowerCase() : '';
    if (nomeFiltro) {
      resultado = resultado.filter(item => (item.responsible || '').toLowerCase().includes(nomeFiltro));
    }
    // Aplicar demais filtros (cliente, período, tipo de tarefa)
    let resultadoFinal = aplicarFiltros(resultado, filtros);
    appState.filteredData = resultadoFinal;
    const filterTime = performance.now() - startTime;
    appState.performanceMetrics.filterTime = filterTime;
    await criarTimeline(appState.filteredData);
    // Atualizar indicadores na UI
    // updateFilterStatus(filtros); // Comentado para remover o display de contagem de tarefas
    
    console.log(`🔍 Filtros aplicados em ${filterTime.toFixed(2)}ms - ${appState.filteredData.length} tarefas`);
    
  } catch (error) {
    console.error('Erro ao atualizar filtros:', error);
    showError('Erro nos filtros', error.message);
  }
}

/**
 * Atualiza indicadores de status dos filtros
 * @param {Object} filtros - Filtros aplicados
 */
function updateFilterStatus(filtros) {
  // Atualizar contador de resultados
  const total = appState.allData.length;
  const filtered = appState.filteredData.length;
  const percentage = total > 0 ? ((filtered / total) * 100).toFixed(1) : 0;
  
  // Criar ou atualizar indicador
  let indicator = document.querySelector('.filter-status');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'filter-status';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 1000;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(indicator);
  }
  
  indicator.innerHTML = `
    <i class="fas fa-filter me-1"></i>
    ${filtered} de ${total} tarefas (${percentage}%)
  `;
  
  // Auto-hide após 3 segundos
  clearTimeout(indicator._hideTimer);
  indicator._hideTimer = setTimeout(() => {
    indicator.style.opacity = '0.3';
  }, 3000);
  
  // Restaurar opacidade no hover
  indicator.addEventListener('mouseenter', () => {
    indicator.style.opacity = '1';
  });
}

/**
 * Cria a timeline com os dados filtrados - VERSÃO MODERNIZADA
 * @param {Array} dados - Dados filtrados para exibir na timeline
 */
async function criarTimeline(dados) {
  const container = getEl("timeline");
  if (!container) return;

  // Garantir classe do container
  container.classList.add('timeline-container');

  const renderStartTime = performance.now();

  try {
    // Limpar tooltips existentes
    destroyTooltips(container);
    
    // Limpar container
    container.innerHTML = "";

    if (!dados || dados.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info m-4 animate__animated animate__fadeIn">
          <div class="d-flex align-items-center">
            <i class="fas fa-info-circle me-3 text-info" style="font-size: 1.5rem;"></i>
            <div>
              <h5 class="mb-1">Nenhuma tarefa encontrada</h5>
              <p class="mb-0 text-muted">Ajuste os filtros acima para ver mais tarefas</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    console.log("🎨 Criando timeline moderna com", dados.length, "tarefas...");

    const timelineResult = await criarTimelineTarefas(container, dados, {
      priorityClasses: CONFIG.priorityClasses,
      animations: CONFIG.animations
    });

    if (timelineResult) {
      appState.timeline = timelineResult.timeline;

      // Configurar evento de fullscreen
      configurarFullscreen();
      
      // Métricas de render
      const renderTime = performance.now() - renderStartTime;
      appState.performanceMetrics.renderTime = renderTime;
      
      console.log(`✨ Timeline criada com sucesso em ${renderTime.toFixed(2)}ms!`);
      
      // Feedback sutil de sucesso
      /* Comentado para remover notificação inicial
      if (dados.length > 50) {
        setTimeout(() => {
          showSuccess(
            "Timeline carregada!", 
            `${dados.length} tarefas renderizadas`,
            { timer: 2000 }
          );
        }, 500);
      }
      */
    }

  } catch (error) {
    console.error("Erro ao criar timeline:", error);
    
    container.innerHTML = `
      <div class="alert alert-danger m-4 animate__animated animate__shakeX">
        <div class="d-flex align-items-center mb-3">
          <i class="fas fa-exclamation-triangle me-2 text-danger"></i>
          <h5 class="mb-0">Erro ao criar timeline</h5>
        </div>
        <p class="mb-2">${error.message}</p>
        <button class="btn btn-accent btn-sm" onclick="window.location.reload()">
          <i class="fas fa-redo me-1"></i>
          Recarregar página
        </button>
      </div>
    `;
    
  }
}

/**
 * Configura modo fullscreen moderno
 */
function configurarFullscreen() {
  const btnFullscreenGantt = getEl("btn-fullscreen-gantt");
  const container = getEl("timeline");
  
  if (btnFullscreenGantt && container) {
    btnFullscreenGantt.onclick = async () => {
      try {
        if (!document.fullscreenElement) {
          await container.requestFullscreen();
          showFeedback(btnFullscreenGantt, "🖥️ Modo tela cheia");
        } else {
          await document.exitFullscreen();
          showFeedback(btnFullscreenGantt, "🪟 Modo janela");
        }
      } catch (error) {
        showWarning("Fullscreen indisponível", "Seu navegador não suporta modo tela cheia");
      }
    };
    
    createSimpleTooltip(btnFullscreenGantt, "Alternar tela cheia", "Maximize a timeline");
  }
}

/**
 * Exporta os dados filtrados para CSV com confirmação moderna
 */
async function exportarCSV() {
  if (!appState.filteredData || appState.filteredData.length === 0) {
    showWarning("Nenhum dado para exportar", "Ajuste os filtros para incluir mais tarefas");
    return;
  }

  try {
    // Mostrar loading
    const loading = showLoading("Gerando CSV...", "Preparando arquivo para download");
    
    // Simular delay para mostrar loading (remover em produção)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { headers, formatarLinha } = formatarTarefasParaCSV();
    
    exportarParaCSV(
      appState.filteredData,
      headers,
      formatarLinha,
      "tarefas_por_equipe"
    );
    
    hideLoading();
    
    // Métricas de exportação
    const timestamp = new Date().toLocaleString('pt-BR');
    showSuccess(
      "Arquivo CSV gerado!", 
      `${appState.filteredData.length} tarefas exportadas em ${timestamp}`
    );
    
  } catch (error) {
    hideLoading();
    showError("Erro na exportação", error.message);
  }
}

/**
 * Atualiza display do último update
 */
function updateLastUpdateDisplay() {
  if (!appState.lastUpdateTime) return;
  
  let display = document.querySelector('.last-update-display');
  if (!display) {
    display = document.createElement('div');
    display.className = 'last-update-display';
    display.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 6px 10px;
      border-radius: 15px;
      font-size: 11px;
      opacity: 0.7;
      z-index: 999;
    `;
    document.body.appendChild(display);
  }
  
  const timeStr = appState.lastUpdateTime.toLocaleTimeString('pt-BR');
  display.innerHTML = `<i class="fas fa-clock me-1"></i>Atualizado às ${timeStr}`;
}

/**
 * Utilitário de debounce para otimizar performance
 * @param {Function} func - Função a ser debounced
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função debounced
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Inicializar imediatamente, já que o script é carregado após o DOM estar pronto
initDashboard();

// Adicionar estilos CSS inline para feedback (temporário)
const feedbackStyles = `
  <style>
    .btn-feedback {
      transform: scale(0.95);
      transition: transform 0.1s ease;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    
    .loading-progress {
      width: 200px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 1rem;
    }
    
    .progress-bar-modern {
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    
    .progress-fill-modern {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #ffc801, #ffd84d);
      border-radius: 2px;
      transition: width 2s ease-out;
    }
  </style>
`;

document.head.insertAdjacentHTML('beforeend', feedbackStyles);