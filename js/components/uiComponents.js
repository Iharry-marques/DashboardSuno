/**
 * @file uiComponents.js - VERSÃO ATUALIZADA
 * @description Componentes de UI reutilizáveis para o Dashboard de Tarefas
 * @project Dashboard de Tarefas - SUNO
 */

/**
 * Obtém um elemento pelo ID
 * @param {string} id - ID do elemento
 * @returns {HTMLElement} Elemento encontrado ou null
 */
export const getEl = (id) => document.getElementById(id);

/**
 * Exibe ou oculta indicador de carregamento
 * @param {HTMLElement} container - Elemento HTML onde mostrar o loading
 * @param {boolean} mostrar - Se true, mostra o loading; se false, limpa o container
 */
export function mostrarLoading(container, mostrar) {
  if (!container) return;

  if (mostrar) {
    container.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="mt-3">Carregando dados...</p>
      </div>
    `;
  } else {
    // Remove apenas o loading-container, mas mantém o conteúdo do Gantt
    const loading = container.querySelector('.loading-container');
    if (loading) {
      loading.remove();
    }
  }
}

/**
 * Exibe uma notificação toast
 * @param {string} titulo - Título da notificação
 * @param {string} mensagem - Texto da mensagem
 * @param {string} tipo - Tipo da notificação: "info", "success", "warning" ou "error"
 */
export function mostrarNotificacao(titulo, mensagem, tipo = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.style.zIndex = "1050";
    document.body.appendChild(container);
  }

  const toastId = `toast-${Date.now()}`;
  const html = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header ${tipo === "error" ? "bg-danger text-white" :
        tipo === "success" ? "bg-success text-white" :
        tipo === "warning" ? "bg-warning" :
        "bg-info text-white"}">
        <strong class="me-auto">${titulo}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">${mensagem}</div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", html);
  const toastElement = document.getElementById(toastId);
  new bootstrap.Toast(toastElement, { delay: 5000 }).show();

  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}

/**
 * Atualiza o ano atual no rodapé
 */
export function atualizarAnoRodape() {
  const anoElement = getEl("ano-atual");
  if (anoElement) {
    anoElement.textContent = new Date().getFullYear();
  }
}