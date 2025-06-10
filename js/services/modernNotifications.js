/**
 * @file modernNotifications.js
 * @description Sistema moderno de notificações usando SweetAlert2 e toasts customizados
 * @project Dashboard de Tarefas - SUNO
 */

// Verificar se SweetAlert2 está disponível
const Swal = window.Swal;

/**
 * Configurações padrão para SweetAlert2
 */
const defaultSwalConfig = {
  customClass: {
    container: 'suno-swal-container',
    popup: 'suno-swal-popup',
    header: 'suno-swal-header',
    title: 'suno-swal-title',
    closeButton: 'suno-swal-close',
    icon: 'suno-swal-icon',
    content: 'suno-swal-content',
    actions: 'suno-swal-actions',
    confirmButton: 'suno-swal-confirm',
    cancelButton: 'suno-swal-cancel'
  },
  buttonsStyling: false,
  backdrop: 'rgba(15, 23, 42, 0.8)',
  allowOutsideClick: true,
  allowEscapeKey: true,
  showClass: {
    popup: 'animate__animated animate__fadeInUp animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown animate__faster'
  }
};

/**
 * Injeta estilos CSS customizados para SweetAlert2
 */
function injectSwalStyles() {
  if (document.querySelector('#suno-swal-styles')) return;

  const styles = `
    <style id="suno-swal-styles">
      /* ========================================
         SWEETALERT2 THEME - SUNO
      ======================================== */
      
      .suno-swal-container {
        z-index: 10000;
      }
      
      .suno-swal-popup {
        background: rgba(255, 255, 255, 0.95) !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 24px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        padding: 2rem !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        width: auto !important;
        max-width: 500px !important;
        position: relative;
        overflow: hidden;
      }
      
      .suno-swal-popup::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #ffc801, #ffd84d);
        opacity: 0.8;
      }
      
      .suno-swal-header {
        margin-bottom: 1.5rem !important;
      }
      
      .suno-swal-title {
        color: #0f172a !important;
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        margin: 0 !important;
        line-height: 1.4 !important;
      }
      
      .suno-swal-icon {
        margin: 0 auto 1rem !important;
        border: none !important;
        width: 60px !important;
        height: 60px !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 24px !important;
      }
      
      .suno-swal-icon.swal2-success {
        background: linear-gradient(135deg, #10b981, #059669) !important;
        color: white !important;
      }
      
      .suno-swal-icon.swal2-error {
        background: linear-gradient(135deg, #ef4444, #dc2626) !important;
        color: white !important;
      }
      
      .suno-swal-icon.swal2-warning {
        background: linear-gradient(135deg, #f59e0b, #d97706) !important;
        color: white !important;
      }
      
      .suno-swal-icon.swal2-info {
        background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
        color: white !important;
      }
      
      .suno-swal-icon.swal2-question {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
        color: white !important;
      }
      
      .suno-swal-content {
        color: #475569 !important;
        font-size: 1rem !important;
        line-height: 1.6 !important;
        margin: 0 !important;
      }
      
      .suno-swal-actions {
        margin-top: 2rem !important;
        gap: 1rem !important;
        justify-content: center !important;
      }
      
      .suno-swal-confirm {
        background: linear-gradient(135deg, #ffc801, #ffd84d) !important;
        color: #0f172a !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 0.75rem 2rem !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }
      
      .suno-swal-confirm:hover {
        background: linear-gradient(135deg, #ffd84d, #ffc801) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
      }
      
      .suno-swal-cancel {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #6b7280 !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        border-radius: 12px !important;
        padding: 0.75rem 2rem !important;
        font-weight: 500 !important;
        font-size: 0.9rem !important;
        transition: all 0.2s ease !important;
        backdrop-filter: blur(10px) !important;
      }
      
      .suno-swal-cancel:hover {
        background: rgba(0, 0, 0, 0.05) !important;
        border-color: rgba(0, 0, 0, 0.2) !important;
        transform: translateY(-1px) !important;
      }
      
      .suno-swal-close {
        color: #6b7280 !important;
        font-size: 1.5rem !important;
        transition: all 0.2s ease !important;
        top: 1rem !important;
        right: 1rem !important;
      }
      
      .suno-swal-close:hover {
        color: #374151 !important;
        transform: scale(1.1) !important;
      }
      
      /* Animações customizadas */
      @keyframes sunoFadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes sunoFadeOutDown {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .suno-swal-popup {
          background: rgba(30, 41, 59, 0.95) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        .suno-swal-title {
          color: #f1f5f9 !important;
        }
        
        .suno-swal-content {
          color: #cbd5e1 !important;
        }
        
        .suno-swal-cancel {
          background: rgba(0, 0, 0, 0.2) !important;
          color: #e2e8f0 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
      }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

/**
 * Cria estilos para toasts modernos
 */
function injectToastStyles() {
  if (document.querySelector('#suno-toast-styles')) return;

  const styles = `
    <style id="suno-toast-styles">
      /* ========================================
         MODERN TOAST SYSTEM
      ======================================== */
      
      .suno-toast-container {
        position: fixed;
        top: 2rem;
        right: 2rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 400px;
        pointer-events: none;
      }
      
      .suno-toast {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        position: relative;
        overflow: hidden;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .suno-toast.show {
        transform: translateX(0);
        opacity: 1;
      }
      
      .suno-toast::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: #6b7280;
      }
      
      .suno-toast.success::before { background: linear-gradient(to bottom, #10b981, #059669); }
      .suno-toast.error::before { background: linear-gradient(to bottom, #ef4444, #dc2626); }
      .suno-toast.warning::before { background: linear-gradient(to bottom, #f59e0b, #d97706); }
      .suno-toast.info::before { background: linear-gradient(to bottom, #3b82f6, #2563eb); }
      
      .suno-toast-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }
      
      .suno-toast-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: #0f172a;
        font-size: 1rem;
      }
      
      .suno-toast-icon {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
      }
      
      .suno-toast.success .suno-toast-icon { background: #10b981; }
      .suno-toast.error .suno-toast-icon { background: #ef4444; }
      .suno-toast.warning .suno-toast-icon { background: #f59e0b; }
      .suno-toast.info .suno-toast-icon { background: #3b82f6; }
      
      .suno-toast-close {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        font-size: 1.25rem;
        line-height: 1;
        transition: color 0.2s ease;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .suno-toast-close:hover {
        color: #374151;
        background: rgba(0, 0, 0, 0.05);
      }
      
      .suno-toast-body {
        color: #475569;
        line-height: 1.5;
        font-size: 0.9rem;
      }
      
      .suno-toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #ffc801, #ffd84d);
        transition: width linear;
        border-radius: 0 0 16px 16px;
      }
      
      /* Responsive */
      @media (max-width: 640px) {
        .suno-toast-container {
          top: 1rem;
          right: 1rem;
          left: 1rem;
          max-width: none;
        }
        
        .suno-toast {
          transform: translateY(-100px);
        }
        
        .suno-toast.show {
          transform: translateY(0);
        }
      }
      
      /* Dark mode */
      @media (prefers-color-scheme: dark) {
        .suno-toast {
          background: rgba(30, 41, 59, 0.95);
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .suno-toast-title {
          color: #f1f5f9;
        }
        
        .suno-toast-body {
          color: #cbd5e1;
        }
        
        .suno-toast-close {
          color: #94a3b8;
        }
        
        .suno-toast-close:hover {
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.1);
        }
      }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

/**
 * Inicializa o container de toasts
 */
function initToastContainer() {
  let container = document.querySelector('.suno-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'suno-toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Cria um toast moderno
 * @param {string} title - Título do toast
 * @param {string} message - Mensagem do toast
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duração em ms (0 = não auto-remove)
 * @returns {HTMLElement} Elemento do toast
 */
export function showToast(title, message, type = 'info', duration = 5000) {
  injectToastStyles();
  const container = initToastContainer();
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const toast = document.createElement('div');
  toast.className = `suno-toast ${type}`;
  
  toast.innerHTML = `
    <div class="suno-toast-header">
      <div class="suno-toast-title">
        <div class="suno-toast-icon">${icons[type] || icons.info}</div>
        ${title}
      </div>
      <button class="suno-toast-close" aria-label="Fechar">×</button>
    </div>
    <div class="suno-toast-body">${message}</div>
    ${duration > 0 ? '<div class="suno-toast-progress"></div>' : ''}
  `;
  
  // Event listeners
  const closeBtn = toast.querySelector('.suno-toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));
  
  // Adicionar ao container
  container.appendChild(toast);
  
  // Animar entrada
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // Progress bar e auto-remove
  if (duration > 0) {
    const progressBar = toast.querySelector('.suno-toast-progress');
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.style.transitionDuration = `${duration}ms`;
      
      requestAnimationFrame(() => {
        progressBar.style.width = '0%';
      });
    }
    
    setTimeout(() => removeToast(toast), duration);
  }
  
  return toast;
}

/**
 * Remove um toast com animação
 * @param {HTMLElement} toast - Elemento do toast
 */
function removeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Exibe alerta de sucesso
 * @param {string} title - Título
 * @param {string} message - Mensagem
 * @param {Object} options - Opções adicionais
 */
export function showSuccess(title, message, options = {}) {
  if (Swal) {
    injectSwalStyles();
    return Swal.fire({
      ...defaultSwalConfig,
      icon: 'success',
      title: title,
      text: message,
      confirmButtonText: 'OK',
      timer: options.timer || undefined,
      timerProgressBar: !!options.timer,
      ...options
    });
  } else {
    return showToast(title, message, 'success', options.duration);
  }
}

/**
 * Exibe alerta de erro
 * @param {string} title - Título
 * @param {string} message - Mensagem
 * @param {Object} options - Opções adicionais
 */
export function showError(title, message, options = {}) {
  if (Swal) {
    injectSwalStyles();
    return Swal.fire({
      ...defaultSwalConfig,
      icon: 'error',
      title: title,
      text: message,
      confirmButtonText: 'OK',
      ...options
    });
  } else {
    return showToast(title, message, 'error', options.duration || 0);
  }
}

/**
 * Exibe alerta de aviso
 * @param {string} title - Título
 * @param {string} message - Mensagem
 * @param {Object} options - Opções adicionais
 */
export function showWarning(title, message, options = {}) {
  if (Swal) {
    injectSwalStyles();
    return Swal.fire({
      ...defaultSwalConfig,
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonText: 'OK',
      ...options
    });
  } else {
    return showToast(title, message, 'warning', options.duration);
  }
}

/**
 * Exibe alerta de informação
 * @param {string} title - Título
 * @param {string} message - Mensagem
 * @param {Object} options - Opções adicionais
 */
export function showInfo(title, message, options = {}) {
  if (Swal) {
    injectSwalStyles();
    return Swal.fire({
      ...defaultSwalConfig,
      icon: 'info',
      title: title,
      text: message,
      confirmButtonText: 'OK',
      ...options
    });
  } else {
    return showToast(title, message, 'info', options.duration);
  }
}

/**
 * Exibe diálogo de confirmação
 * @param {string} title - Título
 * @param {string} message - Mensagem
 * @param {Object} options - Opções adicionais
 * @returns {Promise<boolean>} True se confirmado
 */
export function showConfirm(title, message, options = {}) {
  if (Swal) {
    injectSwalStyles();
    return Swal.fire({
      ...defaultSwalConfig,
      icon: 'question',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: options.confirmText || 'Confirmar',
      cancelButtonText: options.cancelText || 'Cancelar',
      reverseButtons: true,
      ...options
    }).then(result => result.isConfirmed);
  } else {
    // Fallback para confirm nativo
    return Promise.resolve(confirm(`${title}\n\n${message}`));
  }
}

/**
 * Exibe loading
 * @param {string} title - Título
 * @param {string} message - Mensagem
 */
export function showLoading(title = 'Carregando...', message = 'Aguarde um momento') {
  if (Swal) {
    injectSwalStyles();
    return Swal.fire({
      ...defaultSwalConfig,
      title: title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  } else {
    return showToast(title, message, 'info', 0);
  }
}

/**
 * Fecha loading
 */
export function hideLoading() {
  if (Swal) {
    Swal.close();
  }
}

/**
 * Remove todos os toasts
 */
export function clearAllToasts() {
  const container = document.querySelector('.suno-toast-container');
  if (container) {
    const toasts = container.querySelectorAll('.suno-toast');
    toasts.forEach(removeToast);
  }
}

/**
 * Função de compatibilidade com o sistema antigo
 * @param {string} titulo - Título
 * @param {string} mensagem - Mensagem
 * @param {string} tipo - Tipo
 */
export function mostrarNotificacao(titulo, mensagem, tipo = 'info') {
  const typeMap = {
    'error': 'error',
    'danger': 'error',
    'success': 'success',
    'warning': 'warning',
    'info': 'info'
  };
  
  const mappedType = typeMap[tipo] || 'info';
  return showToast(titulo, mensagem, mappedType);
}

// Exportar também as funções como default para compatibilidade
export default {
  showToast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm,
  showLoading,
  hideLoading,
  clearAllToasts,
  mostrarNotificacao
};