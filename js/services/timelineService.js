/**
 * @file timelineService.js
 * @description Serviço para manipulação e configuração da timeline
 * @project Dashboard de Tarefas - SUNO
 */

// Variável global para rastrear o tooltip ativo
let activeTooltipElement = null;

/**
 * Configurações padrão para a timeline
 * @returns {Object} Objeto de configuração da timeline
 */
export function getTimelineOptions() {
  return {
    orientation: "top",
    stack: true,
    margin: { item: 5 }, // Reduzir margem entre itens empilhados
    zoomMin: 1000 * 60 * 60 * 24 * 7, // Mínimo de 7 dias
    zoomMax: 1000 * 60 * 60 * 24 * 180, // Máximo de 180 dias
    start: moment().subtract(1, "weeks"),
    end: moment().add(2, "weeks"),
    groupOrder: (a, b) => a.content.localeCompare(b.content),
    horizontalScroll: true,
    verticalScroll: true,
    height: "100%",
    // Usar template para renderização customizada
    template: function (item, element, data) {
      if (!data) return;
      // CORREÇÃO: Usar SVG inline para o ícone de tarefa curta
      if (data.isShortDuration) {
        // SVG para um círculo de informação (semelhante a fa-info-circle)
        // A cor será definida via CSS usando 'fill: currentColor'
        return `<div class="timeline-task-icon ${data.className || ""}">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.064.293.006.399.287.47l.45.082.082.38-.45.083a.503.503 0 0 1-.487-.01L5.21 11.42a.5.5 0 0 1-.029-.47l.738-3.468c.064-.293-.006-.399-.287-.47L5.21 7.17a.5.5 0 0 1-.004-.487l.082-.38.45.083.082.38-.45.083a.5.5 0 0 1-.487.01L5.21 6.588a.5.5 0 0 1 .487-.592l2.29-.287a.5.5 0 0 1 .592.487zM8 4.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                  </svg>
                </div>`;
      } else {
        const isSubtask = data.itemData?.tipo === "Subtarefa";
        const titlePrefix = isSubtask ? "↳ " : "";
        // Remover o priority-dot explícito, a cor da barra indica
        return `<div class="timeline-item-content ${data.className || ""}">
                  <span class="task-label">${titlePrefix}${
          data.itemData?.name || "Tarefa sem nome"
        }</span>
                </div>`;
      }
    },
    // Desabilitar tooltip padrão no hover
    showTooltips: false,
    itemHeightRatio: 0.8,
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
 * @param {object} timeline - Instância da timeline para redimensionar
 */
export function configurarEventoTelaCheia(
  btnFullscreen,
  timelineCard,
  timeline
) {
  if (!btnFullscreen || !timelineCard) return;

  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      (
        timelineCard.requestFullscreen ||
        timelineCard.webkitRequestFullscreen ||
        timelineCard.msRequestFullscreen
      ).call(timelineCard);
    } else {
      (
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.msExitFullscreen
      ).call(document);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (timeline) {
      const timelineElement = document.getElementById("timeline");
      if (timelineElement) {
        const defaultHeight =
          getComputedStyle(timelineElement).getPropertyValue(
            "--default-timeline-height"
          ) || "calc(100vh - 160px)";
        timelineElement.style.height = document.fullscreenElement
          ? `${window.innerHeight - 80}px`
          : defaultHeight;
        timeline.redraw();
      }
    }
  });
}

/**
 * Cria uma timeline para visualização de tarefas por responsável
 * @param {HTMLElement} container - Container onde a timeline será renderizada
 * @param {Array} dados - Dados a serem exibidos na timeline
 * @param {Object} config - Configurações adicionais
 * @returns {Object} Objeto com a timeline e os datasets
 */
export function criarTimelineTarefas(container, dados, config = {}) {
  if (!container || !dados || dados.length === 0) {
    if (container)
      container.innerHTML =
        '<div class="alert alert-info m-3">Nenhuma tarefa encontrada</div>';
    return null;
  }

  try {
    const responsaveis = [
      ...new Set(dados.map((t) => t.responsible).filter(Boolean)),
    ].sort();

    const items = new vis.DataSet(
      dados.map((item, idx) => {
        const startDate = moment(item.start);
        let endDate;

        // --- CORREÇÃO DO PROBLEMA ---
        if (!item.end || moment(item.end).isSame(startDate, "day")) {
          endDate = startDate.clone().endOf("day");
        } else {
          endDate = moment(item.end);
          if (endDate.isBefore(startDate))
            endDate = startDate.clone().endOf("day");
        }

        const durationHours = endDate.diff(startDate, "hours");
        const isShortDuration = durationHours < 8;

        const isSubtask = item.tipo === "Subtarefa";
        const priority = item.Priority?.toLowerCase() || "medium";
        const priorityClass =
          config.priorityClasses?.[priority] || config.priorityClasses.medium;
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
    const timeline = new vis.Timeline(container, items, visGroups, options);
    function stretchTimelineGroups() {
      const container = document.getElementById("timeline");
      if (!container) return;
      const groups = container.querySelectorAll(".vis-group");
      if (!groups.length) return;

      const containerHeight = container.offsetHeight;
      const padding = 24;
      let groupHeight = Math.floor((containerHeight - padding) / groups.length);

      // Limitar altura máxima por grupo (opcional)
      const maxHeight = 180; // px, ajuste se quiser evitar grupos gigantes
      if (groupHeight > maxHeight) groupHeight = maxHeight;

      groups.forEach((group) => {
        group.style.minHeight = `${groupHeight}px`;
        group.style.height = `${groupHeight}px`;
      });
    }

    // Use após renderizar o gráfico
    timeline.fit();
    stretchTimelineGroups();
    configurarEventosTimeline(timeline, items);

    return { timeline, items, groups: visGroups };
  } catch (error) {
    console.error("Erro ao criar timeline de tarefas:", error);
    container.innerHTML = `<div class="alert alert-danger">Erro ao criar timeline: ${error.message}</div>`;
    return null;
  }
}

/**
 * Cria uma timeline para visualização de projetos por cliente
 * @param {HTMLElement} container - Container onde a timeline será renderizada
 * @param {Array} projetos - Dados de projetos a serem exibidos
 * @param {Object} config - Configurações adicionais
 * @returns {Object} Objeto com a timeline e os datasets
 */
export function criarTimelineProjetos(container, projetos, config = {}) {
  if (!container || !projetos || projetos.length === 0) {
    if (container)
      container.innerHTML =
        '<div class="alert alert-info m-3">Nenhum projeto encontrado</div>';
    return null;
  }

  try {
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
          config.priorityClasses?.[priority] || config.priorityClasses.medium;

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
      // Sobrescrever template para projetos (não precisa de ícone)
      template: function (item, element, data) {
        if (!data) return "";
        const equipe = data.itemData?.groups?.join(" / ") || "Sem equipe";
        const responsavel =
          data.itemData?.responsibles?.join(", ") || "Sem responsável";
        // Remover priority-dot explícito
        return `<div class="timeline-item-content ${data.className || ""}">
                    <span class="task-label"><strong>${equipe}</strong> - ${responsavel}</span>
                  </div>`;
      },
      ...config.timelineOptions,
    };

    const timeline = new vis.Timeline(container, items, visGroups, options);
    timeline.fit();
    configurarEventosTimeline(timeline, items);

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
