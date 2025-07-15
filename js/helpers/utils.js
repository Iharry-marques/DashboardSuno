/**
 * @file utils.js
 * @description Funções utilitárias e helpers reutilizáveis para o projeto.
 * @project Dashboard de Tarefas - SUNO
 */

// --- DOM Helpers ---

/**
 * Obtém um elemento pelo ID.
 * @param {string} id - ID do elemento.
 * @returns {HTMLElement} Elemento encontrado ou null.
 */
export const getEl = (id) => document.getElementById(id);

/**
 * Atualiza o ano atual no rodapé.
 */
export function atualizarAnoRodape() {
  const anoElement = getEl("ano-atual");
  if (anoElement) {
    anoElement.textContent = new Date().getFullYear();
  }
}

// --- Event Helpers ---

/**
 * Utilitário de debounce para otimizar performance.
 * @param {Function} func - Função a ser debounced.
 * @param {number} wait - Tempo de espera em ms.
 * @returns {Function} Função debounced.
 */
export function debounce(func, wait) {
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

// --- UI Feedback & Tooltips ---

/**
 * Mostra feedback visual em botões.
 * @param {HTMLElement} button - Botão.
 * @param {string} text - Texto do feedback.
 */
export function showFeedback(button, text) {
  if (!button) return;

  button.classList.add('btn-feedback');

  const feedback = document.createElement('div');
  feedback.className = 'btn-feedback-text';
  feedback.textContent = text;
  feedback.style.cssText = `
    position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.8); color: white; padding: 4px 8px;
    border-radius: 4px; font-size: 12px; white-space: nowrap;
    z-index: 1000; animation: fadeInUp 0.3s ease;
  `;
  
  button.style.position = 'relative';
  button.appendChild(feedback);

  setTimeout(() => {
    button.classList.remove('btn-feedback');
    feedback.remove();
  }, 1000);
}

/**
 * Cria um tooltip simples com Tippy.js.
 * @param {HTMLElement} element - Elemento alvo.
 * @param {string} text - Texto principal do tooltip.
 * @param {string|null} subtitle - Subtítulo opcional.
 */
function createSimpleTooltip(element, text, subtitle = null) {
  if (!window.tippy) return;
  const content = subtitle ? `<strong>${text}</strong><br><small>${subtitle}</small>` : text;
  window.tippy(element, {
    content, allowHTML: true, theme: 'suno', animation: 'scale-subtle', duration: [200, 150]
  });
}

/**
 * Inicializa tooltips automaticamente em elementos com o atributo 'data-tooltip'.
 * @param {Document|HTMLElement} root - Elemento raiz para procurar os alvos.
 */
export function initAutoTooltips(root = document) {
  root.querySelectorAll('[data-tooltip]').forEach(el => {
    if (!el._tippy) createSimpleTooltip(el, el.dataset.tooltip);
  });
}

/**
 * Destrói instâncias do Tippy.js em um container.
 * @param {Document|HTMLElement} container - Container para limpar os tooltips.
 */
export function destroyTooltips(container = document) {
  container.querySelectorAll('[data-tippy-root]').forEach(p => p._tippy?.destroy());
}


// --- Controle de Zoom Global (Fonte) ---

/**
 * Ajusta o tamanho da fonte do site (zoom).
 * @param {string} acao - 'aumentar' ou 'diminuir'.
 */
function ajustarZoomFonte(acao) {
  const html = document.documentElement;
  const tamanhoAtual = parseFloat(getComputedStyle(html).fontSize);
  let novoZoom = tamanhoAtual;

  if (acao === 'aumentar') {
    novoZoom = Math.min(tamanhoAtual * 1.1, 20); // 20px é o máximo
  } else if (acao === 'diminuir') {
    novoZoom = Math.max(tamanhoAtual * 0.9, 10); // 10px é o mínimo
  }

  html.style.fontSize = `${novoZoom}px`;
  localStorage.setItem('siteFontSize', novoZoom);
}

/**
 * Inicializa os botões de controle de zoom do site e aplica o zoom salvo.
 */
export function inicializarControleZoomFonte() {
  const btnZoomIn = getEl('btn-zoom-in-header');
  const btnZoomOut = getEl('btn-zoom-out-header');

  const tamanhoSalvo = localStorage.getItem('siteFontSize');
  if (tamanhoSalvo) {
    document.documentElement.style.fontSize = `${tamanhoSalvo}px`;
  }

  btnZoomIn?.addEventListener('click', () => ajustarZoomFonte('aumentar'));
  btnZoomOut?.addEventListener('click', () => ajustarZoomFonte('diminuir'));

  console.log("Controles de zoom do site (fonte) inicializados.");
}