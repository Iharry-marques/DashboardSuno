// tooltipEnhancements.js – v5.2 FINAL (Correção de Coordenadas)
console.log('[Tooltip] Módulo carregado (v5.2 - Event-Driven)');

// Funções de template e helpers (sem alterações)
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
  return `<div class="tooltip-header">${getProp(task, 'content', 'tasktitle')}<button class="tooltip-close" data-close title="Fechar">×</button></div><div class="tooltip-content"><span class="tooltip-icon">👤</span><span><strong>Cliente:</strong> ${getProp(task, 'client')}</span><span class="tooltip-icon">🧑‍💻</span><span><strong>Responsável:</strong> ${getProp(task, 'responsible', 'taskownerdisplayname')}</span><span class="tooltip-icon">📅</span><span><strong>Período:</strong> ${fmtDate(task.start)} → ${fmtDate(task.end)}</span><span class="tooltip-icon">📌</span><span><strong>Status:</strong> ${getProp(task, 'status', 'pipelinesteptitle')}</span><span class="tooltip-icon">👥</span><span><strong>Equipe:</strong> ${getProp(task, 'area', 'group', 'taskownerfunctiongroupname')}</span></div>`;
}
function renderProjectTooltip(project) {
  const equipes = Array.isArray(project.groups) ? [...project.groups].join(', ') : 'N/A';
  return `<div class="tooltip-header">${getProp(project, 'name', 'projeto')}<button class="tooltip-close" data-close title="Fechar">×</button></div><div class="tooltip-content"><span class="tooltip-icon">🏢</span><span><strong>Cliente:</strong> ${getProp(project, 'client')}</span><span class="tooltip-icon">👥</span><span><strong>Equipes:</strong> ${equipes}</span><span class="tooltip-icon">📅</span><span><strong>Período:</strong> ${fmtDate(project.start)} → ${fmtDate(project.end)}</span><span class="tooltip-icon">📊</span><span><strong>Tarefas:</strong> ${project.tasks?.length || 0}</span></div>`;
}
function injectTooltipStyles() {
    if (document.getElementById('suno-tooltip-theme')) return;
    const style = document.createElement('style');
    style.id = 'suno-tooltip-theme';
    style.textContent = `.tippy-box[data-theme~='suno']{background:#0b1624;color:#f0f3f8;border:1px solid rgba(255,255,255,.1);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);font-size:.95rem;line-height:1.4;padding:0;z-index:99999}.tippy-box[data-theme~='suno'] .tooltip-header{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1.25rem;background:#1a273a;font-weight:600;border-top-left-radius:12px;border-top-right-radius:12px;font-size:1rem;border-bottom:1px solid rgba(255,255,255,.1)}.tippy-box[data-theme~='suno'] .tooltip-close{all:unset;cursor:pointer;font-size:1.2rem;line-height:1;margin-left:1rem;opacity:.6;transition:all .2s ease}.tippy-box[data-theme~='suno'] .tooltip-close:hover{opacity:1;transform:scale(1.1) rotate(90deg)}.tippy-box[data-placement^='top']>.tippy-arrow::before{border-top-color:#1a273a}.tippy-box[data-placement^='bottom']>.tippy-arrow::before{border-bottom-color:#0b1624}.tippy-box[data-theme~='suno'] .tooltip-content{padding:1.25rem;display:grid;grid-template-columns:28px 1fr;gap:.75rem 1rem;align-items:center}.tippy-box[data-theme~='suno'] .tooltip-icon{text-align:center;font-size:1.1rem;opacity:.7}`;
    document.head.appendChild(style);
}

// ---- LÓGICA PRINCIPAL ----
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
      allowHTML: true,
      interactive: true,
      trigger: 'manual',
      appendTo: document.body,
      // ✅ CORREÇÃO APLICADA AQUI
      // Usamos as coordenadas do evento do mouse diretamente.
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