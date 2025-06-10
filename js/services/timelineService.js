/**
 * @file timelineService.js - VERSÃO CORRIGIDA
 * @description Serviço para manipulação e configuração da timeline
 * @project Dashboard de Tarefas - SUNO
 */

// Variável global para rastrear o tooltip ativo
let activeTooltipElement = null;

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
 * Configurações padrão para a timeline
 * @returns {Object} Objeto de configuração da timeline
 */
export function getTimelineOptions() {
  return {
    orientation: "top",
    stack: true,
    margin: { item: 5 },
    zoomMin: 1000 * 60 * 60 * 24 * 3, // 3 dias mínimo
    zoomMax: 1000 * 60 * 60 * 24 * 365, // 365 dias máximo
    start: moment().subtract(3, "days"), // 3 dias antes
    end: moment().add(12, "days"), // 12 dias depois
    groupOrder: (a, b) => a.content.localeCompare(b.content),
    horizontalScroll: true,
    verticalScroll: true,
    height: "100%",
    template: function (item, element, data) {
      if (item.isShortDuration) {
        return "";
      }
      return item.content;
    },
    showTooltips: false,
    snap: function (date, scale, step) {
      var hour = 60 * 60 * 1000;
      return Math.round(date / hour) * hour;
    },
  };
}

/**
 * Cria e exibe um tooltip customizado ao lado do elemento clicado
 * @param {Object} itemData - Dados do item clicado.
 * @param {Event} event - Evento do clique.
 */
function showCustomTooltip(itemData, event) {
  if (activeTooltipElement) {
    activeTooltipElement.remove();
    activeTooltipElement = null;
  }
  const tooltip = document.createElement("div");
  tooltip.className = "vis-tooltip";
  tooltip.innerHTML = itemData.tooltipContent;
  document.body.appendChild(tooltip);

  const clickX = event.pageX;
  const clickY = event.pageY;
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let left = clickX + 15;
  let top = clickY + 15;

  if (left + tooltipWidth > windowWidth - 10) {
    left = clickX - tooltipWidth - 15;
  }
  if (top + tooltipHeight > windowHeight - 10) {
    top = clickY - tooltipHeight - 15;
  }
  if (left < 10) left = 10;
  if (top < 10) top = 10;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;

  void tooltip.offsetWidth;
  tooltip.classList.add("vis-visible");
  activeTooltipElement = tooltip;

  setTimeout(() => {
    document.addEventListener("click", closeTooltipOnClickOutside, {
      once: true,
      capture: true,
    });
  }, 0);
}

/**
 * Fecha o tooltip ativo se o clique ocorrer fora dele.
 * @param {Event} event - Evento de clique.
 */
function closeTooltipOnClickOutside(event) {
  if (activeTooltipElement && !activeTooltipElement.contains(event.target)) {
    activeTooltipElement.remove();
    activeTooltipElement = null;
  } else if (activeTooltipElement) {
    setTimeout(() => {
      document.addEventListener("click", closeTooltipOnClickOutside, {
        once: true,
        capture: true,
      });
    }, 0);
  }
}

/**
 * Configura eventos para a timeline, incluindo o clique para tooltip
 * @param {Object} timeline - Instância da timeline
 * @param {Object} items - Dataset de itens da timeline
 */
function configurarEventosTimeline(timeline, items) {
  // Garantir que os eventos de clique funcionem após renderização
  setTimeout(() => {
    const container = timeline.dom.container;
    if (container) {
      const visItems = container.querySelectorAll('.vis-item');
      visItems.forEach(item => {
        item.style.pointerEvents = 'auto';
        item.style.cursor = 'pointer';
      });
    }
  }, 200);

  timeline.on("click", function (properties) {
    if (activeTooltipElement && !properties.item) {
      activeTooltipElement.remove();
      activeTooltipElement = null;
      document.removeEventListener("click", closeTooltipOnClickOutside, {
        capture: true,
      });
    }

    if (!properties.item) return;

    const id = properties.item;
    const item = items.get(id);

    if (!item || !item.tooltipContent) return;

    showCustomTooltip(item, properties.event);
    properties.event.stopPropagation();
  });

  timeline.on("rangechange", () => {
    if (activeTooltipElement) {
      activeTooltipElement.remove();
      activeTooltipElement = null;
      document.removeEventListener("click", closeTooltipOnClickOutside, {
        capture: true,
      });
    }
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
  });
}

/**
 * Centraliza a timeline na data atual
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
      duration: 300,
      easingFunction: 'easeInOutQuad'
    }
  });
}

/**
 * Ajusta o zoom da timeline
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
  });
}

/**
 * Configura eventos de tela cheia para o container da timeline
 * @param {HTMLElement} btnFullscreen - Botão para ativar modo tela cheia
 * @param {HTMLElement} timelineCard - Container da timeline que será expandido
 * @param {object} timelineInstance - Instância da timeline para redimensionar
 */
export function configurarEventoTelaCheia(
  btnFullscreen,
  timelineCard,
  timelineInstance
) {
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
 * Ajusta a altura dos painéis de grupo da timeline para preencher o espaço vertical.
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

  let groupHeight = Math.floor((containerHeight - 24) / groups.length);
  if (groupHeight < 45) groupHeight = 45;
  if (groupHeight > 180) groupHeight = 180;

  groups.forEach((group) => {
    group.style.minHeight = `${groupHeight}px`;
    group.style.height = `${groupHeight}px`;
  });

  // Garantir que os itens sejam clicáveis
  setTimeout(() => {
    const centerPanel = container.querySelector('.vis-center');
    if (centerPanel) {
      centerPanel.style.pointerEvents = 'auto';
      centerPanel.style.position = 'relative';
      centerPanel.style.zIndex = '1';
    }
    
    const backgrounds = container.querySelectorAll('.vis-background, .vis-overlay');
    backgrounds.forEach(bg => {
      bg.style.pointerEvents = 'none';
    });
    
    const items = container.querySelectorAll('.vis-item');
    items.forEach(item => {
      item.style.pointerEvents = 'auto';
      item.style.cursor = 'pointer';
    });
  }, 50);

  console.log("stretchTimelineGroups: groups ajustados para", groupHeight, "px");
}

/**
 * Cria uma timeline para visualização de tarefas por responsável - VERSÃO CORRIGIDA
 * @param {HTMLElement} container - Container onde a timeline será renderizada
 * @param {Array} dados - Dados a serem exibidos na timeline
 * @param {Object} config - Configurações adicionais
 * @returns {Object} Objeto com a timeline e os datasets
 */
export async function criarTimelineTarefas(container, dados, config = {}) {
  if (!container || !dados || dados.length === 0) {
    if (container)
      container.innerHTML =
        '<div class="alert alert-info m-3">Nenhuma tarefa encontrada</div>';
    return null;
  }

  try {
    console.log("Aguardando dimensões válidas do container...");
    
    // **CORREÇÃO PRINCIPAL: Aguardar container ter dimensões válidas**
    const hasValidDimensions = await waitForContainerDimensions(container);
    
    if (!hasValidDimensions) {
      console.warn("Container não obteve dimensões válidas, prosseguindo mesmo assim...");
    }

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
        const priorityClass =
          config.priorityClasses?.[priority] || config.priorityClasses?.medium || "task-priority-medium";
        const taskClass = `${priorityClass} ${isSubtask ? "subtask" : ""} ${
          isShortDuration ? "curta" : "longa"
        }`;

        const tooltipContent = `
          <div class="timeline-tooltip">
            <h5>${item.name || "Tarefa sem nome"}</h5>
            <p><strong>Cliente:</strong> ${item.client || "N/A"}</p>
            <p><strong>Responsável:</strong> ${item.responsible || "N/A"}</p>
            <p><strong>Período:</strong> ${startDate.format(
              "DD/MM/YY HH:mm"
            )} - ${endDate.format("DD/MM/YY HH:mm")}</p>
            <p><strong>Status:</strong> ${item.PipelineStepTitle || "N/A"}</p>
            <p><strong>Grupo:</strong> ${item.TaskOwnerFullPath || "N/A"}</p>
            <p><strong>Tipo:</strong> ${item.tipo || "Tarefa"}</p>
            <p><strong>Prioridade:</strong> ${item.Priority || "Média"}</p>
          </div>`;

        return {
          id: idx,
          content: item.name || "Tarefa sem nome",
          start: startDate.toDate(),
          end: endDate.toDate(),
          group: item.responsible,
          className: taskClass,
          isShortDuration: isShortDuration,
          itemData: item,
          priorityClass: priorityClass,
          tooltipContent: tooltipContent,
        };
      })
    );

    const visGroups = new vis.DataSet(
      responsaveis.map((resp) => ({ id: resp, content: resp }))
    );

    const options = { ...getTimelineOptions(), ...config.timelineOptions };
    
    console.log("Criando timeline...");
    const timeline = new vis.Timeline(container, items, visGroups, options);

    // **CORREÇÃO: Aguardar renderização completa usando Promise**
    await new Promise(resolve => {
      timeline.on('changed', resolve);
      // Fallback caso o evento 'changed' não dispare
      setTimeout(resolve, 500);
    });

    console.log("Timeline criada, configurando eventos e layout...");

    // Configurar eventos
    configurarEventosTimeline(timeline, items);

    // **CORREÇÃO: Forçar refresh sequencial com verificações**
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
    container.innerHTML = `<div class="alert alert-danger">Erro ao criar timeline: ${error.message}</div>`;
    return null;
  }
}

/**
 * Cria uma timeline para visualização de projetos por cliente - VERSÃO CORRIGIDA
 * @param {HTMLElement} container - Container onde a timeline será renderizada
 * @param {Array} projetos - Dados de projetos a serem exibidos
 * @param {Object} config - Configurações adicionais
 * @returns {Object} Objeto com a timeline e os datasets
 */
export async function criarTimelineProjetos(container, projetos, config = {}) {
  if (!container || !projetos || projetos.length === 0) {
    if (container)
      container.innerHTML =
        '<div class="alert alert-info m-3">Nenhum projeto encontrado</div>';
    return null;
  }

  try {
    console.log("Aguardando dimensões válidas do container...");
    
    // **CORREÇÃO PRINCIPAL: Aguardar container ter dimensões válidas**
    const hasValidDimensions = await waitForContainerDimensions(container);
    
    if (!hasValidDimensions) {
      console.warn("Container não obteve dimensões válidas, prosseguindo mesmo assim...");
    }

    const clientes = [
      ...new Set(projetos.map((p) => p.client).filter(Boolean)),
    ].sort();

    const items = new vis.DataSet(
      projetos.map((projeto, idx) => {
        const startDate = moment(projeto.start);
        let endDate = projeto.end
          ? moment(projeto.end)
          : startDate.clone().add(14, "days");
        if (endDate.isBefore(startDate))
          endDate = startDate.clone().add(1, "hour");

        let statusClass = "status-andamento";
        if (projeto.status === "Concluído") statusClass = "status-concluido";
        else if (projeto.status === "Atrasado") statusClass = "status-atrasado";

        const priority = projeto.priority?.toLowerCase() || "medium";
        const priorityClass =
          config.priorityClasses?.[priority] || config.priorityClasses?.medium || "task-priority-medium";

        const tooltipContent = `
            <div class="timeline-tooltip">
              <h5>${projeto.name || "Projeto sem nome"}</h5>
              <p><strong>Cliente:</strong> ${projeto.client || "N/A"}</p>
              <p><strong>Time:</strong> ${
                projeto.groups?.join(" / ") || "N/A"
              }</p>
              <p><strong>Período:</strong> ${startDate.format(
                "DD/MM/YY"
              )} - ${endDate.format("DD/MM/YY")}</p>
              <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${
          projeto.status || "N/A"
        }</span></p>
              <p><strong>Progresso:</strong> ${projeto.progress || 0}%</p>
              <p><strong>Prioridade:</strong> ${projeto.priority || "Média"}</p>
            </div>`;

        return {
          id: idx,
          content: `<strong>${
            projeto.name || "Projeto sem nome"
          }</strong><br>Equipe: ${projeto.groups?.join(", ") || "N/A"}`,
          start: startDate.toDate(),
          end: endDate.toDate(),
          group: projeto.client,
          className: `${priorityClass} ${statusClass}`,
          itemData: projeto,
          priorityClass: priorityClass,
          statusClass: statusClass,
          tooltipContent: tooltipContent,
        };
      })
    );

    const visGroups = new vis.DataSet(
      clientes.map((cliente) => ({
        id: cliente,
        content: `<strong>${cliente}</strong>`,
        className: config.clientColors?.[cliente.toUpperCase()] || "",
      }))
    );

    const options = {
      ...getTimelineOptions(),
      template: function (item, element, data) {
        if (!item || !item.itemData) return "";
        return `<div class="task-label">${item.content}</div>`;
      },
      ...config.timelineOptions,
    };

    console.log("Criando timeline de projetos...");
    const timeline = new vis.Timeline(container, items, visGroups, options);

    // **CORREÇÃO: Aguardar renderização completa usando Promise**
    await new Promise(resolve => {
      timeline.on('changed', resolve);
      // Fallback caso o evento 'changed' não dispare
      setTimeout(resolve, 500);
    });

    console.log("Timeline de projetos criada, configurando eventos e layout...");

    configurarEventosTimeline(timeline, items);

    // **CORREÇÃO: Forçar refresh sequencial com verificações**
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
    container.innerHTML = `<div class="alert alert-danger">Erro ao criar timeline: ${error.message}</div>`;
    return null;
  }
}

// Configurações globais compartilhadas
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
};

// Listener para resize da janela
window.addEventListener("resize", stretchTimelineGroups);