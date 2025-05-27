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

    // Inicializa controles de zoom e aplica zoom inicial DEPOIS de carregar módulos
    inicializarControleZoomSite(); 
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
  
  // Atualizar o ano no rodapé (comum a todas as páginas)
  const anoElement = document.getElementById("ano-atual");
  if (anoElement) {
    anoElement.textContent = new Date().getFullYear();
  }
}

// --- Bloco de Controle de Zoom do Site ---

let siteZoomLevel = 0.75; // valor padrão inicial (75%)

/**
 * Atualiza a largura e a escala do #main-content com base no zoom.
 */
function atualizarZoomSite() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    const viewportWidthPx = document.documentElement.clientWidth;
    // Calcula a largura necessária para que, após o scale, ocupe 100% da viewport
    const newWidthPx = viewportWidthPx / siteZoomLevel;
    
    mainContent.style.width = `${newWidthPx}px`;
    mainContent.style.transform = `scale(${siteZoomLevel})`;
    mainContent.style.transformOrigin = "top left"; // Mudar para top left para evitar deslocamento central
    console.log(`Zoom aplicado: ${siteZoomLevel}, Largura calculada: ${newWidthPx}px`);
  }
}

/**
 * Altera o nível de zoom e atualiza a visualização.
 * @param {string} acao - 'aumentar' ou 'diminuir'.
 */
function alterarZoomSite(acao) {
  if (acao === 'aumentar') {
    siteZoomLevel = Math.min(siteZoomLevel + 0.1, 2.0);
  } else if (acao === 'diminuir') {
    siteZoomLevel = Math.max(siteZoomLevel - 0.1, 0.5);
  }
  // Arredonda para evitar problemas de precisão float
  siteZoomLevel = Math.round(siteZoomLevel * 100) / 100;
  atualizarZoomSite();
}

/**
 * Inicializa os botões de controle de zoom do site e aplica o zoom inicial.
 */
function inicializarControleZoomSite() {
  const btnZoomIn = document.getElementById('btn-zoom-in-header');
  const btnZoomOut = document.getElementById('btn-zoom-out-header');

  btnZoomIn?.addEventListener('click', () => alterarZoomSite('aumentar'));
  btnZoomOut?.addEventListener('click', () => alterarZoomSite('diminuir'));

  // Aplica o zoom inicial após um pequeno delay para garantir que o layout esteja pronto
  // Isso pode ajudar se clientWidth não estiver correto imediatamente no DOMContentLoaded
  setTimeout(() => {
      atualizarZoomSite();
      // Adiciona um listener para resize para recalcular em caso de mudança da janela
      window.addEventListener('resize', atualizarZoomSite);
  }, 100); 

  console.log("Controles de zoom do site inicializados.");
}

// --- Fim do Bloco de Controle de Zoom do Site ---

// // Função legada de zoom de fonte (se existir, manter comentada ou remover se não usada)
// function ajustarZoomFonte(acao) { ... }
// function inicializarControleZoomFonte() { ... }

