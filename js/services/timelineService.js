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
    margin: { item: 5 },
    zoomMin: 1000 * 60 * 60 * 24 * 3, // 3 dias mínimo (ALTERADO de 7 para 3)
    zoomMax: 1000 * 60 * 60 * 24 * 365, // 365 dias máximo (ALTERADO de 180 para 365)
    start: moment().subtract(3, "days"), // 3 dias antes (ALTERADO de 1 semana)
    end: moment().add(12, "days"), // 12 dias depois (ALTERADO de 2 semanas) - Total de 15 dias
    groupOrder: (a, b) => a.content.localeCompare(b.content), // Ordena grupos pelo nome
    horizontalScroll: true,
    verticalScroll: true,
    height: "100%",
    // itemHeightRatio: 0.8, // Removido ou comentado conforme discussão
    template: function (item, element, data) {
      // Template padrão pode ser simples ou customizado aqui.
      // Se 'item.content' existir, Vis.js o usará por padrão.
      // Para personalização mais fina, pode-se verificar 'item.type' ou classes.
      if (item.isShortDuration) {
        // Exemplo se você adicionar 'isShortDuration' aos dados do item
        // Para tarefas curtas, pode retornar um ícone ou string vazia
        // Ex: return `<div class="timeline-task-icon"><i class="fas fa-flag"></i></div>`;
        return ""; // Deixa o CSS cuidar do ícone para tarefas .curta
      }
      return item.content; // Para tarefas longas, exibe o conteúdo (nome da tarefa)
    },
    showTooltips: false, // Tooltips customizados são usados
    snap: function (date, scale, step) {
      // Arredonda para o início do dia ao arrastar/redimensionar
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

  void tooltip.offsetWidth; // Force reflow
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
    // Se o clique foi dentro do tooltip, reanexa o listener para o próximo clique fora
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
  // NOVO: Garantir que os eventos de clique funcionem após renderização
  setTimeout(() => {
    const container = timeline.dom.container;
    if (container) {
      // Forçar pointer-events nos itens
      const visItems = container.querySelectorAll('.vis-item');
      visItems.forEach(item => {
        item.style.pointerEvents = 'auto';
        item.style.cursor = 'pointer';
      });
    }
  }, 200);

  timeline.on("click", function (properties) {
    // Fecha tooltip se clicar fora de um item e um tooltip estiver ativo
    if (activeTooltipElement && !properties.item) {
      activeTooltipElement.remove();
      activeTooltipElement = null;
      document.removeEventListener("click", closeTooltipOnClickOutside, {
        capture: true,
      });
    }

    if (!properties.item) return; // Sai se nenhum item foi clicado

    const id = properties.item;
    const item = items.get(id);

    if (!item || !item.tooltipContent) return; // Sai se o item não tem conteúdo de tooltip

    showCustomTooltip(item, properties.event);
    properties.event.stopPropagation(); // Previne que o evento de clique no documento feche o tooltip imediatamente
  });

  // Remove tooltip ao mudar o range da timeline (zoom, scroll)
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
  
  // Centraliza mantendo o mesmo intervalo (zoom) - MELHORADO com animação
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
  timelineCard, // Este deve ser o elemento que entra em tela cheia, geralmente o card ou o #timeline
  timelineInstance // Renomeado para evitar conflito com o ID 'timeline'
) {
  if (!btnFullscreen || !timelineCard) return;

  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      if (timelineCard.requestFullscreen) {
        timelineCard.requestFullscreen();
      } else if (timelineCard.webkitRequestFullscreen) {
        /* Safari */
        timelineCard.webkitRequestFullscreen();
      } else if (timelineCard.msRequestFullscreen) {
        /* IE11 */
        timelineCard.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        /* IE11 */
        document.msExitFullscreen();
      }
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (timelineInstance) {
      // Usa a instância da timeline passada
      // Força um redesenho/ajuste da timeline quando o modo de tela cheia muda
      setTimeout(() => {
        // Pequeno delay para garantir que o DOM atualizou as dimensões
        timelineInstance.redraw();
        timelineInstance.fit(); // Opcional, pode ser útil
        stretchTimelineGroups(); // Adicionado para recalcular altura dos grupos em tela cheia
        // Disparar um evento de resize pode ajudar bibliotecas a se ajustarem
        window.dispatchEvent(new Event("resize"));
      }, 100);
    }
  });
}

/**
 * Ajusta a altura dos painéis de grupo da timeline para preencher o espaço vertical.
 */
function stretchTimelineGroups() {
  setTimeout(() => {
    const container = document.getElementById("timeline");
    if (!container) return;

    const centerPanel = container.querySelector('.vis-center');
    const groups = container.querySelectorAll(".vis-group");
    if (!groups.length) return;

    // Altura real do painel central do Gantt (onde as linhas aparecem)
    const containerHeight = centerPanel ? centerPanel.offsetHeight : container.offsetHeight;

    // Só faz o ajuste se a altura está realista
    if (containerHeight < 200) {
      console.warn("stretchTimelineGroups abortado: altura insuficiente", containerHeight);
      return;
    }

    let groupHeight = Math.floor((containerHeight - 24) / groups.length);
    if (groupHeight < 45) groupHeight = 45; // mínimo visual
    if (groupHeight > 180) groupHeight = 180; // máximo visual

    groups.forEach((group, idx) => {
      group.style.minHeight = `${groupHeight}px`;
      group.style.height = `${groupHeight}px`;
    });

    // NOVO: Garantir que os cliques funcionem nos itens da timeline
    setTimeout(() => {
      // Permitir cliques apenas no painel central onde estão os itens
      const centerPanel = container.querySelector('.vis-center');
      if (centerPanel) {
        centerPanel.style.pointerEvents = 'auto';
        centerPanel.style.position = 'relative';
        centerPanel.style.zIndex = '1';
      }
      
      // Garantir que os overlays de background não bloqueiem cliques
      const backgrounds = container.querySelectorAll('.vis-background, .vis-overlay');
      backgrounds.forEach(bg => {
        bg.style.pointerEvents = 'none';
      });
      
      // Garantir que os itens sejam clicáveis
      const items = container.querySelectorAll('.vis-item');
      items.forEach(item => {
        item.style.pointerEvents = 'auto';
        item.style.cursor = 'pointer';
      });
    }, 150);

    console.log("stretchTimelineGroups: groups ajustados para", groupHeight, "px");
  }, 120); // Delay maior para garantir render finalizado (ajuste se necessário)
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

        if (!item.end) {
          endDate = startDate.clone().add(1, "days").endOf("day");
        } else {
          endDate = moment(item.end);
          // Se a diferença for menor que 1 dia, forçar 1 dia
          if (!endDate.isAfter(startDate)) {
            endDate = startDate.clone().add(1, "days").endOf("day");
          }
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
          content: item.name || "Tarefa sem nome", // <--- ADICIONADO PARA EXIBIR O NOME DA TAREFA
          start: startDate.toDate(),
          end: endDate.toDate(),
          group: item.responsible,
          className: taskClass,
          isShortDuration: isShortDuration, // Para uso no template, se necessário
          itemData: item, // Mantém os dados originais para referência
          priorityClass: priorityClass,
          tooltipContent: tooltipContent,
        };
      })
    );

    const visGroups = new vis.DataSet(
      responsaveis.map((resp) => ({ id: resp, content: resp }))
    );

    const options = { ...getTimelineOptions(), ...config.timelineOptions };
    // O template em getTimelineOptions será usado se 'content' for fornecido nos itens.
    // Se precisar de um template específico APENAS para tarefas, defina-o aqui:
    // options.template = function(item, element, data) { ... }

    const timeline = new vis.Timeline(container, items, visGroups, options);

    // Ajuste para garantir renderização correta após carregamento e em tab switch
    setTimeout(() => {
      if (timeline) {
        // IMPORTANTE: NÃO usar fit() para manter a escala de 15 dias
        // timeline.fit(); // COMENTADO - Ajusta o zoom para caber todos os itens
        stretchTimelineGroups(); // Sua função customizada para altura dos grupos
        window.dispatchEvent(new Event("resize")); // Força bibliotecas a recalcularem layout
        
        // NOVO: Centralizar na data atual mantendo a escala
        irParaHoje(timeline);
      }
    }, 50); // Pequeno delay

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
          : startDate.clone().add(14, "days"); // Default de 14 dias se não houver data final
        if (endDate.isBefore(startDate))
          endDate = startDate.clone().add(1, "hour"); // Garante que end é depois de start

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

        // A propriedade 'content' aqui é usada pelo template customizado abaixo
        return {
          id: idx,
          content: `<strong>${
            projeto.name || "Projeto sem nome"
          }</strong><br>Equipe: ${projeto.groups?.join(", ") || "N/A"}`,
          start: startDate.toDate(),
          end: endDate.toDate(),
          group: projeto.client,
          className: `${priorityClass} ${statusClass}`,
          itemData: projeto, // Mantém os dados originais
          priorityClass: priorityClass,
          statusClass: statusClass,
          tooltipContent: tooltipContent,
        };
      })
    );

    const visGroups = new vis.DataSet(
      clientes.map((cliente) => ({
        id: cliente,
        content: `<strong>${cliente}</strong>`, // Nome do cliente em negrito no grupo
        className: config.clientColors?.[cliente.toUpperCase()] || "", // Aplica classe de cor se definida
      }))
    );

    // Template customizado para projetos
    const options = {
      ...getTimelineOptions(), // Pega as opções base
      template: function (item, element, data) {
        // Sobrescreve o template
        if (!item || !item.itemData) return ""; // Proteção contra dados nulos
        // Aqui você pode usar item.content ou acessar item.itemData para mais detalhes
        // A propriedade 'content' já foi formatada acima para incluir nome e equipe.
        // Para a visualização de clientes, o nome do projeto + equipe já estão em item.content
        return `<div class="task-label">${item.content}</div>`;
      },
      ...config.timelineOptions, // Permite sobrescrever via config
    };

    const timeline = new vis.Timeline(container, items, visGroups, options);

    // Ajuste para garantir renderização correta
    setTimeout(() => {
      if (timeline) {
        // IMPORTANTE: NÃO usar fit() para manter a escala de 15 dias
        // timeline.fit(); // COMENTADO
        stretchTimelineGroups(); // Sua função customizada
        window.dispatchEvent(new Event("resize"));
        
        // NOVO: Centralizar na data atual mantendo a escala
        irParaHoje(timeline);
      }
    }, 50);

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
    // Usado para colorir grupos de clientes, se necessário
    SICREDI: "cliente-sicredi", // Defina essas classes no seu CSS
    SAMSUNG: "cliente-samsung",
    VIVO: "cliente-vivo",
    RD: "cliente-rd",
    AMERICANAS: "cliente-americanas",
    OBOTICARIO: "cliente-oboticario",
    COGNA: "cliente-cogna",
    ENGIE: "cliente-engie",
  },
};

// Adiciona o listener para o evento de resize da janela
// Isso garante que a altura dos grupos seja recalculada se a janela for redimensionada
window.addEventListener("resize", stretchTimelineGroups);