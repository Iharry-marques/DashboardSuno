/**
 * @file uiComponents.js
 * @description Componentes de UI reutilizáveis. A função de notificação antiga foi removida.
 * @project Dashboard de Tarefas - SUNO
 */

/**
 * Exibe ou oculta indicador de carregamento.
 * @param {HTMLElement} container - Elemento HTML onde mostrar o loading.
 * @param {boolean} mostrar - Se true, mostra o loading; se false, limpa o container.
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
    const loading = container.querySelector('.loading-container');
    if (loading) {
      loading.remove();
    }
  }
}

/**
 * Cria um modal dinâmico.
 * @param {string} titulo - Título do modal.
 * @param {string} conteudo - Conteúdo HTML do corpo do modal.
 * @param {Function} onClose - Callback opcional ao fechar o modal.
 * @returns {HTMLElement} Elemento do modal criado.
 */
export function criarModal(titulo, conteudo, onClose = null) {
  const modal = document.createElement('div');
  modal.className = 'modal fade show';
  modal.style.cssText = 'display: block; background-color: rgba(0,0,0,0.5);';
  
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${titulo}</h5>
          <button type="button" class="btn-close" data-action="fechar"></button>
        </div>
        <div class="modal-body">${conteudo}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="fechar">Fechar</button>
        </div>
      </div>
    </div>`;
  
  document.body.appendChild(modal);
  
  const fecharModal = () => {
    modal.remove();
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };
  
  modal.querySelectorAll('[data-action="fechar"]').forEach(btn => {
    btn.addEventListener('click', fecharModal);
  });
  
  return modal;
}
