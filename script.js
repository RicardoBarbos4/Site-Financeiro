/* =============================================
   CONTROLE FINANCEIRO PRO — script.js
   ============================================= */

const STORAGE_KEY      = 'controle_financeiro_pro';
const STORAGE_KEY_CASA = 'controle_financeiro_casa';

const CATEGORY_LABELS = {
  income:  '💰 Salário/Fixo',
  extra:   '🟢 Renda Extra',
  gas:     '⛽ Gasolina',
  market:  '🛒 Mercado',
  expense: '💸 Outros',
  casa:    '🏠 Casa',
};

// Chaves dos itens de casa (mesma ordem do HTML)
const CASA_KEYS = [
  'aluguel', 'condominio', 'desp_op', 'seguro',
  'agua', 'energia', 'internet', 'gas_consumo', 'iptu'
];

// ── ESTADO ──
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ── INICIALIZAÇÃO ──
document.addEventListener('DOMContentLoaded', () => {
  // Define o mês atual como padrão
  document.getElementById('filter-month').value = currentMonthStr();
  updateUI();
});

// ── UTILITÁRIOS ──
function currentMonthStr() {
  return new Date().toISOString().substring(0, 7);
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getSelectedMonth() {
  return document.getElementById('filter-month').value;
}

// ── SALVAR / EDITAR ──
function handleSave() {
  const currentInstallment = document.getElementById('current-installment').value;
const totalInstallments = document.getElementById('total-installments').value;

// Ao criar o objeto da transação, adicione:
const transaction = {
    // ... seus campos antigos ...
    installment: currentInstallment && totalInstallments ? `${currentInstallment}/${totalInstallments}` : ''
};

  if (editId) {
    const index = transactions.findIndex(t => t.id == editId);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], desc, val, type, date };
    }
  } else {
    transactions.push({ id: Date.now(), desc, val, type, date });
  }

  saveAndRefresh();
  clearForm();
}

// ── EDITAR ──
function editItem(id) {
  const item = transactions.find(t => t.id === id);
  if (!item) return;

  document.getElementById('desc').value    = item.desc;
  document.getElementById('val').value     = item.val;
  document.getElementById('type').value    = item.type;
  document.getElementById('edit-id').value = item.id;

  document.getElementById('form-title').innerHTML =
    '<i class="fas fa-pen-to-square"></i> Editar Registro';
  document.getElementById('btn-save').innerHTML =
    '<i class="fas fa-check"></i> Atualizar';
  document.getElementById('btn-cancel').style.display = 'flex';

  // Scroll suave até o formulário
  document.querySelector('.input-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── DELETAR ──
function deleteItem(id) {
  if (!confirm('Remover este registro?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveAndRefresh();
}

// ── LIMPAR FORMULÁRIO ──
function clearForm() {
  document.getElementById('desc').value    = '';
  document.getElementById('val').value     = '';
  document.getElementById('edit-id').value = '';

  document.getElementById('form-title').innerHTML =
    '<i class="fas fa-plus"></i> Novo Registro';
  document.getElementById('btn-save').innerHTML =
    '<i class="fas fa-save"></i> Salvar';
  document.getElementById('btn-cancel').style.display = 'none';
}

// ── PERSISTÊNCIA ──
function saveAndRefresh() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  updateUI();
}

// ── ATUALIZAR INTERFACE ──
function updateUI() {
  const selectedMonth = getSelectedMonth();
  const filtered = transactions.filter(t => t.date === selectedMonth);

  // Calcular totais
  let totalIncome   = 0;
  let totalExpenses = 0;
  let gas           = 0;
  let market        = 0;
  let extra         = 0;
  let casaTotal     = 0;

  filtered.forEach(t => {
    if (t.type === 'income' || t.type === 'extra') {
      totalIncome += t.val;
      if (t.type === 'extra') extra += t.val;
    } else {
      totalExpenses += t.val;
      if (t.type === 'gas')    gas    += t.val;
      if (t.type === 'market') market += t.val;
      if (t.type === 'casa')   casaTotal += t.val;
    }
  });

  // Soma também os valores da seção de casa (despesas fixas)
  const casaData = loadCasaData(selectedMonth);
  const casaFixoTotal = CASA_KEYS.reduce((acc, k) => acc + (casaData[k] || 0), 0);
  casaTotal += casaFixoTotal;
  totalExpenses += casaFixoTotal;

  const balance = totalIncome - totalExpenses;

  // Atualizar cards
  const balanceEl = document.getElementById('total-balance');
  balanceEl.textContent = formatBRL(balance);
  balanceEl.classList.toggle('balance-negative', balance < 0);

  document.getElementById('sum-income').textContent   = formatBRL(totalIncome);
  document.getElementById('sum-expenses').textContent = formatBRL(totalExpenses);
  document.getElementById('sum-gas').textContent      = formatBRL(gas);
  document.getElementById('sum-market').textContent   = formatBRL(market);
  document.getElementById('sum-extra').textContent    = formatBRL(extra);
  document.getElementById('sum-casa').textContent     = formatBRL(casaTotal);

  // Atualizar lista
  renderList(filtered);

  // Atualizar seção casa
  renderCasa(selectedMonth);

  // Atualizar resumo anual
  updateYearlySummary(selectedMonth);
}

// ── RENDERIZAR LISTA ──
function renderList(filtered) {
  const list = document.getElementById('transaction-list');
  list.innerHTML = '';

  const countEl = document.getElementById('transaction-count');
  countEl.textContent = `${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>Nenhum registro neste mês.</p>
      </li>`;
    return;
  }

  // Exibir do mais recente ao mais antigo
  [...filtered].reverse().forEach(t => {
    const li = document.createElement('li');
    li.className = `item ${t.type}`;

    const isIncome = t.type === 'income' || t.type === 'extra';
    const valStr   = `${isIncome ? '+' : '-'} ${formatBRL(t.val)}`;

    // Exemplo de como ficaria a linha na função updateUI:
`<li>
    <div class="info">
        <strong>${item.desc} ${item.installment ? `<small class="installment-badge">(${item.installment})</small>` : ''}</strong>
        <span>${item.category}</span>
    </div>
    <div class="value">${item.value}</div>
 </li>`
  });
}

// ── RESUMO ANUAL ──
function updateYearlySummary(selectedMonth) {
  const yearList    = document.getElementById('year-list');
  const yearLabel   = document.getElementById('year-label');
  const currentYear = selectedMonth.split('-')[0];

  yearLabel.textContent = currentYear;
  yearList.innerHTML    = '';

  const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  for (let i = 1; i <= 12; i++) {
    const monthStr  = `${currentYear}-${String(i).padStart(2, '0')}`;
    const monthData = transactions.filter(t => t.date === monthStr);

    // Inclui despesas fixas de casa no resumo anual
    const casaData     = loadCasaData(monthStr);
    const casaFixoMes  = CASA_KEYS.reduce((acc, k) => acc + (casaData[k] || 0), 0);

    const total = monthData.reduce((acc, t) => {
      return (t.type === 'income' || t.type === 'extra') ? acc + t.val : acc - t.val;
    }, 0) - casaFixoMes;

    const valClass = total > 0 ? 'positive' : total < 0 ? 'negative' : 'zero';
    const isActive = monthStr === selectedMonth;

    const div = document.createElement('div');
    div.className = `month-card${isActive ? ' active' : ''}`;
    div.innerHTML = `
      <span class="month-name">${MONTH_NAMES[i - 1]}</span>
      <span class="month-val ${valClass}">${formatBRL(total)}</span>`;

    div.addEventListener('click', () => {
      document.getElementById('filter-month').value = monthStr;
      updateUI();
    });

    yearList.appendChild(div);
  }
}

// ── DESPESAS DA CASA ──

function getCasaStorageKey(month) {
  return `${STORAGE_KEY_CASA}_${month}`;
}

function loadCasaData(month) {
  return JSON.parse(localStorage.getItem(getCasaStorageKey(month))) || {};
}

function saveCasaData(month, data) {
  localStorage.setItem(getCasaStorageKey(month), JSON.stringify(data));
}

function saveCasa() {
  const month   = getSelectedMonth();
  const items   = document.querySelectorAll('#casa-grid .casa-item');
  const data    = {};

  items.forEach(item => {
    const key   = item.dataset.key;
    const input = item.querySelector('.casa-input');
    const val   = parseFloat(input.value);
    data[key]   = isNaN(val) || val < 0 ? 0 : val;

    // Atualiza o valor exibido ao lado
    const display = item.querySelector('.casa-item-val');
    display.textContent = data[key] > 0 ? formatBRL(data[key]) : '—';
  });

  saveCasaData(month, data);
  updateUI(); // recalcula totais e saldo
}

function renderCasa(month) {
  const data  = loadCasaData(month);
  const items = document.querySelectorAll('#casa-grid .casa-item');

  let total = 0;

  items.forEach(item => {
    const key     = item.dataset.key;
    const input   = item.querySelector('.casa-input');
    const display = item.querySelector('.casa-item-val');
    const val     = data[key] || 0;

    input.value             = val > 0 ? val : '';
    display.textContent     = val > 0 ? formatBRL(val) : '—';
    total += val;
  });

  // Atualiza o total exibido na seção
  const totalEl = document.getElementById('casa-total-display');
  if (totalEl) {
    totalEl.textContent = formatBRL(total);
    totalEl.style.color = total > 0 ? '#14b8a6' : 'var(--text-sub)';
  }

  // Label do mês na seção
  const labelEl = document.getElementById('casa-month-label');
  if (labelEl) {
    const [year, mon] = month.split('-');
    const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    labelEl.textContent = `${MONTH_NAMES[parseInt(mon) - 1]}/${year}`;
  }
}