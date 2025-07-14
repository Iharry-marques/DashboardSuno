/**
 * @file timelineService.js - MODERNIZADO COM TOOLTIPS
 * @description Serviço para manipulação da timeline integrado com sistema moderno de tooltips
 * @project Dashboard de Tarefas - SUNO
 */

// Importar sistema de tooltips modernos
import { createTimelineTooltip, destroyTooltips } from './modernTooltipService.js';

/**
 * Aguarda o container ter dimensões válidas antes de prosseguir
 * @param {HTMLElement} container - Container a ser verificado
 * @param {number} maxAttempts - Número máximo de tentativas
 * @returns {Promise<boolean>} - Resolve quando container tem dimensões válidas
 */
function waitForContainerDimensions(container, maxAttempts = 50) {
  return new Promise((resolve) => {
    let attempts = 0;
    
    function checkDimensions() {
      const rect = container.getBoundingClientRect();
      const hasValidDimensions = rect.width > 100 && rect.height > 100;
      
      if (hasValidDimensions || attempts >= maxAttempts) {
        console.log(`Container dimensions: ${rect.width}x${rect.height} (attempts: ${attempts})`);
        resolve(hasValidDimensions);
        return;
      }
      
      attempts++;
      requestAnimationFrame(checkDimensions);
    }
    
    checkDimensions();
  });
}

/**
 * Gera iniciais a partir de um título para exibição em espaços pequenos.
 * @param {string} title - O título da tarefa.
 * @returns {string} - As iniciais geradas.
 */
function getInitials(title) {
  if (!title || typeof title !== 'string') return '';
  // Remove parênteses e colchetes, depois divide em palavras.
  const words = title.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim().split(' ');
  // Pega a primeira letra das 3 primeiras palavras não vazias.
  return words.filter(Boolean).slice(0, 3).map(w => w[0]).join('').toUpperCase();
}


/**
 * Configurações padrão para a timeline modernizada
 * @returns {Object} Objeto de configuração da timeline
 */
export function getTimelineOptions() {
  return {
    orientation: "top",
    stack: true,
    autoResize: true, // Garante que a altura se ajuste ao conteúdo
    margin: { item: 6 },
    zoomMin: 1000 * 60 * 60 * 24 * 2, // 2 dias mínimo
    zoomMax: 1000 * 60 * 60 * 24 * 365, // 365 dias máximo
    start: moment().subtract(3, "days"), // 3 dias antes
    end: moment().add(12, "days"), // 12 dias depois
    groupOrder: (a, b) => a.content.localeCompare(b.content),
    horizontalScroll: true,
    verticalScroll: true,
    height: "100%",
    showTooltips: false, // Usaremos nosso sistema customizado
    snap: function (date, scale, step) {
      const hour = 60 * 60 * 1000;
      return Math.round(date / hour) * hour;
    },
    // Configurações de performance
    maxHeight: '100%',
    minHeight: 400,
    // Configurações modernas
    locale: 'pt-BR',
    moment: moment,
    timeAxis: {
      scale: 'day',
      step: 1
    }
  };
}

/**
 * Configura tooltips modernos para elementos da timeline
 * @param {Object} timeline - Instância da timeline
 * @param {Object} items - Dataset de itens da timeline
 * @param {string} type - Tipo da timeline ('task' ou 'project')
 */
function setupModernTooltips(timeline, items, type = 'task') {
  // Aguardar renderização completa da timeline
  setTimeout(() => {
    const container = timeline.dom.container;
    if (!container) return;

    // Encontrar todos os elementos de item na timeline
    const visItems = container.querySelectorAll('.vis-item');
    
    visItems.forEach((element, index) => {
      // Obter o ID do item a partir do elemento DOM
      const itemId = element.getAttribute('data-id') || 
                    element.className.match(/vis-item-(\d+)/)?.[1] ||
                    index;
      
      // Buscar dados do item
      const itemData = items.get(itemId);
      if (!itemData || !itemData.itemData) return;

      // Criar tooltip moderno
      try {
        createTimelineTooltip(element, itemData.itemData, type);
      } catch (error) {
        console.warn('Erro ao criar tooltip para item:', itemId, error);
      }
    });

    console.log(`Tooltips modernos configurados para ${visItems.length} itens`);
  }, 500); // Delay para garantir renderização completa
}

/**
 * Configura eventos para a timeline com tooltips modernos
 * @param {Object} timeline - Instância da timeline
 * @param {Object} items - Dataset de itens da timeline
 * @param {string} type - Tipo da timeline ('task' ou 'project')
 */
function configurarEventosTimeline(timeline, items, type = 'task') {
  // Configurar tooltips após renderização
  setupModernTooltips(timeline, items, type);

  // Reconfigurar tooltips quando a timeline for redesenhada
  timeline.on('changed', () => {
    setTimeout(() => {
      setupModernTooltips(timeline, items, type);
    }, 200);
  });

  // Garantir que os itens sejam clicáveis e interativos
  timeline.on('afterRender', () => {
    setTimeout(() => {
      const container = timeline.dom.container;
      if (container) {
        // Tornar itens clicáveis
        const visItems = container.querySelectorAll('.vis-item');
        visItems.forEach(item => {
          item.style.pointerEvents = 'auto';
          item.style.cursor = 'pointer';
        });

        // Garantir que backgrounds não bloqueiem interações
        const backgrounds = container.querySelectorAll('.vis-background, .vis-overlay');
        backgrounds.forEach(bg => {
          bg.style.pointerEvents = 'none';
        });

        // Garantir que o painel central seja interativo
        const centerPanel = container.querySelector('.vis-center');
        if (centerPanel) {
          centerPanel.style.pointerEvents = 'auto';
          centerPanel.style.position = 'relative';
          centerPanel.style.zIndex = '1';
        }
      }
    }, 100);
  });

  // Event listener para cliques (mantido para compatibilidade)
  timeline.on("click", function (properties) {
    if (!properties.item) return;

    const id = properties.item;
    const item = items.get(id);
    
    if (item && item.itemData) {
      console.log('Item clicado:', item.itemData.name);
      // Aqui pode ser adicionada lógica adicional para cliques
    }
  });

  // Limpar tooltips quando a visualização mudar
  timeline.on("rangechange", () => {
    // Os tooltips do Tippy.js são automaticamente gerenciados
    // mas podemos adicionar lógica adicional se necessário
  });
}

/**
 * Move a timeline para frente ou para trás em dias
 * @param {object} timeline - Instância da timeline
 * @param {number} dias - Número de dias para mover (positivo = futuro, negativo = passado)
 */
export function moverTimeline(timeline, dias) {
  if (!timeline) return;
  const range = timeline.getWindow();
  timeline.setWindow({
    start: moment(range.start).add(dias, "days").valueOf(),
    end: moment(range.end).add(dias, "days").valueOf(),
    animation: {
      duration: 300,
      easingFunction: 'easeInOutQuad'
    }
  });
}

/**
 * Centraliza a timeline na data atual com animação suave
 * @param {object} timeline - Instância da timeline
 */
export function irParaHoje(timeline) {
  if (!timeline) return;
  const range = timeline.getWindow();
  const intervalo = range.end - range.start;
  const hoje = moment().valueOf();
  
  timeline.setWindow({
    start: hoje - intervalo / 2,
    end: hoje + intervalo / 2,
    animation: {
      duration: 500,
      easingFunction: 'easeInOutQuad'
    }
  });
}

/**
 * Ajusta o zoom da timeline com animação
 * @param {object} timeline - Instância da timeline
 * @param {number} fator - Fator de zoom (>1 = zoom in, <1 = zoom out)
 */
export function ajustarZoom(timeline, fator) {
  if (!timeline) return;
  const range = timeline.getWindow();
  const centro = new Date((range.end.getTime() + range.start.getTime()) / 2);
  const novoIntervalo = (range.end - range.start) / fator;
  
  timeline.setWindow({
    start: new Date(centro.getTime() - novoIntervalo / 2),
    end: new Date(centro.getTime() + novoIntervalo / 2),
    animation: {
      duration: 300,
      easingFunction: 'easeInOutQuad'
    }
  });
}

/**
 * Configura eventos de tela cheia para o container da timeline
 * @param {HTMLElement} btnFullscreen - Botão para ativar modo tela cheia
 * @param {HTMLElement} timelineCard - Container da timeline que será expandido
 * @param {object} timelineInstance - Instância da timeline para redimensionar
 */
export function configurarEventoTelaCheia(btnFullscreen, timelineCard, timelineInstance) {
  if (!btnFullscreen || !timelineCard) return;

  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      if (timelineCard.requestFullscreen) {
        timelineCard.requestFullscreen();
      } else if (timelineCard.webkitRequestFullscreen) {
        timelineCard.webkitRequestFullscreen();
      } else if (timelineCard.msRequestFullscreen) {
        timelineCard.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (timelineInstance) {
      setTimeout(() => {
        timelineInstance.redraw();
        timelineInstance.fit();
        forceTimelineRefresh(timelineInstance);
        window.dispatchEvent(new Event("resize"));
      }, 100);
    }
  });
}

/**
 * Força uma atualização completa da timeline
 * @param {Object} timeline - Instância da timeline
 */
function forceTimelineRefresh(timeline) {
  if (!timeline) return;
  
  // Força redesenho completo
  timeline.redraw();
  
  // Ajusta dimensões
  timeline.fit();
}

/**
 * Adiciona efeitos visuais modernos à timeline
 * @param {HTMLElement} container - Container da timeline
 */
function addModernEffects(container) {
  if (!container) return;

  // Adicionar classe para animações CSS
  container.classList.add('timeline-loaded', 'animate-fade-in');

  // Adicionar observer para scroll animations (opcional)
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
        }
      });
    }, { threshold: 0.1 });

    // Observar elementos filhos para animações escalonadas
    const items = container.querySelectorAll('.vis-item');
    items.forEach(item => observer.observe(item));
  }
}

/**
 * Cria uma timeline para visualização de tarefas por responsável - VERSÃO MODERNIZADA
 * @param {HTMLElement} container - Container onde a timeline será renderizada
 * @param {Array} dados - Dados a serem exibidos na timeline
 * @param {Object} config - Configurações adicionais
 * @returns {Object} Objeto com a timeline e os datasets
 */
export async function criarTimelineTarefas(container, dados, config = {}) {
  if (!container || !dados || dados.length === 0) {
    if (container) {
      container.innerHTML = `
        <div class="alert alert-info m-3 animate-fade-in">
          <i class="fas fa-info-circle me-2"></i>
          Nenhuma tarefa encontrada para o filtro selecionado
        </div>
      `;
    }
    return null;
  }

  try {
    destroyTooltips(container);

    const responsaveis = [
      ...new Set(dados.map((t) => t.responsible).filter(Boolean)),
    ].sort();

    const items = new vis.DataSet(
      dados.map((item, idx) => {
        const startDate = moment(item.start);
        let endDate;

        if (!item.end) {
          endDate = startDate.clone().add(1, "days").endOf("day");
        } else {
          endDate = moment(item.end);
          if (!endDate.isAfter(startDate)) {
            endDate = startDate.clone().add(1, "days").endOf("day");
          }
        }

        const durationHours = endDate.diff(startDate, "hours");
        const isShortDuration = durationHours < 8; // Mantido para CSS min-width
        
        // Define que a visualização é muito pequena se a duração for de 24h ou menos
        const isShortView = durationHours <= 24;

        const isSubtask = item.tipo === "Subtarefa";
        const priority = item.Priority?.toLowerCase() || "medium";
        const priorityClass = `task-priority-${priority}`;
        const taskClass = `${priorityClass} ${isSubtask ? "subtask" : ""} ${
          isShortDuration ? "curta" : "longa"
        }`;
        
        // Define o conteúdo do item: iniciais para tarefas curtas, título completo para as demais.
        const content = isShortView ? getInitials(item.name) : (item.name || "Tarefa sem nome");

        return {
          id: idx,
          content: content,
          start: startDate.toDate(),
          end: endDate.toDate(),
          group: item.responsible,
          className: taskClass,
          isShortDuration: isShortDuration, // Mantido para CSS
          itemData: item,
          priorityClass: priorityClass,
          title: '' // O tooltip moderno customizado é usado no lugar do title nativo.
        };
      })
    );

    const visGroups = new vis.DataSet(
      responsaveis.map((resp) => ({ 
        id: resp, 
        content: `<div class="group-label">${resp}</div>` 
      }))
    );

    const options = { 
      ...getTimelineOptions(), 
      ...config.timelineOptions 
    };
    
    const timeline = new vis.Timeline(container, items, visGroups, options);
    
    // CORREÇÃO DEFINITIVA: Força um redraw após um pequeno delay para corrigir o cálculo de altura
    setTimeout(() => {
      timeline.redraw();
    }, 100);
    
    configurarEventosTimeline(timeline, items, 'task');
    addModernEffects(container);
    
    console.log("Timeline de tarefas criada com sucesso!");
    return { timeline, items, groups: visGroups };

  } catch (error) {
    console.error("Erro ao criar timeline de tarefas:", error);
    container.innerHTML = `
      <div class="alert alert-danger m-3">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Erro ao criar timeline:</strong> ${error.message}
      </div>
    `;
    return null;
  }
}


/**
 * Cria uma timeline para visualização de projetos por cliente - VERSÃO MODERNIZADA
 * @param {HTMLElement} container - Container onde a timeline será renderizada
 * @param {Array} projetos - Dados de projetos a serem exibidos
 * @param {Object} config - Configurações adicionais
 * @returns {Object} Objeto com a timeline e os datasets
 */
export async function criarTimelineProjetos(container, projetos, config = {}) {
  if (!container || !projetos || projetos.length === 0) {
    if (container) {
      container.innerHTML = `
        <div class="alert alert-info m-3 animate-fade-in">
          <i class="fas fa-info-circle me-2"></i>
          Nenhum projeto encontrado para o filtro selecionado
        </div>
      `;
    }
    return null;
  }

  try {
    destroyTooltips(container);

    const clientes = [
      ...new Set(projetos.map((p) => p.client).filter(Boolean)),
    ].sort();

    const items = new vis.DataSet(
      projetos.map((projeto, idx) => {
        const startDate = moment(projeto.start);
        let endDate = projeto.end
          ? moment(projeto.end)
          : startDate.clone().add(14, "days");
        
        if (endDate.isBefore(startDate)) {
          endDate = startDate.clone().add(1, "hour");
        }

        let statusClass = "status-andamento";
        if (projeto.status === "Concluído") statusClass = "status-concluido";
        else if (projeto.status === "Atrasado") statusClass = "status-atrasado";

        const priority = projeto.priority?.toLowerCase() || "medium";
        const priorityClass = `task-priority-${priority}`;

        // Alterar: mostrar área(s) no quadradinho
        const areaLabel = projeto.groups && projeto.groups.length > 0 ? projeto.groups.join(", ") : "N/A";

        return {
          id: idx,
          content: `
            <div class="project-item-content">
              <strong>${areaLabel}</strong>
              <div class="project-meta">
                <span class="progress-indicator" style="width: ${projeto.progress || 0}%"></span>
                <span class="teams">${projeto.name || "Projeto sem nome"}</span>
              </div>
            </div>
          `,
          start: startDate.toDate(),
          end: endDate.toDate(),
          group: projeto.client,
          className: `${priorityClass} ${statusClass} project-item`,
          itemData: projeto,
          priorityClass: priorityClass,
          statusClass: statusClass,
          title: ''
        };
      })
    );

    const visGroups = new vis.DataSet(
      clientes.map((cliente) => ({
        id: cliente,
        content: `
          <div class="client-group-label">
            <i class="fas fa-building me-2"></i>
            <strong>${cliente}</strong>
          </div>
        `,
        className: config.clientColors?.[cliente.toUpperCase()] || "",
      }))
    );

    const options = {
      ...getTimelineOptions(),
      template: function (item, element, data) {
        if (!item || !item.itemData) return "";
        return item.content;
      },
      ...config.timelineOptions,
    };

    const timeline = new vis.Timeline(container, items, visGroups, options);
    
    // CORREÇÃO DEFINITIVA: Forçar um redraw após um pequeno delay
    setTimeout(() => {
        timeline.redraw();
    }, 100);

    configurarEventosTimeline(timeline, items, 'project');
    addModernEffects(container);
    
    console.log("Timeline de projetos criada com sucesso!");
    return { timeline, items, groups: visGroups };

  } catch (error) {
    console.error("Erro ao criar timeline de projetos:", error);
    container.innerHTML = `
      <div class="alert alert-danger m-3">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Erro ao criar timeline:</strong> ${error.message}
      </div>
    `;
    return null;
  }
}

// Configurações globais compartilhadas - MODERNIZADAS
export const CONFIG = {
  priorityClasses: {
    high: "task-priority-high",
    medium: "task-priority-medium",
    low: "task-priority-low",
  },
  clientColors: {
    SICREDI: "cliente-sicredi",
    SAMSUNG: "cliente-samsung",
    VIVO: "cliente-vivo",
    RD: "cliente-rd",
    AMERICANAS: "cliente-americanas",
    OBOTICARIO: "cliente-oboticario",
    COGNA: "cliente-cogna",
    ENGIE: "cliente-engie",
  },
  animations: {
    duration: 300,
    easing: 'easeInOutQuad'
  }
};