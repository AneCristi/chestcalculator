// Data (from the image)
const ITEMS = [
  { id: 'lvl25_crypt', name: 'Level 25 Crypt', points: 275 },
  { id: 'lvl20_crypt', name: 'Level 20 Crypt', points: 80 },
  { id: 'lvl15_crypt', name: 'Level 15 Crypt', points: 25 },
  { id: 'lvl35_epic_crypt', name: 'Level 35 Epic Crypt', points: 225 },
  { id: 'lvl30_epic_crypt', name: 'Level 30 Epic Crypt', points: 225 },
  { id: 'lvl25_epic_crypt', name: 'Level 25 Epic Crypt', points: 225 },
  { id: 'lvl20_epic_crypt', name: 'Level 20 Epic Crypt', points: 225 },
  { id: 'lvl15_epic_crypt', name: 'Level 15 Epic Crypt', points: 60 },
  { id: 'lvl30_rare_crypt', name: 'Level 30 Rare Crypt', points: 600 },
  { id: 'lvl25_rare_crypt', name: 'Level 25 Rare Crypt', points: 360 },
  { id: 'lvl20_rare_crypt', name: 'Level 20 Rare Crypt', points: 140 },
  { id: 'lvl15_rare_crypt', name: 'Level 15 Rare Crypt', points: 40 },
  { id: 'lvl30_citadel', name: 'Level 30 Citadel', points: 300 },
  { id: 'lvl25_citadel', name: 'Level 25 Citadel', points: 140 },
  { id: 'lvl20_citadel', name: 'Level 20 Citadel', points: 60 },
  { id: 'lvl15_citadel', name: 'Level 15 Citadel', points: 20 },
  { id: 'lvl25_cursed_citadel', name: 'Level 25 Cursed Citadel', points: 140 },
  { id: 'lvl20_cursed_citadel', name: 'Level 20 Cursed Citadel', points: 60 },
];

const STORAGE_KEY = 'cryptPointsTracker.v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { goal: 15000, qty: {} };
    const parsed = JSON.parse(raw);
    return {
      goal: Number.isFinite(parsed.goal) ? parsed.goal : 15000,
      qty: parsed.qty && typeof parsed.qty === 'object' ? parsed.qty : {},
    };
  } catch {
    return { goal: 15000, qty: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clampQty(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function formatInt(n) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function buildTable(state) {
  const body = document.getElementById('itemsBody');
  body.innerHTML = '';

  for (const item of ITEMS) {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = item.name;

    const tdPoints = document.createElement('td');
    tdPoints.className = 'num';
    tdPoints.textContent = formatInt(item.points);

    const tdQty = document.createElement('td');
    tdQty.className = 'qty';

    const controls = document.createElement('div');
    controls.className = 'qty-controls';

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '-';
    minus.setAttribute('aria-label', `Decrease ${item.name}`);

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    input.value = String(clampQty(state.qty[item.id] ?? 0));
    input.setAttribute('aria-label', `Quantity made for ${item.name}`);

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', `Increase ${item.name}`);

    controls.appendChild(minus);
    controls.appendChild(input);
    controls.appendChild(plus);
    tdQty.appendChild(controls);

    const tdTotal = document.createElement('td');
    tdTotal.className = 'num';
    tdTotal.id = `total_${item.id}`;

    tr.appendChild(tdName);
    tr.appendChild(tdPoints);
    tr.appendChild(tdQty);
    tr.appendChild(tdTotal);
    body.appendChild(tr);

    const updateQty = (newVal) => {
      const q = clampQty(newVal);
      state.qty[item.id] = q;
      input.value = String(q);
      saveState(state);
      renderTotals(state);
    };

    minus.addEventListener('click', () => updateQty((Number(input.value) || 0) - 1));
    plus.addEventListener('click', () => updateQty((Number(input.value) || 0) + 1));
    input.addEventListener('change', () => updateQty(Number(input.value)));
    input.addEventListener('input', () => {
      const q = clampQty(Number(input.value));
      state.qty[item.id] = q;
      saveState(state);
      renderTotals(state);
    });
  }
}

function computeTotals(state) {
  let total = 0;
  const perItem = {};
  for (const item of ITEMS) {
    const q = clampQty(state.qty[item.id] ?? 0);
    const t = q * item.points;
    perItem[item.id] = t;
    total += t;
  }
  const goal = Math.max(0, Math.floor(state.goal || 0));
  const missing = Math.max(0, goal - total);
  return { total, missing, goal, perItem };
}

function renderTotals(state) {
  const { total, missing, goal, perItem } = computeTotals(state);

  for (const id of Object.keys(perItem)) {
    const el = document.getElementById(`total_${id}`);
    if (el) el.textContent = formatInt(perItem[id]);
  }

  document.getElementById('totalPoints').textContent = formatInt(total);
  document.getElementById('pointsMissing').textContent = formatInt(missing);
  document.getElementById('goalPoints').textContent = formatInt(goal);

  document.getElementById('totalPointsFooter').textContent = formatInt(total);
  document.getElementById('pointsMissingFooter').textContent = formatInt(missing);

  const missEl = document.getElementById('pointsMissing');
  if (missing > 0) missEl.classList.add('missing-high');
  else missEl.classList.remove('missing-high');
}

function setupControls(state) {
  const resetBtn = document.getElementById('resetBtn');
  const goalInput = document.getElementById('goalInput');
  const exportBtn = document.getElementById('exportBtn');

  goalInput.value = String(Math.max(0, Math.floor(state.goal || 15000)));

  goalInput.addEventListener('change', () => {
    state.goal = Math.max(0, Math.floor(Number(goalInput.value) || 0));
    saveState(state);
    renderTotals(state);
  });

  resetBtn.addEventListener('click', () => {
    state.qty = {};
    saveState(state);
    buildTable(state);
    renderTotals(state);
  });

  exportBtn.addEventListener('click', () => {
    const { total, missing, goal } = computeTotals(state);

    const lines = [];
    lines.push(['Chest Type','Unit points','Quantity made','Total points per item'].join(','));

    for (const item of ITEMS) {
      const q = clampQty(state.qty[item.id] ?? 0);
      const t = q * item.points;
      const safeName = '"' + item.name.replaceAll('"', '""') + '"';
      lines.push([safeName, item.points, q, t].join(','));
    }

    lines.push('');
    lines.push(['Total points', total].join(','));
    lines.push(['Goal', goal].join(','));
    lines.push(['Points missing', missing].join(','));

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'crypt_points.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  });
}

(function init() {
  const state = loadState();
  buildTable(state);
  setupControls(state);
  renderTotals(state);
})();
``
