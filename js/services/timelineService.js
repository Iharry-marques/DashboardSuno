/**
 * @file timelineService.js - MODERNIZADO
 * @description Estilos modernos para a timeline Vis.js com glassmorphism e micro-interações
 * @project Dashboard de Tarefas - SUNO
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
    const mapped = dados.map(config.itemMapper);    
    const groups = new window.vis.DataSet(
      [...new Set(mapped.map(it => it.group))].map(g => ({ id: g, content: g }))
    );
    const items = new window.vis.DataSet(mapped);
    const options = {
      locale: 'pt-BR',
      stack: true,
      orientation: 'top',
      verticalScroll: true,
      height: '100vh',
      zoomMin: 1000 * 60 * 60 * 24 * 7, // 1 semana
      zoomMax: 1000 * 60 * 60 * 24 * 365, // 1 ano
    };
    const timeline = new window.vis.Timeline(container, items, groups, options);
    window.timeline = timeline; // Para depuração e compatibilidade
    return timeline;
  } catch (error) {
    console.error('Erro ao criar timeline:', error);
    container.innerHTML = `<div class="alert alert-danger m-3">Erro ao renderizar timeline: ${error.message}</div>`;
    return null;
  }
}

export function moverTimeline(timeline, dias) {
  if (!timeline) return;
  const range = timeline.getWindow();
  // ✅ CORREÇÃO: Usando window.moment
  const newStart = window.moment(range.start).add(dias, 'days');
  const newEnd = window.moment(range.end).add(dias, 'days');
  timeline.setWindow(newStart, newEnd, { animation: true });
}

export function irParaHoje(timeline) {
  if (!timeline) return;
  // ✅ CORREÇÃO: Usando window.moment
  timeline.moveTo(window.moment(), { animation: true });
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

export const Mappers = {
  mapTarefaToTimelineItem,
  mapProjetoToTimelineItem,
};