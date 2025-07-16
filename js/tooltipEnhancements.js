

/**************************** HELPERS  *****************************/
function getProp(obj, ...candidates) {
  for (const k of candidates) {
    if (obj?.[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  const lowerKeys = Object.keys(obj || {}).reduce((m, k) => { m[k.toLowerCase()] = k; return m; }, {});
  for (const c of candidates) {
    const lc = c.toLowerCase();
    if (lowerKeys[lc]) {
      const rk = lowerKeys[lc];
      if (obj[rk] !== undefined && obj[rk] !== null && obj[rk] !== "") return obj[rk];
    }
  }
  return "—";
}

function fmtDate(d) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/************************ TOOLTIP TEMPLATES  ************************/
// Template para TAREFAS (página Por Equipe)
function renderTaskTooltip(task) {
  return `
    <div class="tooltip-header">
      ${getProp(task, 'name', 'content', 'tasktitle')}
      <button class="tooltip-close" data-close title="Fechar">×</button>
    </div>
    <div class="tooltip-content">
      <span class="tooltip-icon">👤</span><span><strong>Cliente:</strong> ${getProp(task, 'client', 'cliente')}</span>
      <span class="tooltip-icon">🧑‍💻</span><span><strong>Responsável:</strong> ${getProp(task, 'responsible', 'taskownerdisplayname')}</span>
      <span class="tooltip-icon">📅</span><span><strong>Período:</strong> ${fmtDate(task.start)} → ${fmtDate(task.end)}</span>
      <span class="tooltip-icon">📌</span><span><strong>Status:</strong> ${getProp(task, 'status', 'pipelinesteptitle')}</span>
      <span class="tooltip-icon">👥</span><span><strong>Equipe:</strong> ${getProp(task, 'area', 'taskownerfunctiongroupname')}</span>
      <span class="tooltip-icon">🏷️</span><span><strong>Tipo:</strong> ${getProp(task, 'tipo', 'tipotarefa')}</span>
    </div>`;
}

// NOVO: Template para PROJETOS (página Por Cliente)
function renderProjectTooltip(project) {
  const equipes = Array.isArray(project.groups) && project.groups.length > 0
    ? project.groups.join(', ')
    : 'N/A';

  return `
    <div class="tooltip-header">
      ${getProp(project, 'name', 'projeto')}
      <button class="tooltip-close" data-close title="Fechar">×</button>
    </div>
    <div class="tooltip-content">
        <span class="tooltip-icon">🏢</span><span><strong>Cliente:</strong> ${getProp(project, 'client', 'cliente')}</span>
        <span class="tooltip-icon">👥</span><span><strong>Equipes Envolvidas:</strong> ${equipes}</span>
        <span class="tooltip-icon">📅</span><span><strong>Período Total:</strong> ${fmtDate(project.start)} → ${fmtDate(project.end)}</span>
        <span class="tooltip-icon">📊</span><span><strong>Qtd. de Tarefas:</strong> ${project.tasks?.length || 0}</span>
    </div>`;
}

/********************* BIND / REBIND FUNCTION  ********************/
function bindTooltipsForAllItems() {
  if (!window.timeline?.itemsData) return;

  const container = timeline.dom.container || document;
  let rawBars = Array.from(container.querySelectorAll('.vis-item:not(.vis-background)'));
  if (rawBars.length === 0) {
      rawBars = Array.from(container.querySelectorAll('.vis-item-content'));
  }

  const bars = Array.from(new Set(rawBars.map(el => el.classList.contains('vis-item') ? el : el.closest('.vis-item'))));

  bars.forEach(el => {
    if (el._tippy || !el.dataset.id) return;
    const visItem = timeline.itemsData.get(el.dataset.id);
    if (!visItem) return;

    const itemData = visItem.itemData || visItem;
    const priority = (itemData.priority || 'medium').toLowerCase();
    
    // Detecta se o item é um projeto ou uma tarefa e escolhe o template correto
    const isProject = Array.isArray(itemData.tasks);
    const content = isProject ? renderProjectTooltip(itemData) : renderTaskTooltip(itemData);

    tippy(el, {
      theme: `suno priority-${priority}`,
      allowHTML: true,
      interactive: true,
      maxWidth: 640,
      zIndex: 99999,
      delay: [50, 0],
      trigger: 'click',
      appendTo: document.body,
      content: content, // Usa o conteúdo gerado dinamicamente
      onMount(instance) {
        const btn = instance.popper.querySelector('[data-close]');
        if (btn) btn.addEventListener('click', () => instance.hide());
      },
    });
  });

  // SINGLETON: apenas um tooltip aberto por vez
  const instances = bars.map(el => el._tippy).filter(Boolean);
  if (instances.length > 0) {
    if (!bindTooltipsForAllItems._singleton) {
      bindTooltipsForAllItems._singleton = tippy.createSingleton(instances, { 
          moveTransition: 'transform 0.2s ease',
          onShow() {
              document.body.classList.add('tooltip-active');
          },
          onHide() {
              document.body.classList.remove('tooltip-active');
          }
       });
    } else {
      bindTooltipsForAllItems._singleton.setInstances(instances);
    }
  }
}

/***************************** STYLES  ****************************/
function injectTooltipStyles() {
  if (document.getElementById('suno-tooltip-theme')) return;
  const style = document.createElement('style');
  style.id = 'suno-tooltip-theme';
  style.textContent = `
  .tippy-box[data-theme~='suno'] { background:#0b1624; color:#f0f3f8; border:1px solid rgba(255,255,255,0.1); border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.5); font-size:0.95rem; line-height:1.4; padding:0; z-index:99999; }
  .tippy-box[data-theme~='suno'] .tooltip-header { display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1.25rem; background:#1a273a; font-weight:600; border-top-left-radius:12px; border-top-right-radius:12px; font-size:1rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .tippy-box[data-theme~='suno'] .tooltip-close { all:unset; cursor:pointer; font-size:1.2rem; line-height:1; margin-left:1rem; opacity:0.6; transition: all 0.2s ease; }
  .tippy-box[data-theme~='suno'] .tooltip-close:hover { opacity:1; transform: scale(1.1) rotate(90deg); }
  .tippy-box[data-placement^='top']>.tippy-arrow::before { border-top-color:#1a273a; }
  .tippy-box[data-placement^='bottom']>.tippy-arrow::before { border-bottom-color:#0b1624; }
  .tippy-box[data-theme~='suno'] .tooltip-content { padding:1.25rem; display:grid; grid-template-columns:28px 1fr; gap:0.75rem 1rem; align-items:center; }
  .tippy-box[data-theme~='suno'] .tooltip-icon { text-align:center; font-size: 1.1rem; opacity: 0.7; }
  `;
  document.head.appendChild(style);
}

/*************************** BOOTSTRAP  ***************************/
function waitForTimeline(cb, retries = 100) {
  if (window.timeline?.dom?.container) return cb();
  if (retries === 0) return;
  setTimeout(() => waitForTimeline(cb, retries - 1), 100);
}

function initSunoTooltips() {
  injectTooltipStyles();
  const rebinder = () => bindTooltipsForAllItems();
  bindTooltipsForAllItems();
  timeline?.on?.('changed', rebinder);
  timeline?.on?.('draw', rebinder);
}

function loadTippyIfNeeded(cb) {
  if (window.tippy && window.tippy.createSingleton) return cb();
  const popper = document.createElement('script');
  popper.src = 'https://unpkg.com/@popperjs/core@2/dist/umd/popper.min.js';
  popper.onload = () => {
    const tippyScript = document.createElement('script');
    tippyScript.src = 'https://unpkg.com/tippy.js@6/dist/tippy-bundle.umd.min.js';
    tippyScript.onload = cb;
    document.head.appendChild(tippyScript);
  };
  document.head.appendChild(popper);
}

loadTippyIfNeeded(() => waitForTimeline(initSunoTooltips));