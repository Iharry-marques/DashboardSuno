// tooltipEnhancements.js – v5.2 com ESTILO MELHORADO

// As funções de JavaScript (getProp, fmtDate, initializeTooltips, etc.) permanecem as mesmas.
// A única alteração é na função que injeta o CSS.

console.log('[Tooltip] Módulo carregado (v5.2 - Event-Driven)');

function getProp(obj, ...candidates) {
  if (!obj) return "—";
  for (const k of candidates) {
    const key = k.toLowerCase();
    const foundKey = Object.keys(obj).find(objKey => objKey.toLowerCase() === key);
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null && obj[foundKey] !== "") return obj[foundKey];
  }
  return "—";
}
function fmtDate(d) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) { return "—"; }
}
function renderTaskTooltip(task) {
  return `<div class="tooltip-header">${getProp(task, 'content', 'tasktitle')}<button class="tooltip-close" data-close title="Fechar"></button></div><div class="tooltip-content"><span class="tooltip-icon">👤</span><span><strong>Cliente:</strong> ${getProp(task, 'client')}</span><span class="tooltip-icon">🧑‍💻</span><span><strong>Responsável:</strong> ${getProp(task, 'responsible', 'taskownerdisplayname')}</span><span class="tooltip-icon">📅</span><span><strong>Período:</strong> ${fmtDate(task.start)} → ${fmtDate(task.end)}</span><span class="tooltip-icon">📌</span><span><strong>Status:</strong> ${getProp(task, 'status', 'pipelinesteptitle')}</span><span class="tooltip-icon">👥</span><span><strong>Equipe:</strong> ${getProp(task, 'area', 'group', 'taskownerfunctiongroupname')}</span></div>`;
}
function renderProjectTooltip(project) {
  const equipes = Array.isArray(project.groups) ? [...project.groups].join(', ') : 'N/A';
  return `<div class="tooltip-header">${getProp(project, 'name', 'projeto')}<button class="tooltip-close" data-close title="Fechar"></button></div><div class="tooltip-content"><span class="tooltip-icon">🏢</span><span><strong>Cliente:</strong> ${getProp(project, 'client')}</span><span class="tooltip-icon">👥</span><span><strong>Equipes:</strong> ${equipes}</span><span class="tooltip-icon">📅</span><span><strong>Período:</strong> ${fmtDate(project.start)} → ${fmtDate(project.end)}</span><span class="tooltip-icon">📊</span><span><strong>Tarefas:</strong> ${project.tasks?.length || 0}</span></div>`;
}

// ✅ ESTA FUNÇÃO FOI ATUALIZADA COM O NOVO ESTILO
function injectTooltipStyles() {
    if (document.getElementById('suno-tooltip-theme-v2')) return;
    const style = document.createElement('style');
    style.id = 'suno-tooltip-theme-v2';
    style.textContent = `
    /* Estilo principal da caixa do tooltip */
    .tippy-box[data-theme~='suno'] {
        background-color: #1e293b; /* Cinza-azulado escuro */
        color: #e2e8f0; /* Branco-azulado claro */
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        font-size: 0.95rem;
        line-height: 1.5;
        padding: 0;
        z-index: 99999;
    }
    /* Estilo do cabeçalho do tooltip */
    .tippy-box[data-theme~='suno'] .tooltip-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.8rem 1.25rem;
        background-color: rgba(255, 255, 255, 0.05);
        font-weight: 600;
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
        font-size: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    /* Estilo do botão de fechar 'x' */
    .tippy-box[data-theme~='suno'] .tooltip-close {
        all: unset; /* Remove todos os estilos padrão de botão */
        cursor: pointer;
        width: 24px;
        height: 24px;
        margin-left: 1rem;
        opacity: 0.7;
        transition: all 0.2s ease;
        background-color: transparent;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        /* Ícone 'x' criado com SVG para alta qualidade */
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e2e8f0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E");
        background-size: 60%;
        background-repeat: no-repeat;
        background-position: center;
    }
    /* Efeito ao passar o mouse sobre o botão de fechar */
    .tippy-box[data-theme~='suno'] .tooltip-close:hover {
        opacity: 1;
        transform: scale(1.1);
        background-color: rgba(255, 255, 255, 0.1);
    }
    /* Estilo da seta do tooltip */
    .tippy-box[data-placement^='top'] > .tippy-arrow::before { border-top-color: #1e293b; }
    .tippy-box[data-placement^='bottom'] > .tippy-arrow::before { border-bottom-color: #1e293b; }

    /* Estilo da área de conteúdo do tooltip */
    .tippy-box[data-theme~='suno'] .tooltip-content {
        padding: 1.25rem;
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 0.8rem 1rem;
        align-items: center;
    }
    /* Estilo dos ícones de cada linha de informação */
    .tippy-box[data-theme~='suno'] .tooltip-icon {
        text-align: center;
        font-size: 1.1rem;
        opacity: 0.6;
    }
    `;
    document.head.appendChild(style);
}

let activeTooltip = null;
export function initializeTooltips() {
  injectTooltipStyles();
  if (!window.timeline) {
    console.error('[Tooltip] Inicialização falhou: window.timeline não existe.');
    return;
  }
  window.timeline.off('click');
  window.timeline.on('click', (props) => {
    if (activeTooltip) activeTooltip.hide();
    if (!props.item) return;
    const itemData = window.timeline.itemsData.get(props.item)?.itemData;
    if (!itemData) return;
    const isProject = itemData.hasOwnProperty('tasks') && Array.isArray(itemData.tasks);
    const content = isProject ? renderProjectTooltip(itemData) : renderTaskTooltip(itemData);
    activeTooltip = tippy(document.body, {
      content: content,
      theme: 'suno',
      allowHTML: true,
      interactive: true,
      trigger: 'manual',
      appendTo: document.body,
      getReferenceClientRect: () => ({
        width: 0,
        height: 0,
        top: props.event.clientY,
        right: props.event.clientX,
        bottom: props.event.clientY,
        left: props.event.clientX,
      }),
      onMount(instance) {
        const btn = instance.popper.querySelector('[data-close]');
        if (btn) btn.addEventListener('click', () => instance.hide());
      },
      onDestroy() {
        activeTooltip = null;
      },
    });
    activeTooltip.show();
  });
  console.log('%c[Tooltip] "Ouvinte" de cliques da timeline configurado com sucesso!', 'color: green; font-weight: bold;');
}