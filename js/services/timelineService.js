/**
 * @file timelineService.js - MODERNIZADO
 * @description Estilos modernos para a timeline Vis.js com glassmorphism e micro-interações
 * @project Dashboard de Tarefas - SUNO
 */

/**
 * Mapeador para itens da timeline de TAREFAS.
 * @param {object} tarefa - A tarefa a ser mapeada.
 * @returns {object} - O item formatado para a timeline.
 */
function mapTarefaToTimelineItem(tarefa) {
  const isSubtask = tarefa.tipo === 'Subtarefa';
  return {
    id: tarefa.id,
    group: tarefa.group,
    content: `<div class='task-content'>${
      isSubtask ? "<div class='task-indicator subtask-indicator'></div>" : ''
    }${tarefa.content}</div>`,
    start: tarefa.start,
    end: tarefa.end,
    className: `task-priority-${tarefa.priority || 'low'} ${
      isSubtask ? 'subtask' : ''
    }`,
    itemData: tarefa, // Armazena dados originais
  };
}

/**
 * Mapeador para itens da timeline de PROJETOS.
 * @param {object} projeto - O projeto a ser mapeado.
 * @returns {object} - O item formatado para a timeline.
 */
function mapProjetoToTimelineItem(projeto) {
  return {
    id: projeto.id,
    group: projeto.group,
    content: `<div class='project-content'>${projeto.name}</div>`,
    start: projeto.start,
    end: projeto.end,
    className: `project-priority-${projeto.priority || 'medium'}`,
    itemData: projeto, // Armazena dados originais
  };
}

/**
 * Cria e renderiza uma timeline de forma genérica.
 * @param {HTMLElement} container - O container onde a timeline será renderizada.
 * @param {Array} dados - Os dados a serem exibidos (tarefas ou projetos).
 * @param {object} config - Objeto de configuração.
 * @param {Function} config.itemMapper - Função para mapear os dados para o formato da timeline.
 * @returns {vis.Timeline | null} - A instância da timeline criada.
 */
export async function criarTimeline(
  container,
  dados,
  config
) {
  if (!container) return null;

  container.innerHTML = ''; // Limpa o container

  if (!dados || dados.length === 0) {
    container.innerHTML = `<div class="alert alert-info m-3">Nenhum item para exibir. Ajuste os filtros.</div>`;
    return null;
  }

  try {
    // ✅ CORREÇÃO: Lógica de mapeamento e criação de grupo/item atualizada.
    
    // 1) Mapeia primeiro, porque podemos mexer no .group dentro do mapper
    const mapped = dados.map(config.itemMapper);
    
    // Console para não ficar “no escuro”
    console.table(mapped.slice(0,5), ['id','group','content']);

    
    // 2) Agora sim, cria os grupos a partir do resultado mapeado
    const groups = new vis.DataSet(
      [...new Set(mapped.map(it => it.group))].map(g => ({ id: g, content: g }))
    );

    console.log('[TIMELINE] grupos gerados:', groups.length, groups);

    // 3) Cria os itens
    const items = new vis.DataSet(mapped);

    const options = {
      stack: true,
      orientation: 'top',
      verticalScroll: true,
      height: '100vh',
      zoomMin: 1000 * 60 * 60 * 24 * 7, // 1 semana
      zoomMax: 1000 * 60 * 60 * 24 * 365, // 1 ano
    };

    const timeline = new vis.Timeline(container, items, groups, options);
    window.timeline = timeline; // Para depuração e compatibilidade

    return timeline;
  } catch (error) {
    console.error('Erro ao criar timeline:', error);
    container.innerHTML = `<div class="alert alert-danger m-3">Erro ao renderizar timeline: ${error.message}</div>`;
    return null;
  }
}

/**
 * Funções de controle da Timeline (sem alterações)
 */
export function moverTimeline(timeline, dias) {
  if (!timeline) return;
  const range = timeline.getWindow();
  const newStart = moment(range.start).add(dias, 'days');
  const newEnd = moment(range.end).add(dias, 'days');
  timeline.setWindow(newStart, newEnd, { animation: true });
}

export function irParaHoje(timeline) {
  if (!timeline) return;
  timeline.moveTo(moment(), { animation: true });
}

export function ajustarZoom(timeline, fator) {
  if (!timeline) return;
  timeline.zoom(fator);
}

export function configurarEventoTelaCheia() {
  const btn = document.getElementById('btn-fullscreen-gantt');
  const container = document.getElementById('timeline');
  if (btn && container) {
    btn.onclick = () => {
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch((err) => {
          alert(
            `Não foi possível entrar em tela cheia: ${err.message} (${err.name})`
          );
        });
      } else {
        document.exitFullscreen();
      }
    };
  }
}

// Exportando os mapeadores para serem usados nas configurações das views
export const Mappers = {
  mapTarefaToTimelineItem,
  mapProjetoToTimelineItem,
};