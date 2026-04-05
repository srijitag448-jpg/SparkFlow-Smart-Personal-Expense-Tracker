let currentUser = null;
let transactions = [];
let categoryChart = null;
let trendChart = null;

const EXPENSE_CATEGORIES = [
    { value: 'Food',          label: '🍔 Food' },
    { value: 'Transport',     label: '🚗 Transport' },
    { value: 'Shopping',      label: '🛍️ Shopping' },
    { value: 'Bills',         label: '💡 Bills' },
    { value: 'Entertainment', label: '🎬 Entertainment' },
    { value: 'Other',         label: '📌 Other' },
];

const INCOME_CATEGORIES = [
    { value: 'Salary',     label: '💼 Salary' },
    { value: 'Freelance',  label: '💻 Freelance' },
    { value: 'Investment', label: '📈 Investment' },
    { value: 'Gift',       label: '🎁 Gift' },
    { value: 'Other',      label: '📌 Other' },
];

const CHART_COLORS = ['#f97316', '#3b82f6', '#10b981', '#facc15', '#a855f7', '#ef4444', '#64748b'];

function loadUserData(username) {
    const saved = localStorage.getItem(`expenses_${username}`);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            transactions = Array.isArray(parsed) ? parsed : [];
        } catch {
            transactions = [];
        }
    } else {
        transactions = generateDemoData();
    }
    renderAll();
}

function saveUserData(username) {
    localStorage.setItem(`expenses_${username}`, JSON.stringify(transactions));
}

function generateDemoData() {
    const demo = [];
    const expCats = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setDate(today.getDate() - Math.floor(Math.random() * 10));
        const isExpense = Math.random() > 0.3;
        const amount = isExpense
            ? parseFloat((Math.random() * 80 + 5).toFixed(2))
            : parseFloat((Math.random() * 300 + 100).toFixed(2));
        const type = isExpense ? 'expense' : 'income';
        const category = isExpense ? expCats[Math.floor(Math.random() * expCats.length)] : 'Salary';
        demo.push({
            id: crypto.randomUUID(),
            desc: isExpense ? `Purchase ${i + 1}` : 'Deposit',
            amount, type, category,
            date: date.toISOString().split('T')[0],
        });
    }

    const todayStr = today.toISOString().split('T')[0];
    demo.push({ id: crypto.randomUUID(), desc: 'Grocery',  amount: 45.50, type: 'expense', category: 'Food',   date: todayStr });
    demo.push({ id: crypto.randomUUID(), desc: 'Freelance', amount: 420,  type: 'income',  category: 'Salary', date: todayStr });
    return demo;
}

function computeStats() {
    let totalExp = 0, totalInc = 0;
    transactions.forEach(t => {
        if (t.type === 'expense') totalExp += t.amount;
        else totalInc += t.amount;
    });
    return {
        totalExpenses: totalExp,
        totalIncome: totalInc,
        balance: totalInc - totalExp,
        count: transactions.length,
    };
}

function renderAll() {
    if (!currentUser) return;
    const s = computeStats();
    document.getElementById('totalBalance').textContent  = `$${s.balance.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${s.totalExpenses.toFixed(2)}`;
    document.getElementById('totalIncome').textContent   = `$${s.totalIncome.toFixed(2)}`;
    document.getElementById('txnCount').textContent      = s.count;
    renderTransactionsList();
    updateCharts();
}

function renderTransactionsList() {
    const container = document.getElementById('transactionsList');
    if (!transactions.length) {
        container.innerHTML = '<div class="empty-msg"><i class="fas fa-coins"></i> No records yet, start adding!</div>';
        return;
    }

    const ascending = [...transactions].sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return 0;
    });

    let running = 0;
    ascending.forEach(t => {
        running += t.type === 'income' ? t.amount : -t.amount;
        t._bal = running;
    });

    const sorted = [...ascending].reverse();
    const groups = new Map();
    sorted.forEach(t => {
        if (!groups.has(t.date)) groups.set(t.date, []);
        groups.get(t.date).push(t);
    });

    let html = `<table class="txn-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th class="col-r">Amount</th>
                <th class="col-r">Balance</th>
                <th></th>
            </tr>
        </thead>
        <tbody>`;

    groups.forEach((txns, date) => {
        html += `<tr class="txn-date-row"><td colspan="6">${formatDate(date)}</td></tr>`;
        txns.forEach(t => {
            const sign    = t.type === 'expense' ? '−' : '+';
            const amtCls  = t.type === 'expense' ? 'expense-amount--red' : 'expense-amount--green';
            const balCls  = t._bal >= 0 ? 'bal-pos' : 'bal-neg';
            const typeTag = t.type === 'expense'
                ? '<span class="type-tag expense-tag">▼ expense</span>'
                : '<span class="type-tag income-tag">▲ income</span>';
            html += `<tr class="txn-row">
                <td class="txn-desc">${escapeHtml(t.desc)}</td>
                <td><span class="expense-cat"><i class="fas fa-folder-open" aria-hidden="true"></i> ${escapeHtml(t.category)}</span></td>
                <td>${typeTag}</td>
                <td class="col-r txn-amount ${amtCls}">${sign}$${Math.abs(t.amount).toFixed(2)}</td>
                <td class="col-r txn-balance ${balCls}">$${t._bal.toFixed(2)}</td>
                <td class="col-c"><button class="delete-expense" data-id="${t.id}" aria-label="Delete ${escapeHtml(t.desc)}"><i class="fas fa-trash-alt"></i></button></td>
            </tr>`;
        });
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    container.querySelectorAll('.delete-expense').forEach(btn => {
        btn.addEventListener('click', () => deleteTransactionById(btn.getAttribute('data-id')));
    });
}

function formatDate(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (dateStr === today) return `Today, ${label}`;
    if (dateStr === yest) return `Yesterday, ${label}`;
    return label;
}

function addTransaction(desc, amount, type, category) {
    if (isNaN(amount) || amount <= 0) return false;
    transactions.push({
        id: crypto.randomUUID(),
        desc: desc.trim() || 'Untitled',
        amount: parseFloat(amount),
        type, category,
        date: new Date().toISOString().split('T')[0],
    });
    saveUserData(currentUser);
    renderAll();
    showToast(`✅ ${type === 'expense' ? 'Expense' : 'Income'} added!`);
    return true;
}

function deleteTransactionById(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveUserData(currentUser);
    renderAll();
    showToast('🗑️ Entry deleted');
}

function buildChartData() {
    const catMap = new Map();
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount));

    const categories     = Array.from(catMap.keys());
    const expenseAmounts = categories.map(c => catMap.get(c));

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }
    const dailyExpense = new Array(7).fill(0);
    transactions.forEach(t => {
        if (t.type === 'expense' && t.date) {
            const idx = last7Days.indexOf(t.date);
            if (idx !== -1) dailyExpense[idx] += t.amount;
        }
    });
    return { categories, expenseAmounts, last7Days, dailyExpense };
}

function updateCharts() {
    const { categories, expenseAmounts, last7Days, dailyExpense } = buildChartData();
    const pieLabels = categories.length ? categories : ['No Data'];
    const pieData   = categories.length ? expenseAmounts : [1];

    if (!categoryChart) {
        categoryChart = new Chart(document.getElementById('categoryChart').getContext('2d'), {
            type: 'doughnut',
            data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: CHART_COLORS, borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } },
        });
    } else {
        categoryChart.data.labels           = pieLabels;
        categoryChart.data.datasets[0].data = pieData;
        categoryChart.update();
    }

    if (!trendChart) {
        trendChart = new Chart(document.getElementById('trendChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: last7Days.map(d => d.slice(5)),
                datasets: [{
                    label: 'Daily Expenses ($)',
                    data: dailyExpense,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#f97316',
                }],
            },
            options: { responsive: true, maintainAspectRatio: true },
        });
    } else {
        trendChart.data.datasets[0].data = dailyExpense;
        trendChart.update();
    }
}

function login(name) {
    if (!name || !name.trim()) return false;
    currentUser = name.trim().toLowerCase();
    localStorage.setItem('spark_current_user', currentUser);
    loadUserData(currentUser);

    document.getElementById('loginSection').style.display    = 'none';
    document.getElementById('trackerDashboard').style.display = 'block';
    document.getElementById('globalLogoutBtn').style.display  = 'inline-block';

    const greetingSpan = document.getElementById('greetingUser');
    greetingSpan.innerHTML = '<i class="fas fa-user-astronaut"></i> ';
    greetingSpan.appendChild(document.createTextNode(currentUser.split('@')[0]));
    return true;
}

function logout() {
    currentUser = null;
    transactions = [];
    localStorage.removeItem('spark_current_user');

    document.getElementById('loginSection').style.display    = 'block';
    document.getElementById('trackerDashboard').style.display = 'none';
    document.getElementById('globalLogoutBtn').style.display  = 'none';
    document.getElementById('greetingUser').textContent = 'Guest';

    if (categoryChart) { categoryChart.destroy(); categoryChart = null; }
    if (trendChart)    { trendChart.destroy();    trendChart    = null; }
}

function checkAutoLogin() {
    const saved = localStorage.getItem('spark_current_user');
    if (saved) {
        login(saved);
    } else {
        document.getElementById('loginSection').style.display    = 'block';
        document.getElementById('trackerDashboard').style.display = 'none';
    }
}

function updateCategoryOptions() {
    const type = document.getElementById('typeSelect').value;
    const cats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    document.getElementById('categorySelect').innerHTML =
        cats.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]
    );
}

function showToast(msg) {
    const toast = document.getElementById('toastMsg');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
}

document.getElementById('loginBtn').addEventListener('click', () => {
    const name = document.getElementById('loginEmail').value;
    if (!name.trim()) { alert('Please enter your name or email to continue.'); return; }
    login(name);
});

document.getElementById('loginEmail').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('globalLogoutBtn').addEventListener('click', logout);
document.getElementById('typeSelect').addEventListener('change', updateCategoryOptions);

document.getElementById('addTransactionForm').addEventListener('submit', e => {
    e.preventDefault();
    const desc     = document.getElementById('descInput').value;
    const amount   = parseFloat(document.getElementById('amountInput').value);
    const type     = document.getElementById('typeSelect').value;
    const category = document.getElementById('categorySelect').value;
    if (isNaN(amount) || amount <= 0) { alert('Please enter a valid positive amount.'); return; }
    addTransaction(desc, amount, type, category);
    document.getElementById('descInput').value   = '';
    document.getElementById('amountInput').value = '';
});

updateCategoryOptions();
checkAutoLogin();
