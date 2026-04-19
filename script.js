let transactions = JSON.parse(localStorage.getItem('minhas_financas')) || [];

function handleSave() {
    const desc = document.getElementById('desc').value;
    const val = parseFloat(document.getElementById('val').value);
    const type = document.getElementById('type').value;
    const editId = document.getElementById('edit-id').value;

    if (!desc || isNaN(val)) return alert("Preencha descrição e valor!");

    if (editId) {
        const index = transactions.findIndex(t => t.id == editId);
        transactions[index] = { ...transactions[index], desc, val, type };
    } else {
        transactions.push({ id: Date.now(), desc, val, type });
    }

    saveAndRefresh();
    clearForm();
}

function saveAndRefresh() {
    localStorage.setItem('minhas_financas', JSON.stringify(transactions));
    updateUI();
}

function updateUI() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = "";
    
    // Variáveis de soma
    let balance = 0, gas = 0, market = 0, extra = 0;

    transactions.forEach(t => {
        // Lógica de Soma por Categoria
        if (t.type === 'income' || t.type === 'extra') {
            balance += t.val;
            if (t.type === 'extra') extra += t.val;
        } else {
            balance -= t.val;
            if (t.type === 'gas') gas += t.val;
            if (t.type === 'market') market += t.val;
        }

        const li = document.createElement('li');
        li.className = `item ${t.type}`;
        li.innerHTML = `
            <div>
                <small>${t.type.toUpperCase()}</small><br>
                <span>${t.desc}</span><br>
                <strong>R$ ${t.val.toFixed(2)}</strong>
            </div>
            <div class="actions">
                <i class="fas fa-edit" onclick="editItem(${t.id})"></i>
                <i class="fas fa-trash" onclick="deleteItem(${t.id})"></i>
            </div>
        `;
        list.appendChild(li);
    });

    // Atualiza os cards
    document.getElementById('total-balance').innerText = `R$ ${balance.toFixed(2)}`;
    document.getElementById('sum-gas').innerText = `R$ ${gas.toFixed(2)}`;
    document.getElementById('sum-market').innerText = `R$ ${market.toFixed(2)}`;
    document.getElementById('sum-extra').innerText = `R$ ${extra.toFixed(2)}`;
}

// Reutilize as funções editItem, deleteItem e clearForm do código anterior
function editItem(id) {
    const item = transactions.find(t => t.id === id);
    document.getElementById('desc').value = item.desc;
    document.getElementById('val').value = item.val;
    document.getElementById('type').value = item.type;
    document.getElementById('edit-id').value = item.id;
    document.getElementById('btn-save').innerText = "Atualizar";
    document.getElementById('btn-cancel').style.display = "block";
}

function deleteItem(id) {
    if(confirm("Remover este registro?")) {
        transactions = transactions.filter(t => t.id !== id);
        saveAndRefresh();
    }
}

function clearForm() {
    document.getElementById('desc').value = "";
    document.getElementById('val').value = "";
    document.getElementById('edit-id').value = "";
    document.getElementById('btn-save').innerText = "Salvar";
    document.getElementById('btn-cancel').style.display = "none";
}

updateUI();


// Define o mês atual como padrão no filtro ao carregar
document.getElementById('filter-month').value = new Date().toISOString().substring(0, 7);

let transactions = JSON.parse(localStorage.getItem('minhas_financas')) || [];

function handleSave() {
    const desc = document.getElementById('desc').value;
    const val = parseFloat(document.getElementById('val').value);
    const type = document.getElementById('type').value;
    const date = document.getElementById('filter-month').value; // Salva no mês selecionado
    const editId = document.getElementById('edit-id').value;

    if (!desc || isNaN(val)) return alert("Preencha tudo!");

    if (editId) {
        const index = transactions.findIndex(t => t.id == editId);
        transactions[index] = { ...transactions[index], desc, val, type, date };
    } else {
        // Adiciona a data (mês/ano) ao registro
        transactions.push({ id: Date.now(), desc, val, type, date });
    }

    saveAndRefresh();
    clearForm();
}

function updateUI() {
    const list = document.getElementById('transaction-list');
    const selectedMonth = document.getElementById('filter-month').value;
    list.innerHTML = "";
    
    let balance = 0, gas = 0, market = 0, extra = 0;

    // 1. Filtrar transações do mês selecionado para a lista
    const filtered = transactions.filter(t => t.date === selectedMonth);

    filtered.forEach(t => {
        if (t.type === 'income' || t.type === 'extra') {
            balance += t.val;
            if (t.type === 'extra') extra += t.val;
        } else {
            balance -= t.val;
            if (t.type === 'gas') gas += t.val;
            if (t.type === 'market') market += t.val;
        }

        const li = document.createElement('li');
        li.className = `item ${t.type}`;
        li.innerHTML = `
            <div>
                <span>${t.desc}</span><br>
                <strong>R$ ${t.val.toFixed(2)}</strong>
            </div>
            <div class="actions">
                <i class="fas fa-edit" onclick="editItem(${t.id})"></i>
                <i class="fas fa-trash" onclick="deleteItem(${t.id})"></i>
            </div>
        `;
        list.appendChild(li);
    });

    // Atualiza cards do mês
    document.getElementById('total-balance').innerText = `R$ ${balance.toFixed(2)}`;
    document.getElementById('sum-gas').innerText = `R$ ${gas.toFixed(2)}`;
    document.getElementById('sum-market').innerText = `R$ ${market.toFixed(2)}`;
    document.getElementById('sum-extra').innerText = `R$ ${extra.toFixed(2)}`;

    updateYearlySummary();
}

function updateYearlySummary() {
    const yearList = document.getElementById('year-list');
    yearList.innerHTML = "";
    
    const currentYear = document.getElementById('filter-month').value.split('-')[0];
    
    // Criar um resumo para cada um dos 12 meses
    for (let i = 1; i <= 12; i++) {
        const monthStr = `${currentYear}-${String(i).padStart(2, '0')}`;
        const monthData = transactions.filter(t => t.date === monthStr);
        
        let monthTotal = monthData.reduce((acc, t) => {
            return (t.type === 'income' || t.type === 'extra') ? acc + t.val : acc - t.val;
        }, 0);

        const div = document.createElement('div');
        div.className = "month-card";
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        div.innerHTML = `
            <span>${monthNames[i-1]}</span>
            <strong style="color: ${monthTotal >= 0 ? '#04d361' : '#f75a68'}">
                R$ ${monthTotal.toFixed(2)}
            </strong>
        `;
        yearList.appendChild(div);
    }
}

// Chame updateUI() ao final do script
updateUI();