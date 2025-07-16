// tooltipEnhancements.js – SUNO Dashboard ✨  v2.4
// ------------------------------------------------------------------
// PATCH 2024‑07‑14 ❯❯  • Elimina tooltips duplicados
//                        • Garante apenas um tooltip visível por vez
//                        • Mantém trigger somente em clique + botão ×
// ------------------------------------------------------------------

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
    const fuzzy = Object.keys(lowerKeys).find(k => k.includes(lc));
    if (fuzzy) {
      const rk = lowerKeys[fuzzy];
      if (obj[rk] !== undefined && obj[rk] !== null && obj[rk] !== "") return obj[rk];
    }
  }
  return "—";
}

function fmtDate(d) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/************************ TOOLTIP TEMPLATE  ************************/
function renderTooltipContent(task) {
  const cliente     = getProp(task, 'cliente', 'client', 'clientnickname');
  const responsavel = getProp(task, 'responsavel', 'responsible', 'taskownerdisplayname');
  const status      = getProp(task, 'status', 'pipelinesteptitle', 'jobstatustitle');
  const equipe      = getProp(task, 'equipe', 'taskownergroupname', 'taskownerfunctiongroupname');
  const tipo        = getProp(task, 'tipo', 'tipotarefa');

  return `
    <div class="tooltip-header">
      ${getProp(task, 'name', 'tasktitle', 'jobtitle', 'tarefa')}
      <span class="priority-dot"></span>
      <button class="tooltip-close" data-close title="Fechar">×</button>
    </div>
    <div class="tooltip-content">
      <span class="tooltip-icon">👤</span><span><strong>Cliente:</strong> ${cliente}</span>
      <span class="tooltip-icon">🧑‍💻</span><span><strong>Responsável:</strong> ${responsavel}</span>
      <span class="tooltip-icon">📅</span><span><strong>Período:</strong> ${fmtDate(task.start || task.taskcreationdate)} → ${fmtDate(task.end || task.currentduedate)}</span>
      <span class="tooltip-icon">📌</span><span><strong>Status:</strong> ${status}</span>
      <span class="tooltip-icon">👥</span><span><strong>Equipe:</strong> ${equipe}</span>
      <span class="tooltip-icon">🏷️</span><span><strong>Tipo:</strong> ${tipo}</span>
    </div>`;
}

/********************* BIND / REBIND FUNCTION  ********************/
function bindTooltipsForAllItems() {
  // LOG 1: Verificando se a função de binding foi chamada
  console.log('[DEBUG-Tooltip] 1. Tentando amarrar tooltips...');

  if (!window.timeline?.itemsData) {
    // LOG 2: Condição de parada foi atingida
    console.error('[DEBUG-Tooltip] 2. FALHA: window.timeline ou window.timeline.itemsData não encontrado. Abortando.');
    return;
  }
  
  console.log('[DEBUG-Tooltip] 2. SUCESSO: window.timeline.itemsData encontrado.', window.timeline.itemsData);

  const container = timeline?.dom?.container || document;

  let rawBars = Array.from(container.querySelectorAll('.vis-item'));
  if (rawBars.length === 0) {
    console.warn('[DEBUG-Tooltip] Seletor ".vis-item" não encontrou nada. Tentando com ".vis-item-content".');
    rawBars = Array.from(container.querySelectorAll('.vis-item-content'));
  }

  // LOG 3: Verificando se elementos visuais foram encontrados
  console.log(`[DEBUG-Tooltip] 3. Encontradas ${rawBars.length} barras de tarefa no DOM.`);

  if (rawBars.length === 0) return; // Se não achou nada, para aqui.

  const bars = Array.from(new Set(rawBars.map(el => el.classList.contains('vis-item') ? el : el.parentElement)));

  bars.forEach((el, index) => {
    if (el._tippy) return; 
    
    // LOG 4: Verificando o ID de uma das barras
    if (index === 0) {
        console.log('[DEBUG-Tooltip] 4. Verificando a primeira barra:', el);
        console.log(`[DEBUG-Tooltip] 4.1. ID da primeira barra (data-id):`, el.dataset.id);
    }
    
    const visItem = timeline.itemsData.get(el.dataset.id);
    if (!visItem) {
      if(index === 0) console.error(`[DEBUG-Tooltip] 5. FALHA: Não foi possível encontrar o item com ID '${el.dataset.id}' no dataset da timeline.`);
      return;
    }
    
    // LOG 5: Sucesso ao encontrar o item
    if (index === 0) console.log(`[DEBUG-Tooltip] 5. SUCESSO: Item com ID '${el.dataset.id}' encontrado nos dados:`, visItem);

    const task = visItem.itemData || visItem;
    const priority = (task.priority || task.Priority || 'medium').toLowerCase();

    tippy(el, {
      theme: `suno priority-${priority}`,
      allowHTML: true,
      interactive: true,
      maxWidth: 640,
      zIndex: 99999,
      delay: [50, 0],
      trigger: 'click',
      hideOnClick: true,
      appendTo: document.body,
      content: renderTooltipContent(task),
      onMount(instance) {
        if(index === 0) console.log('[DEBUG-Tooltip] 6. SUCESSO: Tooltip montado para a primeira barra!');
        const btn = instance.popper.querySelector('[data-close]');
        if (btn) btn.addEventListener('click', () => instance.hide());
      },
    });
  });
}

/***************************** STYLES  ****************************/
function injectTooltipStyles() {
  if (document.getElementById('suno-tooltip-theme')) return;
  const style = document.createElement('style');
  style.id = 'suno-tooltip-theme';
  style.textContent = `
  .tippy-box[data-theme~='suno'] { background:#0b1624; color:#f0f3f8; border:1px solid rgba(255,255,255,0.05); border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.4); max-width:640px; font-size:0.95rem; line-height:1.35; padding:0; z-index:99999; }
  .tippy-box[data-theme~='suno'] .tooltip-header { display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; background:#1a273a; font-weight:600; border-top-left-radius:12px; border-top-right-radius:12px; font-size:1rem; }
  .tippy-box[data-theme~='suno'] .tooltip-close { all:unset; cursor:pointer; font-size:1.1rem; line-height:1; margin-left:0.75rem; opacity:0.6; }
  .tippy-box[data-theme~='suno'] .tooltip-close:hover { opacity:1; }
  .tippy-box[data-placement^='top']>.tippy-arrow::before { border-top-color:#0b1624; }
  .tippy-box[data-placement^='bottom']>.tippy-arrow::before { border-bottom-color:#0b1624; }
  .tippy-box[data-theme~='suno'] .priority-dot { width:12px; height:12px; border-radius:50%; margin-left:0.5rem; }
  .tippy-box[data-theme~='suno'] .tooltip-content { padding:1rem 1.25rem; display:grid; grid-template-columns:28px 1fr; gap:0.6rem 0.8rem; }
  .tippy-box[data-theme~='suno'] .tooltip-icon { text-align:center; }
  `;
  document.head.appendChild(style);
}

/*************************** BOOTSTRAP  ***************************/
function waitForTimeline(cb, retries = 100) {
  // LOG de espera
  console.log('[DEBUG-Tooltip] Aguardando window.timeline...');
  if (window.timeline?.dom?.container) return cb();
  if (retries === 0) {
      console.error('[DEBUG-Tooltip] Tempo de espera esgotado. A timeline não foi encontrada.');
      return;
  };
  setTimeout(() => waitForTimeline(cb, retries - 1), 100);
}

function initSunoTooltips() {
  injectTooltipStyles();
  const rebinder = () => bindTooltipsForAllItems();
  bindTooltipsForAllItems();
  if(window.timeline) {
      console.log("[DEBUG-Tooltip] Amarrando eventos 'changed' e 'draw' na timeline.");
      timeline.on('changed', rebinder);
      timeline.on('draw', rebinder);
  } else {
      console.error("[DEBUG-Tooltip] Não foi possível amarrar eventos 'changed' e 'draw' porque a timeline não existe.");
  }
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