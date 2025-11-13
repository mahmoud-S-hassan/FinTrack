/* =========================================================
   FinTrack – Final Production Build
   Author: Mahmoud Salah
   Features: Responsive, PWA, PIN, Budgets, CSV, Recurrent, Tour, PTR, Auto-Backup
   ========================================================= */

/* ---------- Mock Data ---------- */
const categories = {
    income: ['Salary', 'Freelance', 'Gift'],
    expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Other']
};
const sampleTx = [
    { date: '2025-09-01', type: 'income', category: 'Salary', amount: 1200, notes: 'September salary', recurrent: false },
    { date: '2025-09-02', type: 'expense', category: 'Food', amount: 45, notes: 'Weekly groceries', recurrent: false },
    { date: '2025-09-05', type: 'expense', category: 'Transport', amount: 30, notes: 'Metro card', recurrent: false },
    { date: '2025-09-10', type: 'income', category: 'Freelance', amount: 350, notes: 'Web-app UI', recurrent: false },
    { date: '2025-09-12', type: 'expense', category: 'Shopping', amount: 85, notes: 'Headphones', recurrent: false },
    { date: '2025-09-15', type: 'expense', category: 'Bills', amount: 120, notes: 'Internet & phone', recurrent: true },
    { date: '2025-09-20', type: 'expense', category: 'Health', amount: 60, notes: 'Pharmacy', recurrent: false },
    { date: '2025-09-25', type: 'expense', category: 'Food', amount: 70, notes: 'Restaurant', recurrent: false },
];

/* ---------- State ---------- */
let transactions = JSON.parse(localStorage.getItem('fintrack')) || sampleTx;
let budgets = JSON.parse(localStorage.getItem('fintrack-budgets')) || [];
let currencySymbol = localStorage.getItem('currency') || '$';

/* ---------- Cached Nodes ---------- */
const navLinks = document.querySelectorAll('.nav-links a, .drawer-links a');
const pages = document.querySelectorAll('.page');
const statAmounts = document.querySelectorAll('.stat-card .amount');
const txBody = document.querySelector('#txTable tbody');
const categoryFilter = document.getElementById('categoryFilter');
const addTxBtn = document.getElementById('addTxBtn');
const modal = document.getElementById('txModal');
const closeModal = document.querySelector('.close');
const txForm = document.getElementById('txForm');
const themeSwitch = document.getElementById('themeSwitch');
const currencySelect = document.getElementById('currencySelect');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const budgetList = document.getElementById('budgetList');
const addBudgetBtn = document.getElementById('addBudgetBtn');
const budgetModal = document.getElementById('budgetModal');
const budgetForm = document.getElementById('budgetForm');
const hamburger = document.getElementById('hamburger');
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const lockScreen = document.getElementById('lockScreen');
const pinInput = document.getElementById('pinInput');

/* ---------- Routing ---------- */
navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const page = link.dataset.page;
        showPage(page);
        link.classList.add('active');
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});
function showPage(id) {
    pages.forEach(p => p.classList.add('hidden'));
    navLinks.forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'dashboard') renderDashboard();
    if (id === 'transactions') renderTable();
    if (id === 'budgets') renderBudgets();
}

/* ---------- Drawer ---------- */
function toggleDrawer() {
    drawer.classList.toggle('open');
    drawerOverlay.classList.toggle('show');
}
hamburger.addEventListener('click', toggleDrawer);
drawerOverlay.addEventListener('click', toggleDrawer);

/* ---------- Theme ---------- */
themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeSwitch.checked = true;
}

/* ---------- Currency ---------- */
currencySelect.value = currencySymbol;
function updateCurrencySymbol() {
    document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = currencySymbol);
}
currencySelect.addEventListener('change', e => {
    currencySymbol = e.target.value;
    localStorage.setItem('currency', currencySymbol);
    updateCurrencySymbol();
    renderDashboard();
    renderTable();
    renderBudgets();
});
updateCurrencySymbol();

/* ---------- Dashboard ---------- */
let spendingChart;
function renderDashboard() {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    animateValue(statAmounts[0], 0, income, 1000, currencySymbol);
    animateValue(statAmounts[1], 0, expense, 1000, currencySymbol);
    animateValue(statAmounts[2], 0, balance, 1000, currencySymbol);
    const ctx = document.getElementById('spendingChart');
    if (spendingChart) spendingChart.destroy();
    spendingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [income, expense],
                backgroundColor: ['#10b981', '#ef4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

/* ---------- Transactions ---------- */
exportCsvBtn.addEventListener('click', () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes'];
    const rows = transactions.map(t => [t.date, t.type, t.category, t.amount, t.notes]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fintrack_export.csv';
    a.click();
    URL.revokeObjectURL(url);
});
function renderTable(filter = 'all') {
    txBody.innerHTML = '';
    const rows = (filter === 'all' ? transactions : transactions.filter(t => t.category === filter))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    rows.forEach((tx, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${tx.date}</td>
            <td><span class="tag ${tx.type}">${tx.type}</span></td>
            <td>${tx.category}</td>
            <td>${currencySymbol}${tx.amount.toFixed(2)}</td>
            <td>${tx.notes}</td>
            <td><button class="btn danger" onclick="removeTransaction(${index})">Remove</button></td>
        `;
        txBody.appendChild(tr);
    });
    populateFilter();
}
function removeTransaction(index) {
    transactions.splice(index, 1);
    localStorage.setItem('fintrack', JSON.stringify(transactions));
    renderTable();
    renderDashboard();
    renderBudgets();
}
function populateFilter() {
    const opts = ['all', ...new Set(transactions.map(t => t.category))];
    categoryFilter.innerHTML = opts.map(o => `<option value="${o}">${o === 'all' ? 'All Categories' : o}</option>`).join('');
}
categoryFilter.addEventListener('change', e => renderTable(e.target.value));

/* ---------- Modal ---------- */
addTxBtn.addEventListener('click', () => {
    modal.classList.add('show');
    txForm.category.innerHTML = categories[txForm.type.value].map(c => `<option value="${c}">${c}</option>`).join('');
});
closeModal.addEventListener('click', () => modal.classList.remove('show'));
window.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
txForm.type.addEventListener('change', e => {
    txForm.category.innerHTML = categories[e.target.value].map(c => `<option value="${c}">${c}</option>`).join('');
});
txForm.addEventListener('submit', e => {
    e.preventDefault();
    const tx = Object.fromEntries(new FormData(txForm));
    tx.amount = parseFloat(tx.amount);
    tx.recurrent = txForm.recurrent.checked;
    transactions.push(tx);
    localStorage.setItem('fintrack', JSON.stringify(transactions));
    txForm.reset();
    modal.classList.remove('show');
    renderTable();
    renderDashboard();
    renderBudgets();
});

/* ---------- Budgets ---------- */
addBudgetBtn.addEventListener('click', () => {
    budgetModal.classList.add('show');
    budgetForm.category.innerHTML = categories.expense.map(c => `<option value="${c}">${c}</option>`).join('');
});
budgetModal.querySelector('.close').addEventListener('click', () => budgetModal.classList.remove('show'));
budgetForm.addEventListener('submit', e => {
    e.preventDefault();
    const { category, cap } = Object.fromEntries(new FormData(budgetForm));
    const exists = budgets.find(b => b.category === category);
    if (exists) exists.cap = parseFloat(cap);
    else budgets.push({ category, cap: parseFloat(cap) });
    localStorage.setItem('fintrack-budgets', JSON.stringify(budgets));
    budgetForm.reset();
    budgetModal.classList.remove('show');
    renderBudgets();
});
function renderBudgets() {
    budgetList.innerHTML = '';
    budgets.forEach(b => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === b.category)
            .reduce((s, t) => s + t.amount, 0);
        const percent = Math.min(100, Math.round((spent / b.cap) * 100));
        const card = document.createElement('div');
        card.className = 'budget-card';
        card.innerHTML = `
            <h3>${b.category}</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${percent}%"></div>
            </div>
            <footer>
                <span>${currencySymbol}${spent.toFixed(2)} spent</span>
                <span>${currencySymbol}${b.cap.toFixed(2)} cap</span>
            </footer>
        `;
        budgetList.appendChild(card);
    });
    budgetTips();
}

/* ---------- Lock ---------- */
const PIN = localStorage.getItem('fintrack-pin') || '0000';
pinInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        unlock();
    }
});
function unlock() {
    if (pinInput.value === PIN) {
        lockScreen.style.display = 'none';
        document.body.style.overflow = '';
        renderDashboard();
    } else {
        document.querySelector('.lock-screen .error').textContent = 'Wrong PIN';
        pinInput.value = '';
    }
}
if (localStorage.getItem('fintrack-pin')) {
    lockScreen.style.display = 'flex';
    document.body.style.overflow = 'hidden';
} else {
    localStorage.setItem('fintrack-pin', '0000');
}

/* ---------- Tour ---------- */
const driver = new Driver({ opacity: 0.8 });
setTimeout(() => {
    if (!localStorage.getItem('fintrack-toured')) {
        driver.defineSteps([
            { element: '.stat-grid', popover: { title: 'Dashboard', description: 'See your income, expenses & balance at a glance.' } },
            { element: '#addTxBtn', popover: { title: 'Add Transaction', description: 'Record every income or expense quickly.' } },
            { element: '#addBudgetBtn', popover: { title: 'Budgets', description: 'Set monthly caps and track progress bars.' } },
            { element: '#themeSwitch', popover: { title: 'Dark Mode', description: 'Toggle light/dark theme anytime.' } }
        ]);
        driver.start();
        localStorage.setItem('fintrack-toured', '1');
    }
}, 1500);

/* ---------- Pull-to-Refresh ---------- */
let touchStartY = 0;
const ptr = document.createElement('div');
ptr.className = 'ptr';
ptr.textContent = 'Refreshing...';
document.body.appendChild(ptr);
window.addEventListener('touchstart', e => touchStartY = e.touches[0].clientY);
window.addEventListener('touchmove', e => {
    const pull = e.touches[0].clientY - touchStartY;
    if (pull > 120 && window.scrollY === 0) ptr.classList.add('show');
});
window.addEventListener('touchend', () => {
    if (ptr.classList.contains('show')) {
        ptr.classList.remove('show');
        location.reload();
    }
});

/* ---------- Auto-Backup ---------- */
const lastBackup = localStorage.getItem('lastBackup');
const now = Date.now();
if (!lastBackup || now - parseInt(lastBackup) > 24 * 3600 * 1000) {
    const data = { transactions, budgets, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fintrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    localStorage.setItem('lastBackup', now.toString());
}

/* ---------- Recurrent ---------- */
function generateRecurrent() {
    const today = new Date().toISOString().slice(0, 7);
    const last = localStorage.getItem('lastRecurrentCheck');
    if (last === today) return;
    const newTx = [];
    transactions.filter(t => t.recurrent).forEach(t => {
        const newDate = `${today}-${t.date.slice(-2)}`;
        const exists = transactions.some(tx => tx.date === newDate && tx.category === t.category && tx.amount === t.amount);
        if (!exists) newTx.push({ ...t, date: newDate, recurrent: false });
    });
    if (newTx.length) {
        transactions.push(...newTx);
        localStorage.setItem('fintrack', JSON.stringify(transactions));
    }
    localStorage.setItem('lastRecurrentCheck', today);
}
generateRecurrent();

/* ---------- Budget Tips ---------- */
function budgetTips() {
    budgets.forEach(b => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === b.category)
            .reduce((s, t) => s + t.amount, 0);
        if (spent > b.cap * 0.8) {
            const exists = document.querySelector(`[data-tip="${b.category}"]`);
            if (!exists) {
                const tip = document.createElement('div');
                tip.className = 'tip-banner';
                tip.dataset.tip = b.category;
                tip.style.background = '#f59e0b';
                tip.style.color = '#fff';
                tip.style.padding = '.5rem 1rem';
                tip.style.borderRadius = '8px';
                tip.style.marginBottom = '.5rem';
                tip.textContent = `⚠️ You’ve used ${Math.round((spent / b.cap) * 100)}% of your ${b.category} budget.`;
                budgetList.prepend(tip);
            }
        }
    });
}

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

/* ---------- Helpers ---------- */
function animateValue(el, start, end, duration, prefix = '') {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        el.innerHTML = `<span class="currency-symbol">${prefix}</span>${Math.abs(current).toFixed(2)}`;
    }, 16);
}

/* ---------- Init ---------- */
showPage('dashboard');
renderBudgets();
