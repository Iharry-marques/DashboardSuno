/**
 * @file index.js
 * @description Arquivo principal de inicialização do Dashboard de Tarefas
 * @project Dashboard de Tarefas - SUNO
 */

// Detectar a página atual e carregar os scripts apropriados
document.addEventListener("DOMContentLoaded", () => {
  // Identificar qual página está sendo carregada
  const currentPath = window.location.pathname;
  const pageName = currentPath.split('/').pop();
  
  console.log(`Carregando scripts para: ${pageName}`);
  
  // Verificar se dados.json está acessível
  fetch('dados.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar dados.json: ${response.status}`);
      }
      console.log('dados.json está acessível');
      
      // Após confirmar que dados.json está acessível, carregar os módulos específicos
      carregarModuloEspecifico(pageName);

      // Inicializar o modo de interface (Compacto/Confortável)
      // inicializarModoInterface(); // Comentado temporariamente se houver
    })
    .catch(error => {
      console.error('Erro ao verificar dados.json:', error);
      const container = document.querySelector('#timeline') || document.querySelector('#kanban-container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger m-3">
            <h5>Erro ao carregar dados</h5>
            <p>${error.message}</p>
            <p>Verifique se o arquivo dados.json está disponível e formatado corretamente.</p>
          </div>`;
      }
    });

    // Inicializa controles de zoom (agora baseado em fonte)
    inicializarControleZoomFonte(); 
    
    // Atualizar o ano no rodapé (comum a todas as páginas)
    atualizarAnoRodape();
});

/**
 * Carrega o módulo específico para a página atual
 * @param {string} pageName - Nome da página atual
 */
function carregarModuloEspecifico(pageName) {
  try {
    if (pageName === 'index.html' || pageName === '') {
      const script = document.createElement('script');
      script.src = 'js/views/dashboardView.js';
      script.type = 'module';
      document.body.appendChild(script);
    } 
    else if (pageName === 'clientes.html') {
      const script = document.createElement('script');
      script.src = 'js/views/clientsView.js';
      script.type = 'module';
      document.body.appendChild(script);
    } 
    else if (pageName === 'kanban.html') {
      const script = document.createElement('script');
      script.src = 'js/views/kanbanView.js';
      script.type = 'module';
      document.body.appendChild(script);
    }
  } catch (error) {
    console.error('Erro ao carregar módulo:', error);
  }
}

// --- Bloco de Controle de Zoom do Site (baseado em fonte) ---

/**
 * Ajusta o zoom da fonte do site
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
function inicializarControleZoomFonte() {
  const btnZoomIn = document.getElementById('btn-zoom-in-header');
  const btnZoomOut = document.getElementById('btn-zoom-out-header');

  // Restaurar zoom salvo (se existir)
  const tamanhoSalvo = localStorage.getItem('siteFontSize');
  if (tamanhoSalvo) {
    document.documentElement.style.fontSize = `${tamanhoSalvo}px`;
  }

  btnZoomIn?.addEventListener('click', () => ajustarZoomFonte('aumentar'));
  btnZoomOut?.addEventListener('click', () => ajustarZoomFonte('diminuir'));

  console.log("Controles de zoom do site (fonte) inicializados.");
}

/**
 * Atualiza o ano no rodapé (comum a todas as páginas)
 */
function atualizarAnoRodape() {
  const anoElement = document.getElementById("ano-atual");
  if (anoElement) {
    anoElement.textContent = new Date().getFullYear();
  }
}

// Função legada de zoom (removida)
// function ajustarZoomSite(acao) { ... }
// function alterarZoomSite(acao) { ... }
// function inicializarControleZoomSite() { ... }