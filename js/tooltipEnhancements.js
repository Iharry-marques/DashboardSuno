initSunoTooltips();


// 2) Inject custom **Suno** theme CSS (colors match dashboard)
function injectTooltipStyles() {
  if (document.getElementById('suno-tooltip-theme')) return;
  const style = document.createElement('style');
  style.id = 'suno-tooltip-theme';
  style.textContent = `
  /* Suno Tooltip Theme */
  .tippy-box[data-theme~='suno'] {
    background-color: #0b1624;
    color: #f0f3f8;
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    max-width: 480px;
    padding: 0;
  }
  .tippy-box[data-theme~='suno'][data-placement^='top'] > .tippy-arrow::before { border-top-color: #0b1624; }
  .tippy-box[data-theme~='suno'][data-placement^='bottom'] > .tippy-arrow::before { border-bottom-color: #0b1624; }
  .tippy-box[data-theme~='suno'] .tooltip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: #1a273a;
    font-weight: 600;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  .tippy-box[data-theme~='suno'] .tooltip-header .priority-dot {
    display: inline-block;
    width: 10px; height: 10px;
    border-radius: 50%;
    margin-left: 0.5rem;
  }
  .tippy-box[data-theme~='suno'] .tooltip-content {
    padding: 1rem 1.25rem;
    display: grid;
    grid-template-columns: 24px 1fr;
    gap: 0.5rem 0.75rem;
  }
  .tippy-box[data-theme~='suno'] .tooltip-icon { text-align: center; }
  /* Priority colors */
  .tippy-box[data-theme~='suno'].priority-high  { border-left: 4px solid var(--priority-high); }
  .tippy-box[data-theme~='suno'].priority-medium{ border-left: 4px solid var(--priority-medium);} 
  .tippy-box[data-theme~='suno'].priority-low   { border-left: 4px solid var(--priority-low); }
  .tippy-box[data-theme~='suno'].priority-high  .priority-dot { background: var(--priority-high); }
  .tippy-box[data-theme~='suno'].priority-medium .priority-dot { background: var(--priority-medium); }
  .tippy-box[data-theme~='suno'].priority-low   .priority-dot { background: var(--priority-low); }
  `;
  document.head.appendChild(style);
}

// 3) Main initialisation – attach a tooltip to every Vis item
function initSunoTooltips() {
  injectTooltipStyles();

  // Ensure we only run after the Vis Timeline exists
  if (!window.timeline) {
    console.warn('[SunoTooltips] timeline not found – run init after timeline creation');
    return;
  }

  // Whenever a new item is added or timeline is rendered, (re)bind tooltips
  bindTooltipsForAllItems();
  timeline.on('changed', bindTooltipsForAllItems);
}

function bindTooltipsForAllItems() {
  document.querySelectorAll('.vis-item').forEach(el => {
    // Already has a Tippy instance? skip.
    if (el._tippy) return;

    const itemId = el.dataset.id;
    const task   = timeline.itemsData.get(itemId); // Vis DataSet
    if (!task) return;

    const tooltipHtml = renderTooltipContent(task);
    const priorityCls = `priority-${task.priority || 'medium'}`; // default medium

    tippy(el, {
      theme: `suno ${priorityCls}`,
      allowHTML: true,
      interactive: true,
      maxWidth: 480,
      content: tooltipHtml,
      delay: [50, 0],
      appendTo: document.body
    });
  });
}

// 4) Build tooltip HTML using the task object structure
function renderTooltipContent(task) {
  const fmt = date => new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  return `
    <div class="tooltip-header">
      ${task.title || task.name || 'Tarefa'}
      <span class="priority-dot"></span>
    </div>
    <div class="tooltip-content">
      <span class="tooltip-icon">👤</span><span><strong>Cliente:</strong> ${task.cliente || '—'}</span>
      <span class="tooltip-icon">🧑‍💻</span><span><strong>Responsável:</strong> ${task.responsavel || '—'}</span>
      <span class="tooltip-icon">📅</span><span><strong>Período:</strong> ${fmt(task.start)} → ${fmt(task.end)}</span>
      <span class="tooltip-icon">📌</span><span><strong>Status:</strong> ${task.status || '—'}</span>
      <span class="tooltip-icon">👥</span><span><strong>Equipe:</strong> ${task.equipe || '—'}</span>
      <span class="tooltip-icon">🏷️</span><span><strong>Tipo:</strong> ${task.tipo || '—'}</span>
    </div>`;
}
