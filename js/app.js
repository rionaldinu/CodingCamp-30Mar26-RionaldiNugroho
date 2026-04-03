// ── State ──────────────────────────────────────────────────────────────
let transactions = JSON.parse(localStorage.getItem('txData') || '[]');

// ── DOM ────────────────────────────────────────────────────────────────
const form        = document.getElementById('transactionForm');
const itemNameEl  = document.getElementById('itemName');
const amountEl    = document.getElementById('amount');
const categoryEl  = document.getElementById('category');
const customCatEl = document.getElementById('customCategory');
const sortEl      = document.getElementById('sortSelect');
const errorEl     = document.getElementById('formError');
const totalEl     = document.getElementById('totalBalance');
const listEl      = document.getElementById('transactionList');
const themeBtn    = document.getElementById('themeToggle');

// ── Theme ──────────────────────────────────────────────────────────────
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

themeBtn.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
  updateChart();
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeBtn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// ── Chart ──────────────────────────────────────────────────────────────
const COLORS = ['#4f46e5','#06b6d4','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#f97316'];
const pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
  type: 'pie',
  data: { labels: [], datasets: [{ data: [], backgroundColor: COLORS }] },
  options: {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { color: '#64748b' } } }
  }
});

// ── Add transaction ────────────────────────────────────────────────────
form.addEventListener('submit', (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const name   = itemNameEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const cat    = customCatEl.value.trim() || categoryEl.value;

  if (!name || !amount || amount <= 0 || !cat) {
    errorEl.textContent = 'Please fill in all fields with a valid amount.';
    return;
  }

  transactions.push({ id: Date.now(), name, amount, category: cat });
  save();
  render();
  form.reset();
});

// ── Delete transaction ─────────────────────────────────────────────────
listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  transactions = transactions.filter(t => t.id !== Number(btn.dataset.id));
  save();
  render();
});

// ── Sort ───────────────────────────────────────────────────────────────
sortEl.addEventListener('change', render);

function getSorted() {
  const copy = [...transactions];
  if (sortEl.value === 'highest') return copy.sort((a, b) => b.amount - a.amount);
  if (sortEl.value === 'lowest')  return copy.sort((a, b) => a.amount - b.amount);
  return copy.reverse(); // newest first
}

// ── Render ─────────────────────────────────────────────────────────────
function render() {
  // Total
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  totalEl.textContent = 'Rp ' + total.toLocaleString('id-ID');

  // List
  const sorted = getSorted();
  if (sorted.length === 0) {
    listEl.innerHTML = '<li class="empty-msg">No transactions yet.</li>';
  } else {
    listEl.innerHTML = sorted.map(t => `
      <li>
        <div class="tx-info">
          <span class="tx-name">${esc(t.name)}</span>
          <span class="tx-meta">${esc(t.category)}</span>
        </div>
        <span class="tx-amount">Rp ${t.amount.toLocaleString('id-ID')}</span>
        <button class="delete-btn" data-id="${t.id}" aria-label="Delete">🗑️</button>
      </li>
    `).join('');
  }

  updateChart();
}

function updateChart() {
  const totals = {};
  transactions.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });

  const labelColor = getComputedStyle(document.documentElement).getPropertyValue('--sub').trim();
  pieChart.data.labels = Object.keys(totals);
  pieChart.data.datasets[0].data = Object.values(totals);
  pieChart.options.plugins.legend.labels.color = labelColor;
  pieChart.update();
}

// ── Helpers ────────────────────────────────────────────────────────────
function save() { localStorage.setItem('txData', JSON.stringify(transactions)); }
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ───────────────────────────────────────────────────────────────
render();
