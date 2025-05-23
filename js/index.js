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
      inicializarModoInterface();
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
});

/**
 * Carrega o módulo específico para a página atual
 * @param {string} pageName - Nome da página atual
 */
function carregarModuloEspecifico(pageName) {
  try {
    if (pageName === 'index.html' || pageName === '') {
      // Dashboard principal por equipe - carregamento síncrono
      const script = document.createElement('script');
      script.src = 'js/views/dashboardView.js';
      script.type = 'module';
      document.body.appendChild(script);
    } 
    else if (pageName === 'clientes.html') {
      // Dashboard por cliente - carregamento síncrono
      const script = document.createElement('script');
      script.src = 'js/views/clientsView.js';
      script.type = 'module';
      document.body.appendChild(script);
    } 
    else if (pageName === 'kanban.html') {
      // Visualização Kanban - carregamento síncrono
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



// --- Bloco de Controle de Modo de Interface (Compacto/Confortável) ---

/**
 * Aplica o modo de visualização (compacto ou confortável) e salva a preferência.
 * @param {string} modo - O modo a ser aplicado ('compacto' ou 'confortavel').
 */
function aplicarModo(modo) {
  const htmlElement = document.documentElement;
  const btnCompacto = document.getElementById('btn-modo-compacto');
  const btnConfortavel = document.getElementById('btn-modo-confortavel');

  if (modo === 'confortavel') {
    htmlElement.classList.add('modo-confortavel');
    htmlElement.style.fontSize = '12px'; // Modo confortável
    localStorage.setItem('uiMode', 'confortavel');
    btnCompacto?.classList.remove('active');
    btnConfortavel?.classList.add('active');
    console.log("Modo Confortável aplicado.");
  } else {
    // Compacto é o padrão
    htmlElement.classList.remove('modo-confortavel');
    htmlElement.style.fontSize = '10px'; // Modo compacto (padrão)
    localStorage.setItem('uiMode', 'compacto');
    btnCompacto?.classList.add('active');
    btnConfortavel?.classList.remove('active');
    console.log("Modo Compacto aplicado.");
  }
}

/**
 * Inicializa o modo de interface com base na preferência salva ou no padrão.
 */
function inicializarModoInterface() {
  const modoSalvo = localStorage.getItem('uiMode') || 'compacto'; // Padrão é compacto
  aplicarModo(modoSalvo);

  // Adiciona listeners aos botões de modo
  const btnCompacto = document.getElementById('btn-modo-compacto');
  const btnConfortavel = document.getElementById('btn-modo-confortavel');

  btnCompacto?.addEventListener('click', () => aplicarModo('compacto'));
  btnConfortavel?.addEventListener('click', () => aplicarModo('confortavel'));
  console.log("Listeners dos botões de modo adicionados.");
}

// --- Fim do Bloco de Controle de Modo de Interface ---

