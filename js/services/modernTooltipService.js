/**
 * @file modernTooltipService.js
 * @description Sistema moderno de tooltips usando Tippy.js
 * @project Dashboard de Tarefas - SUNO
 */

// Verificar se Tippy.js está disponível
const tippy = window.tippy;

/**
 * Configurações padrão para tooltips modernos
 */
const defaultTooltipConfig = {
  theme: 'suno-modern',
  animation: 'scale-subtle',
  duration: [200, 150],
  delay: [300, 100],
  interactive: true,
  allowHTML: true,
  placement: 'top',
  arrow: true,
  offset: [0, 12],
  maxWidth: 400,
  hideOnClick: false,
  trigger: 'mouseenter focus click',
  appendTo: () => document.body,
  zIndex: 10000
};

/**
 * Templates de tooltips para diferentes tipos de conteúdo
 */
const tooltipTemplates = {
  /**
   * Template para tooltip de tarefa
   * @param {Object} item - Dados da tarefa
   * @returns {string} HTML do tooltip
   */
  task: (item) => `
    <div class="modern-tooltip task-tooltip">
      <div class="tooltip-header">
        <div class="tooltip-title">${item.name || 'Tarefa sem nome'}</div>
        <div class="tooltip-priority priority-${item.Priority?.toLowerCase() || 'medium'}">
          ${getPriorityIcon(item.Priority)} ${getPriorityText(item.Priority)}
        </div>
      </div>
      
      <div class="tooltip-content">
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-building"></i> Cliente:
          </span>
          <span class="tooltip-value">${item.client || 'N/A'}</span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-user"></i> Responsável:
          </span>
          <span class="tooltip-value">${item.responsible || 'N/A'}</span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-calendar"></i> Período:
          </span>
          <span class="tooltip-value">
            ${moment(item.start).format('DD/MM/YY HH:mm')} → 
            ${moment(item.end).format('DD/MM/YY HH:mm')}
          </span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-tasks"></i> Status:
          </span>
          <span class="tooltip-value status-${getStatusClass(item.PipelineStepTitle)}">
            ${item.PipelineStepTitle || 'N/A'}
          </span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-users"></i> Equipe:
          </span>
          <span class="tooltip-value">${item.TaskOwnerFullPath || 'N/A'}</span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-tag"></i> Tipo:
          </span>
          <span class="tooltip-value ${item.tipo === 'Subtarefa' ? 'subtask' : 'task'}">
            ${item.tipo || 'Tarefa'}
          </span>
        </div>
      </div>
      
      ${item.project ? `
        <div class="tooltip-footer">
          <span class="tooltip-project">
            <i class="fas fa-folder"></i> ${item.project}
          </span>
        </div>
      ` : ''}
    </div>
  `,

  /**
   * Template para tooltip de projeto
   * @param {Object} projeto - Dados do projeto
   * @returns {string} HTML do tooltip
   */
  project: (projeto) => `
    <div class="modern-tooltip project-tooltip">
      <div class="tooltip-header">
        <div class="tooltip-title">${projeto.name || 'Projeto sem nome'}</div>
        <div class="tooltip-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${projeto.progress || 0}%"></div>
          </div>
          <span class="progress-text">${projeto.progress || 0}%</span>
        </div>
      </div>
      
      <div class="tooltip-content">
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-building"></i> Cliente:
          </span>
          <span class="tooltip-value">${projeto.client || 'N/A'}</span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-users"></i> Equipes:
          </span>
          <span class="tooltip-value">
            ${projeto.groups?.join(', ') || 'N/A'}
          </span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-calendar"></i> Período:
          </span>
          <span class="tooltip-value">
            ${moment(projeto.start).format('DD/MM/YY')} → 
            ${moment(projeto.end).format('DD/MM/YY')}
          </span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-tasks"></i> Status:
          </span>
          <span class="tooltip-value status-${getStatusClass(projeto.status)}">
            ${projeto.status || 'N/A'}
          </span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-flag"></i> Prioridade:
          </span>
          <span class="tooltip-value priority-${projeto.priority?.toLowerCase() || 'medium'}">
            ${getPriorityIcon(projeto.priority)} ${getPriorityText(projeto.priority)}
          </span>
        </div>
        
        <div class="tooltip-row">
          <span class="tooltip-label">
            <i class="fas fa-list"></i> Tarefas:
          </span>
          <span class="tooltip-value">${projeto.tasks?.length || 0} tarefas</span>
        </div>
      </div>
      
      <div class="tooltip-footer">
        <div class="tooltip-responsibles">
          <i class="fas fa-user-friends"></i>
          ${projeto.responsibles?.slice(0, 3).join(', ') || 'Sem responsáveis'}
          ${projeto.responsibles?.length > 3 ? ` +${projeto.responsibles.length - 3} mais` : ''}
        </div>
      </div>
    </div>
  `,

  /**
   * Template simples para tooltips de botões/controles
   * @param {string} text - Texto do tooltip
   * @param {string} subtitle - Subtítulo opcional
   * @returns {string} HTML do tooltip
   */
  simple: (text, subtitle) => `
    <div class="modern-tooltip simple-tooltip">
      <div class="tooltip-text">${text}</div>
      ${subtitle ? `<div class="tooltip-subtitle">${subtitle}</div>` : ''}
    </div>
  `
};

/**
 * Funções auxiliares para formatação
 */
function getPriorityIcon(priority) {
  const icons = {
    high: '<i class="fas fa-exclamation-triangle"></i>',
    medium: '<i class="fas fa-minus-circle"></i>',
    low: '<i class="fas fa-arrow-down"></i>'
  };
  return icons[priority?.toLowerCase()] || icons.medium;
}

function getPriorityText(priority) {
  const texts = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  };
  return texts[priority?.toLowerCase()] || 'Média';
}

function getStatusClass(status) {
  const statusMap = {
    'Concluída': 'completed',
    'Concluído': 'completed',
    'Em Produção': 'in-progress',
    'Em andamento': 'in-progress',
    'Atrasado': 'delayed',
    'Não iniciada': 'not-started',
    'Backlog': 'backlog'
  };
  return statusMap[status] || 'default';
}

/**
 * Cria CSS customizado para tooltips modernos
 */
function injectTooltipStyles() {
  if (document.querySelector('#modern-tooltip-styles')) return;

  const styles = `
    <style id="modern-tooltip-styles">
      /* ========================================
         TIPPY.JS THEME CUSTOMIZADO - SUNO
      ======================================== */
      
      .tippy-box[data-theme~='suno-modern'] {
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        padding: 0;
        overflow: hidden;
      }
      
      .tippy-box[data-theme~='suno-modern'][data-placement^='top'] > .tippy-arrow::before {
        border-top-color: rgba(15, 23, 42, 0.95);
      }
      
      .tippy-box[data-theme~='suno-modern'][data-placement^='bottom'] > .tippy-arrow::before {
        border-bottom-color: rgba(15, 23, 42, 0.95);
      }
      
      .tippy-box[data-theme~='suno-modern'][data-placement^='left'] > .tippy-arrow::before {
        border-left-color: rgba(15, 23, 42, 0.95);
      }
      
      .tippy-box[data-theme~='suno-modern'][data-placement^='right'] > .tippy-arrow::before {
        border-right-color: rgba(15, 23, 42, 0.95);
      }
      
      /* ========================================
         TOOLTIP COMPONENTS
      ======================================== */
      
      .modern-tooltip {
        color: #ffffff;
        font-size: 0.875rem;
        line-height: 1.5;
        max-width: 400px;
      }
      
      .tooltip-header {
        padding: 16px 20px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, rgba(255, 200, 1, 0.1), rgba(255, 200, 1, 0.05));
      }
      
      .tooltip-title {
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 8px;
        line-height: 1.4;
      }
      
      .tooltip-priority {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        width: fit-content;
      }
      
      .tooltip-priority.priority-high {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
        color: #fca5a5;
      }
      
      .tooltip-priority.priority-medium {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2));
        color: #fcd34d;
      }
      
      .tooltip-priority.priority-low {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
        color: #86efac;
      }
      
      .tooltip-content {
        padding: 16px 20px;
      }
      
      .tooltip-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 10px;
        font-size: 0.875rem;
      }
      
      .tooltip-row:last-child {
        margin-bottom: 0;
      }
      
      .tooltip-label {
        color: #94a3b8;
        font-weight: 500;
        min-width: 80px;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      
      .tooltip-label i {
        width: 14px;
        color: #ffc801;
      }
      
      .tooltip-value {
        color: #e2e8f0;
        font-weight: 400;
        flex: 1;
        word-break: break-word;
      }
      
      .tooltip-value.subtask {
        color: #94a3b8;
        font-style: italic;
      }
      
      .tooltip-value.task {
        color: #e2e8f0;
        font-weight: 500;
      }
      
      /* Status Colors */
      .tooltip-value.status-completed {
        color: #86efac;
        font-weight: 500;
      }
      
      .tooltip-value.status-in-progress {
        color: #7dd3fc;
        font-weight: 500;
      }
      
      .tooltip-value.status-delayed {
        color: #fca5a5;
        font-weight: 500;
      }
      
      .tooltip-value.status-not-started {
        color: #cbd5e1;
      }
      
      .tooltip-value.status-backlog {
        color: #c4b5fd;
      }
      
      .tooltip-footer {
        padding: 12px 20px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
      }
      
      .tooltip-project {
        color: #94a3b8;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .tooltip-project i {
        color: #ffc801;
      }
      
      .tooltip-responsibles {
        color: #94a3b8;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .tooltip-responsibles i {
        color: #ffc801;
      }
      
      /* Progress Bar */
      .tooltip-progress {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
      }
      
      .progress-bar {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ffc801, #ffd84d);
        transition: width 0.3s ease;
        border-radius: 3px;
      }
      
      .progress-text {
        font-size: 0.8rem;
        font-weight: 600;
        color: #ffc801;
        min-width: 35px;
        text-align: right;
      }
      
      /* Simple Tooltip */
      .simple-tooltip {
        padding: 12px 16px;
        text-align: center;
      }
      
      .tooltip-text {
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 4px;
      }
      
      .tooltip-subtitle {
        font-size: 0.8rem;
        color: #94a3b8;
      }
      
      /* ========================================
         ANIMATIONS
      ======================================== */
      
      .tippy-box[data-theme~='suno-modern'] {
        transition-property: transform, visibility, opacity;
      }
      
      .tippy-box[data-theme~='suno-modern'][data-state='hidden'] {
        opacity: 0;
        transform: scale(0.96) translateY(-4px);
      }
      
      .tippy-box[data-theme~='suno-modern'][data-state='visible'] {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      
      /* Hover Effects */
      .modern-tooltip:hover .progress-fill {
        background: linear-gradient(90deg, #ffd84d, #ffc801);
      }
      
      .tooltip-row:hover .tooltip-label i {
        transform: scale(1.1);
        transition: transform 0.2s ease;
      }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

/**
 * Cria um tooltip moderno para um elemento
 * @param {HTMLElement} element - Elemento que receberá o tooltip
 * @param {Object|string} content - Conteúdo do tooltip (objeto para templates ou string)
 * @param {Object} options - Opções adicionais do tooltip
 * @returns {Object} Instância do tooltip
 */
export function createModernTooltip(element, content, options = {}) {
  if (!tippy) {
    console.warn('Tippy.js não está disponível. Usando tooltip simples.');
    return createFallbackTooltip(element, content);
  }

  // Garantir que os estilos estejam injetados
  injectTooltipStyles();

  // Configurar conteúdo baseado no tipo
  let htmlContent;
  
  if (typeof content === 'string') {
    htmlContent = tooltipTemplates.simple(content);
  } else if (content.type === 'task') {
    htmlContent = tooltipTemplates.task(content.data);
  } else if (content.type === 'project') {
    htmlContent = tooltipTemplates.project(content.data);
  } else {
    htmlContent = content.html || String(content);
  }

  // Mesclar configurações
  const config = {
    ...defaultTooltipConfig,
    ...options,
    content: htmlContent
  };

  return tippy(element, config);
}

/**
 * Cria tooltip para itens da timeline (integração com timelineService)
 * @param {HTMLElement} element - Elemento da timeline
 * @param {Object} itemData - Dados do item
 * @param {string} type - Tipo do item ('task' ou 'project')
 * @returns {Object} Instância do tooltip
 */
export function createTimelineTooltip(element, itemData, type = 'task') {
  return createModernTooltip(element, {
    type: type,
    data: itemData
  }, {
    placement: 'top',
    offset: [0, 15],
    delay: [500, 200],
    duration: [300, 200]
  });
}

/**
 * Cria tooltip simples para botões e controles
 * @param {HTMLElement} element - Elemento
 * @param {string} text - Texto principal
 * @param {string} subtitle - Subtítulo opcional
 * @returns {Object} Instância do tooltip
 */
export function createSimpleTooltip(element, text, subtitle = null) {
  return createModernTooltip(element, tooltipTemplates.simple(text, subtitle), {
    placement: 'bottom',
    delay: [800, 100],
    duration: [200, 150]
  });
}

/**
 * Tooltip de fallback para quando Tippy.js não está disponível
 * @param {HTMLElement} element - Elemento
 * @param {string} content - Conteúdo
 * @returns {Object} Objeto com métodos básicos
 */
function createFallbackTooltip(element, content) {
  const textContent = typeof content === 'string' ? content : 
                     content.data?.name || 'Tooltip';
  
  element.title = textContent;
  
  return {
    destroy: () => { element.removeAttribute('title'); },
    enable: () => { element.title = textContent; },
    disable: () => { element.removeAttribute('title'); },
    show: () => {},
    hide: () => {}
  };
}

/**
 * Inicializa tooltips automáticos para elementos com data-tooltip
 */
export function initAutoTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(element => {
    const text = element.getAttribute('data-tooltip');
    const subtitle = element.getAttribute('data-tooltip-subtitle');
    createSimpleTooltip(element, text, subtitle);
  });
}

/**
 * Destrói todos os tooltips de um container
 * @param {HTMLElement} container - Container
 */
export function destroyTooltips(container) {
  if (!tippy) return;
  
  const elements = container.querySelectorAll('[data-tippy-root]');
  elements.forEach(element => {
    if (element._tippy) {
      element._tippy.destroy();
    }
  });
}

// Inicializar automaticamente tooltips quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAutoTooltips);
} else {
  initAutoTooltips();
}