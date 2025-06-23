// Verifica se o usuário está autenticado
function checkAuth() {
    const isAuthenticated = localStorage.getItem('authenticated') === 'true';
    if (window.location.pathname.includes('dashboard.html') && !isAuthenticated) {
        window.location.href = 'index.html';
    }
    if (window.location.pathname.includes('index.html') && isAuthenticated) {
        window.location.href = 'dashboard.html';
    }
}

// Login via API Flask
document.getElementById('login-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authenticated', 'true');
            localStorage.setItem('user_id', data.user_id);
            window.location.href = 'dashboard.html';
        } else {
            alert('Usuário ou senha inválidos!');
        }
    } catch (err) {
        alert('Erro ao conectar com o servidor.');
        console.error(err);
    }
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', function() {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('user_id');
    window.location.href = 'index.html';
});

// Carrega o dashboard com dados reais da API Flask
async function loadDashboard() {
    if (!document.getElementById('content-area')) return;

    let transactions = [];
    let categorias = [];

    try {
        const resTransacoes = await fetch('http://127.0.0.1:5000/transacoes');
        transactions = await resTransacoes.json();

        const resCategorias = await fetch('http://127.0.0.1:5000/categorias');
        categorias = await resCategorias.json();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }

    const totalIncome = transactions.filter(t => t.tipo === 'income').reduce((sum, t) => sum + t.valor, 0);
    const totalExpense = transactions.filter(t => t.tipo === 'expense').reduce((sum, t) => sum + Math.abs(t.valor), 0);
    const balance = totalIncome - totalExpense;

    // Renderização da interface
    const balanceClass = balance < 0 ? 'negative-balance' : 'positive-balance';

document.getElementById('content-area').innerHTML = `
    <section class="summary-cards">
        <div class="summary-card"><h3>Saldo Total</h3><div class="value ${balanceClass}">R$ ${balance.toFixed(2)}</div><div class="change positive"><i class="fas fa-arrow-up"></i> 12% vs último mês</div></div>
        <div class="summary-card"><h3>Receitas</h3><div class="value">R$ ${totalIncome.toFixed(2)}</div><div class="change positive"><i class="fas fa-arrow-up"></i> 8% vs último mês</div></div>
        <div class="summary-card"><h3>Despesas</h3><div class="value">R$ ${totalExpense.toFixed(2)}</div><div class="change negative"><i class="fas fa-arrow-down"></i> 5% vs último mês</div></div>
        <div class="summary-card"><h3>Economias</h3><div class="value">R$ ${(balance * 0.3).toFixed(2)}</div><div class="change positive"><i class="fas fa-arrow-up"></i> 20% da meta</div></div>
    </section>

        <section class="chart-container"><h2>Gastos por Categoria</h2><canvas id="categoryChart" height="300"></canvas></section>
        <section class="chart-container"><h2>Fluxo Mensal</h2><canvas id="monthlyChart" height="300"></canvas></section>

        <section class="add-form">
            <h2>Adicionar Transação</h2>
            <form id="transaction-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="transaction-type">Tipo</label>
                        <select id="transaction-type" required>
                            <option value="income">Receita</option>
                            <option value="expense">Despesa</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="transaction-amount">Valor</label>
                        <input type="number" id="transaction-amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="transaction-category">Categoria</label>
                        <select id="transaction-category" required>
                            ${categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="transaction-date">Data</label>
                        <input type="date" id="transaction-date" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="transaction-description">Descrição</label>
                    <input type="text" id="transaction-description" required>
                </div>
                <button type="submit" class="btn-submit">Adicionar Transação</button>
            </form>
        </section>

        <section class="chart-container">
            <h2>Últimas Transações</h2>
            <table class="transactions-table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => `
                        <tr>
                            <td>${t.descricao}</td>
                            <td>${categorias.find(c => c.id === t.categoria_id)?.nome || 'Desconhecida'}</td>
                            <td>R$ ${Math.abs(t.valor).toFixed(2)}</td>
                            <td>${new Date(t.data).toLocaleDateString()}</td>
                            <td><span class="status ${t.tipo}">${t.tipo === 'income' ? 'Receita' : 'Despesa'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>
    `;

    initCharts();
}

// Enviar transação para backend
document.addEventListener('submit', async function(e) {
    if (e.target.id === 'transaction-form') {
        e.preventDefault();

        const user_id = localStorage.getItem('user_id');
        const tipo = document.getElementById('transaction-type').value;
        const valor = parseFloat(document.getElementById('transaction-amount').value);
        const categoria_id = parseInt(document.getElementById('transaction-category').value);
        const data = document.getElementById('transaction-date').value;
        const descricao = document.getElementById('transaction-description').value;

        try {
            const response = await fetch('http://127.0.0.1:5000/transacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: user_id, tipo, valor, descricao, data, categoria_id })
            });

            if (response.ok) {
                alert('Transação adicionada com sucesso!');
                e.target.reset();
                loadDashboard();
            } else {
                alert('Erro ao adicionar transação.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao se comunicar com o servidor.');
        }
    }
});

// Inicializa gráficos
function initCharts() {
    const ctx1 = document.getElementById('categoryChart')?.getContext('2d');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros'],
                datasets: [{
                    data: [35, 15, 25, 10, 10, 5],
                    backgroundColor: ['#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', '#f72585', '#7209b7'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
    }

    const ctx2 = document.getElementById('monthlyChart')?.getContext('2d');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [
                    {
                        label: 'Receitas',
                        data: [2500, 2800, 3000, 2900, 3200, 0],
                        borderColor: '#4cc9f0',
                        backgroundColor: 'rgba(76, 201, 240, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Despesas',
                        data: [1800, 1900, 2100, 2000, 2200, 0],
                        borderColor: '#f72585',
                        backgroundColor: 'rgba(247, 37, 133, 0.1)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

// Inicializa a aplicação
function initApp() {
    checkAuth();
    loadDashboard();
}

document.addEventListener('DOMContentLoaded', initApp);
// Controle do botão de notificação
document.querySelector('.btn-notification')?.addEventListener('click', async () => {
    const popup = document.getElementById('notification-popup');
    const list = document.getElementById('notification-list');

    // Toggle da visibilidade
    popup.classList.toggle('hidden');

    if (!popup.classList.contains('hidden')) {
        try {
            const res = await fetch('http://127.0.0.1:5000/transacoes');
            const transactions = await res.json();
            const ultimas = transactions.slice(-3).reverse();

            list.innerHTML = ultimas.map(t =>
                `<li>${t.descricao} - R$ ${Math.abs(t.valor).toFixed(2)} (${t.tipo === 'income' ? 'Receita' : 'Despesa'})</li>`
            ).join('');
        } catch (err) {
            console.error('Erro ao carregar notificações:', err);
            list.innerHTML = '<li>Erro ao carregar dados.</li>';
        }
    }
});

// Fecha popup se clicar fora
document.addEventListener('click', function(event) {
    const popup = document.getElementById('notification-popup');
    const btn = document.querySelector('.btn-notification');

    if (!popup.contains(event.target) && !btn.contains(event.target)) {
        popup?.classList.add('hidden');
    }
});



