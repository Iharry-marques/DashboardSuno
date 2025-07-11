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
  
  // Ajusta altura dos grupos
  setTimeout(() => {
    stretchTimelineGroups();
  }, 50);
}

/**
 * Ajusta a altura dos painéis de grupo da timeline para preencher o espaço vertical
 */
function stretchTimelineGroups() {
  const container = document.getElementById("timeline");
  if (!container) return;

  const centerPanel = container.querySelector('.vis-center');
  const groups = container.querySelectorAll(".vis-group");
  if (!groups.length) return;

  const containerHeight = centerPanel ? centerPanel.offsetHeight : container.offsetHeight;

  if (containerHeight < 200) {
    console.warn("stretchTimelineGroups abortado: altura insuficiente", containerHeight);
    return;
  }

  let groupHeight = Math.floor((containerHeight - 30) / groups.length);
  if (groupHeight < 50) groupHeight = 50;
  if (groupHeight > 200) groupHeight = 200;

  groups.forEach((group) => {
    group.style.minHeight = `${groupHeight}px`;
    group.style.height = `${groupHeight}px`;
  });

  console.log("stretchTimelineGroups: grupos ajustados para", groupHeight, "px");
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
    console.log("Aguardando dimensões válidas do container...");
    
    // Aguardar container ter dimensões válidas
    const hasValidDimensions = await waitForContainerDimensions(container);
    
    if (!hasValidDimensions) {
      console.warn("Container não obteve dimensões válidas, prosseguindo mesmo assim...");
    }

    // Destruir tooltips existentes
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
        const isShortDuration = durationHours < 8;
        const isSubtask = item.tipo === "Subtarefa";
        const priority = item.Priority?.toLowerCase() || "medium";
        const priorityClass = `task-priority-${priority}`;
        const taskClass = `${priorityClass} ${isSubtask ? "subtask" : ""} ${
          isShortDuration ? "curta" : "longa"
        }`;

        return {
          id: idx,
          content: item.name || "Tarefa sem nome",
          start: startDate.toDate(),
          end: endDate.toDate(),
          group: item.responsible,
          className: taskClass,
          isShortDuration: isShortDuration,
          itemData: item, // Dados originais para o tooltip
          priorityClass: priorityClass,
          title: '' // Desabilitar tooltip nativo do vis.js
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
    
    console.log("Criando timeline...");
    const timeline = new vis.Timeline(container, items, visGroups, options);

    // Aguardar renderização completa
    await new Promise(resolve => {
      const onChanged = () => {
        timeline.off('changed', onChanged);
        resolve();
      };
      timeline.on('changed', onChanged);
      
      // Fallback caso o evento 'changed' não dispare
      setTimeout(resolve, 800);
    });

    console.log("Timeline criada, configurando eventos e efeitos modernos...");

    // Configurar eventos e tooltips modernos
    configurarEventosTimeline(timeline, items, 'task');

    // Adicionar efeitos visuais modernos
    addModernEffects(container);

    // Forçar refresh sequencial com verificações
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        timeline.redraw();
        requestAnimationFrame(() => {
          stretchTimelineGroups();
          irParaHoje(timeline);
          window.dispatchEvent(new Event("resize"));
          resolve();
        });
      });
    });

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
    console.log("Aguardando dimensões válidas do container...");
    
    // Aguardar container ter dimensões válidas
    const hasValidDimensions = await waitForContainerDimensions(container);
    
    if (!hasValidDimensions) {
      console.warn("Container não obteve dimensões válidas, prosseguindo mesmo assim...");
    }

    // Destruir tooltips existentes
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

        return {
          id: idx,
          content: `
            <div class="project-item-content">
              <strong>${projeto.name || "Projeto sem nome"}</strong>
              <div class="project-meta">
                <span class="progress-indicator" style="width: ${projeto.progress || 0}%"></span>
                <span class="teams">${projeto.groups?.join(", ") || "N/A"}</span>
              </div>
            </div>
          `,
          start: startDate.toDate(),
          end: endDate.toDate(),
          group: projeto.client,
          className: `${priorityClass} ${statusClass} project-item`,
          itemData: projeto, // Dados originais para o tooltip
          priorityClass: priorityClass,
          statusClass: statusClass,
          title: '' // Desabilitar tooltip nativo do vis.js
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

    console.log("Criando timeline de projetos...");
    const timeline = new vis.Timeline(container, items, visGroups, options);

    // Aguardar renderização completa
    await new Promise(resolve => {
      const onChanged = () => {
        timeline.off('changed', onChanged);
        resolve();
      };
      timeline.on('changed', onChanged);
      
      // Fallback caso o evento 'changed' não dispare
      setTimeout(resolve, 800);
    });

    console.log("Timeline de projetos criada, configurando eventos e efeitos modernos...");

    // Configurar eventos e tooltips modernos
    configurarEventosTimeline(timeline, items, 'project');

    // Adicionar efeitos visuais modernos
    addModernEffects(container);

    // Forçar refresh sequencial com verificações
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        timeline.redraw();
        requestAnimationFrame(() => {
          stretchTimelineGroups();
          irParaHoje(timeline);
          window.dispatchEvent(new Event("resize"));
          resolve();
        });
      });
    });

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

// Listener para resize da janela com debounce
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    stretchTimelineGroups();
  }, 150);
});

// Listener para mudança de orientação em dispositivos móveis
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    stretchTimelineGroups();
    window.dispatchEvent(new Event("resize"));
  }, 300);
});