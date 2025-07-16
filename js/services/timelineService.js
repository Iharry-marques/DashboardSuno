/**
 * @file timelineService.js - MODERNIZADO
 * @description Estilos modernos para a timeline Vis.js com glassmorphism e micro-interações
 * @project Dashboard de Tarefas - SUNO
 */

// ... (código dos mappers não alterado) ...
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
    itemData: tarefa,
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
    itemData: projeto,
  };
}


export async function criarTimeline(container, dados, config) {
  if (!container) return null;
  container.innerHTML = '';
  if (!dados || dados.length === 0) {
    container.innerHTML = `<div class="alert alert-info m-3">Nenhum item para exibir. Ajuste os filtros.</div>`;
    return null;
  }
  try {
    const mapped = dados.map(config.itemMapper);
    const groups = new vis.DataSet([...new Set(mapped.map(it => it.group))].map(g => ({ id: g, content: g })));
    const items = new vis.DataSet(mapped);
    
    // Objeto de opções da timeline
    const options = {
      locale: 'pt-BR', // <<< ADICIONADO: Define o idioma para Português (Brasil)
      stack: true,
      orientation: 'top',
      verticalScroll: true,
      height: '100vh',
      zoomMin: 1000 * 60 * 60 * 24 * 7,
      zoomMax: 1000 * 60 * 60 * 24 * 365,
      tooltip: {
        template: function() { return ''; }
      }
    };

    const timeline = new vis.Timeline(container, items, groups, options);
    console.log('%c[Timeline Service] Timeline criada com sucesso.', 'color: green; font-weight: bold;', timeline);
    window.timeline = timeline;
    return timeline;
  } catch (error) {
    console.error('[Timeline Service] ERRO CRÍTICO ao criar a timeline:', error);
    container.innerHTML = `<div class="alert alert-danger m-3">Erro ao renderizar timeline: ${error.message}</div>`;
    window.timeline = null;
    return null;
  }
}

// ... (resto do arquivo 'timelineService.js' não foi alterado) ...
function logTimelineAction(actionName, timelineInstance) {
  if (!timelineInstance || typeof timelineInstance.getWindow !== 'function') {
    console.error(`[Timeline Control] Ação '${actionName}' falhou. 'window.timeline' é inválido ou não é uma instância da timeline.`, timelineInstance);
    return false;
  }
  console.log(`[Timeline Control] Executando ação: ${actionName}`);
  return true;
}

export function moverTimeline(timeline, dias) {
  if (!logTimelineAction('Mover', timeline)) return;
  const range = timeline.getWindow();
  const newStart = moment(range.start).add(dias, 'days');
  const newEnd = moment(range.end).add(dias, 'days');
  timeline.setWindow(newStart, newEnd, { animation: true });
}

export function irParaHoje(timeline) {
  if (!logTimelineAction('Ir para Hoje', timeline)) return;
  timeline.moveTo(moment(), { animation: true });
}

export function ajustarZoom(timeline, fator) {
  if (!logTimelineAction(`Zoom (fator: ${fator})`, timeline)) return;
  if (typeof timeline.zoom === 'function') {
    timeline.zoom(fator);
  } else {
    console.warn('[Timeline Control] O método .zoom() não foi encontrado. Usando fallback com .setWindow() para simular o zoom.');
    const range = timeline.getWindow();
    const center = (range.end.getTime() + range.start.getTime()) / 2;
    const newInterval = (range.end.getTime() - range.start.getTime()) * fator;
    const newStart = new Date(center - newInterval / 2);
    const newEnd = new Date(center + newInterval / 2);
    timeline.setWindow(newStart, newEnd, { animation: true });
  }
}

export function configurarEventoTelaCheia() {
  const btn = document.getElementById('btn-fullscreen-gantt');
  const container = document.getElementById('timeline');
  if (btn && container) {
    btn.onclick = () => {
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
          alert(`Não foi possível entrar em tela cheia: ${err.message}`);
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