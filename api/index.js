<script>
    const API_URL = '/api'; 

    // --- EASTER EGG HINT ---
    console.log(
        "%c🕵️ You found the secret code!! \nType 'sujay' in username and password to unlock GOD MODE.", 
        "color: #00f2ff; font-size: 16px; font-weight: bold; background: #000; padding: 10px; border: 2px solid #00f2ff; border-radius: 5px;"
    );

    let isLoginMode = true;
    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    const authTitle = document.getElementById('auth-title');
    const authForm = document.getElementById('auth-form');
    const toggleBtn = document.getElementById('toggle-auth');
    const submitBtn = document.getElementById('submit-btn');
    const listEl = document.getElementById('list');
    const balanceEl = document.getElementById('balance');
    const transactionForm = document.getElementById('transaction-form');
    let myChart = null; 

    // --- HELPER FUNCTIONS ---
    function setLoading(isLoading, btnElement, defaultText) {
        if (isLoading) {
            btnElement.classList.add('loading');
        } else {
            btnElement.classList.remove('loading');
            btnElement.querySelector('span').innerText = defaultText;
        }
    }

    function checkAuth() {
        const token = localStorage.getItem('token');
        if(token) {
            authView.classList.remove('active');
            appView.classList.add('active');
            loadTransactions();
        } else {
            authView.classList.add('active');
            appView.classList.remove('active');
        }
    }

    toggleBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authTitle.innerText = isLoginMode ? 'Login' : 'Create Account';
        submitBtn.querySelector('span').innerText = isLoginMode ? 'Login' : 'Sign Up';
        toggleBtn.innerText = isLoginMode ? 'Need to Sign Up?' : 'Have an account?';
    });

    // --- MAIN LOGIN HANDLER (With Easter Egg) ---
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 1. CHECK FOR EASTER EGG
        if (username.toLowerCase() === 'sujay' && password.toLowerCase() === 'sujay') {
            triggerGodMode();
            // We DO NOT return here. We let the code continue to try logging in!
        }

        // 2. PROCEED WITH NORMAL LOGIN
        const endpoint = isLoginMode ? '/login' : '/register';
        const defaultText = isLoginMode ? 'Login' : 'Sign Up';

        setLoading(true, submitBtn, defaultText);
        
        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            
            if(res.ok) {
                // If login successful
                localStorage.setItem('token', data.token);
                
                // If Easter Egg is running, wait a moment before switching views
                if (document.body.classList.contains('god-mode-body')) {
                    setTimeout(() => checkAuth(), 2000); // Wait 2s for animation
                } else {
                    checkAuth();
                }
            } else {
                // If login failed (e.g. 'sujay' is not a real user in DB), show alert
                // But if Easter Egg is running, maybe suppress the error for coolness?
                // Let's show it anyway so you know.
                alert(data.msg || 'Error occurred');
            }
        } catch (err) {
            console.error(err);
            alert("Connection Error");
        } finally {
            setLoading(false, submitBtn, defaultText);
        }
    });

    function logout() {
        localStorage.removeItem('token');
        checkAuth();
        listEl.innerHTML = '';
        // Also remove god mode if active
        document.body.classList.remove('god-mode-body');
        document.querySelector('.container').classList.remove('god-mode-container');
    }

    // --- EASTER EGG ANIMATION ---
    function triggerGodMode() {
        const container = document.querySelector('.container');
        const body = document.body;
        const title = document.querySelector('.app-logo');

        container.classList.add('god-mode-container');
        body.classList.add('god-mode-body');
        title.innerText = "ACCESS GRANTED";
    }

    // --- TRANSACTION LOGIC ---
    async function loadTransactions() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/expenses`, { headers: { 'x-auth-token': token } });
            if(!res.ok) { if(res.status === 401) logout(); return; }
            const data = await res.json();
            listEl.innerHTML = '';
            data.forEach(addTransactionDOM);
            updateValues(data);
            renderChart(data);
            updateSurvival(data); // Survival Feature
        } catch (err) { console.error(err); }
    }

    // ... (Keep your addTransactionDOM, updateValues, renderChart, updateSurvival functions here) ...
    // ... (Keep your Voice Recognition logic here) ...
    
    // I will include the missing standard functions below just in case you need them to be complete:

    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('text').value;
        const amount = document.getElementById('amount').value;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ text, amount })
            });
            const data = await res.json();
            addTransactionDOM(data);
            loadTransactions(); 
            document.getElementById('text').value = '';
            document.getElementById('amount').value = '';
        } catch(err) { console.error(err); }
    });

    function addTransactionDOM(transaction) {
        const sign = transaction.amount < 0 ? '-' : '+';
        const borderColors = transaction.amount < 0 ? '#ff0055' : '#00f2ff';
        const item = document.createElement('li');
        item.classList.add('transaction');
        item.style.borderLeft = `4px solid ${borderColors}`;
        item.innerHTML = `<div class="transaction-info"><h4>${transaction.text}</h4><p>${transaction.date}</p></div><div style="display:flex; align-items:center;"><span style="font-weight:700; color:${borderColors}">${sign}$${Math.abs(transaction.amount).toFixed(2)}</span><button class="delete-btn" onclick="removeTransaction('${transaction._id}')"><i class="fas fa-trash"></i></button></div>`;
        listEl.appendChild(item);
    }

    async function removeTransaction(id) {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE', headers: { 'x-auth-token': token } });
        loadTransactions();
    }

    function updateValues(transactions) {
        const amounts = transactions.map(t => t.amount);
        const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
        const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
        const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

        balanceEl.innerText = `$${total}`;
        document.getElementById('money-plus').innerText = `+$${income}`;
        document.getElementById('money-minus').innerText = `-$${expense}`;
    }

    function renderChart(transactions) {
        if (!window.Chart) return;
        const ctx = document.getElementById('expenseChart').getContext('2d');
        const expenses = transactions.filter(t => t.amount < 0);
        const grouped = {};
        expenses.forEach(t => { const name = t.text.toLowerCase(); grouped[name] = (grouped[name] || 0) + Math.abs(t.amount); });
        
        if (myChart) myChart.destroy();
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(grouped),
                datasets: [{ data: Object.values(grouped), backgroundColor: ['#ff0055', '#00f2ff', '#9400d3', '#ffff00'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'white' } } } }
        });
    }

    function updateSurvival(transactions) {
        const survivalBox = document.getElementById('survival-box');
        const daysLeftEl = document.getElementById('days-left');
        const totalBalance = transactions.reduce((acc, t) => acc + t.amount, 0);
        const expenses = transactions.filter(t => t.amount < 0);
        if (expenses.length === 0 || totalBalance <= 0) { survivalBox.style.display = 'none'; return; }
        const dates = [...new Set(expenses.map(t => t.date))];
        const numberOfDays = dates.length || 1;
        const totalExpense = expenses.reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const avgDailySpend = totalExpense / numberOfDays;
        if (avgDailySpend > 0) {
            const daysLeft = Math.floor(totalBalance / avgDailySpend);
            survivalBox.style.display = 'block';
            daysLeftEl.innerText = daysLeft;
            daysLeftEl.style.color = daysLeft < 7 ? 'var(--accent-secondary)' : 'var(--accent-primary)';
        }
    }

    // Init
    checkAuth();
</script>
