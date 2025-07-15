/**
 * @file index.js
 * @description Arquivo principal de inicialização do Dashboard de Tarefas.
 * @project Dashboard de Tarefas - SUNO
 */

import { inicializarControleZoomFonte, atualizarAnoRodape } from './helpers/utils.js';

// Detectar a página atual e carregar os scripts apropriados
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const pageName = currentPath.split('/').pop();
  
  console.log(`Carregando scripts para: ${pageName}`);
  
  // Verificar se dados.json está acessível antes de carregar os módulos
  fetch('dados.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar dados.json: ${response.status}`);
      }
      console.log('dados.json está acessível');
      
      carregarModuloEspecifico(pageName);
    })
    .catch(error => {
      console.error('Erro ao verificar dados.json:', error);
      const container = document.querySelector('#timeline') || document.querySelector('#kanban-container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger m-3">
            <h5>Erro Crítico</h5>
            <p>${error.message}</p>
            <p>Verifique o arquivo de dados e a configuração do servidor.</p>
          </div>`;
      }
    });

  // Inicializa controles de zoom e rodapé (comum a todas as páginas)
  inicializarControleZoomFonte(); 
  atualizarAnoRodape();
});

/**
 * Carrega o módulo JS específico para a página atual.
 * @param {string} pageName - Nome do arquivo da página (ex: 'index.html').
 */
function carregarModuloEspecifico(pageName) {
  try {
    let scriptSrc;
    if (pageName === 'index.html' || pageName === '') {
      scriptSrc = 'js/views/dashboardView.js';
    } else if (pageName === 'clientes.html') {
      scriptSrc = 'js/views/clientsView.js';
    } else if (pageName === 'kanban.html') {
      scriptSrc = 'js/views/kanbanView.js';
    }

    if (scriptSrc) {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.type = 'module';
      document.body.appendChild(script);
    }
  } catch (error) {
    console.error('Erro ao carregar módulo da view:', error);
  }
}