// js/app.js - Controlador Maestro de FinanzFlow PWA

const App = {
  activeTab: 'dashboard',
  deferredInstallPrompt: null,

  async init() {
    console.log('[FinanzFlow] Iniciando aplicación...');
    // 1. Inicializar almacenamiento
    Storage.init();

    // 2. Aplicar tema guardado
    this.applyTheme();

    // 3. Inicializar módulos secundarios
    TransactionsModule.init();
    BudgetsModule.init();
    GoalsModule.init();
    CalendarModule.init();
    CalculatorsModule.init();
    SecurityModule.init();

    // 4. Inicializar Módulo de Autenticación y Multi-Usuario
    await AuthModule.init();

    // 5. Enlazar eventos globales de interfaz
    this.bindGlobalEvents();

    // 6. Registrar Service Worker y detector de instalación PWA
    this.registerServiceWorker();
    this.initPwaInstall();

    // 7. Redimensionamiento automático de gráficos
    window.addEventListener('resize', () => {
      if (this.activeTab === 'dashboard') {
        this.renderDashboardCharts();
      }
    });

    // 8. Revisar parámetros URL
    this.handleUrlShortcuts();
  },

  handleUrlShortcuts() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const tab = params.get('tab');

    if (tab) {
      this.switchTab(tab);
    }

    if (action === 'new-expense') {
      setTimeout(() => TransactionsModule.openModal('expense'), 300);
    } else if (action === 'new-income') {
      setTimeout(() => TransactionsModule.openModal('income'), 300);
    }
  },

  bindGlobalEvents() {
    // Navegación de pestañas (Escritorio + Móvil)
    const navButtons = document.querySelectorAll('[data-tab-target]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab-target');
        this.switchTab(target);
      });
    });

    // Botón de alternancia de tema (Claro / Oscuro)
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Modal de Cuentas
    const accForm = document.getElementById('account-form');
    if (accForm) {
      accForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveAccountForm();
      });
    }

    // Modal de Ajustes
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSettingsForm();
      });
    }

    // Detector de conexión Offline / Online
    window.addEventListener('online', () => {
      this.updateOnlineBadge(true);
      this.showToast('Conexión a internet restablecida', 'success');
    });
    window.addEventListener('offline', () => {
      this.updateOnlineBadge(false);
      this.showToast('Estás en modo sin conexión (Offline). Todos tus datos siguen disponibles.', 'info');
    });
    this.updateOnlineBadge(navigator.onLine);

    // Cerrar menú drawer móvil con tecla Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMobileMenu();
      }
    });
  },

  updateOnlineBadge(isOnline) {
    const badge = document.getElementById('offline-badge');
    if (!badge) return;
    if (isOnline) {
      badge.classList.remove('offline');
      badge.innerHTML = '● Online';
      badge.title = 'Conectado a la red';
    } else {
      badge.classList.add('offline');
      badge.innerHTML = '⚡ Modo Offline';
      badge.title = 'Operando 100% localmente desde el dispositivo';
    }
  },

  applyTheme() {
    const settings = Storage.getSettings();
    const theme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      icon.innerText = theme === 'dark' ? '☀️' : '🌙';
    }
    const drawerIcon = document.getElementById('drawer-theme-icon');
    if (drawerIcon) {
      drawerIcon.innerText = theme === 'dark' ? '☀️' : '🌙';
    }
  },

  toggleTheme() {
    const settings = Storage.getSettings();
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    settings.theme = newTheme;
    Storage.saveSettings(settings);

    this.applyTheme();
    this.refreshAllViews();
    this.showToast(`Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado`, 'info');
  },

  toggleMobileMenu() {
    const sheet = document.getElementById('mobile-more-sheet');
    if (!sheet) return;
    if (sheet.classList.contains('active')) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  },

  openMobileMenu() {
    const sheet = document.getElementById('mobile-more-sheet');
    if (!sheet) return;

    const userName = document.getElementById('drawer-user-name');
    const userRole = document.getElementById('drawer-user-role');
    if (typeof AuthModule !== 'undefined' && AuthModule.currentUser) {
      if (userName) userName.textContent = AuthModule.currentUser.name;
      if (userRole) {
        userRole.textContent = AuthModule.currentUser.role === 'admin' ? '👑 Administrador General' : '👤 Usuario Individual';
      }
    }

    const drawerIcon = document.getElementById('drawer-theme-icon');
    if (drawerIcon) {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      drawerIcon.innerText = isDark ? '☀️' : '🌙';
    }

    sheet.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeMobileMenu() {
    const sheet = document.getElementById('mobile-more-sheet');
    if (sheet) {
      sheet.classList.remove('active');
    }
    document.body.style.overflow = '';
  },

  switchTab(tabName) {
    this.activeTab = tabName;

    // Cerrar menú drawer móvil si estuviera abierto
    this.closeMobileMenu();

    // Actualizar botones de navegación activos
    document.querySelectorAll('[data-tab-target]').forEach(el => {
      if (el.getAttribute('data-tab-target') === tabName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Si la pestaña está contenida en el Drawer "Más", iluminar el botón Más en el bottom nav
    const moreBtn = document.getElementById('mobile-nav-more-btn');
    if (moreBtn) {
      const moreTabs = ['calendar', 'accounts', 'calculators', 'users', 'settings'];
      if (moreTabs.includes(tabName)) {
        moreBtn.classList.add('active');
      } else {
        moreBtn.classList.remove('active');
      }
    }

    // Mostrar sección correspondiente
    document.querySelectorAll('.app-view-section').forEach(sec => {
      if (sec.id === `view-${tabName}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Renderizado según la pestaña
    if (tabName === 'dashboard') {
      this.refreshDashboardMetrics();
      setTimeout(() => this.renderDashboardCharts(), 50);
      this.renderRecentTransactions();
    } else if (tabName === 'transactions') {
      TransactionsModule.renderTransactionList();
    } else if (tabName === 'budgets') {
      BudgetsModule.renderBudgetsView();
    } else if (tabName === 'goals') {
      GoalsModule.renderGoalsView();
    } else if (tabName === 'calendar') {
      CalendarModule.renderCalendar();
    } else if (tabName === 'calculators') {
      CalculatorsModule.renderDebtList();
      CalculatorsModule.calculateDebtPayoff();
      CalculatorsModule.calculateCompoundInterest();
    } else if (tabName === 'accounts') {
      this.renderAccountsView();
    } else if (tabName === 'users') {
      AuthModule.renderUsersList();
    } else if (tabName === 'settings') {
      this.loadSettingsForm();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  refreshAllViews() {
    this.refreshDashboardMetrics();
    if (this.activeTab === 'dashboard') {
      this.renderDashboardCharts();
      this.renderRecentTransactions();
    } else if (this.activeTab === 'transactions') {
      TransactionsModule.renderTransactionList();
    } else if (this.activeTab === 'budgets') {
      BudgetsModule.renderBudgetsView();
    } else if (this.activeTab === 'goals') {
      GoalsModule.renderGoalsView();
    } else if (this.activeTab === 'calendar') {
      CalendarModule.renderCalendar();
    } else if (this.activeTab === 'calculators') {
      CalculatorsModule.renderDebtList();
      CalculatorsModule.calculateDebtPayoff();
      CalculatorsModule.calculateCompoundInterest();
    } else if (this.activeTab === 'accounts') {
      this.renderAccountsView();
    } else if (this.activeTab === 'users') {
      AuthModule.renderUsersList();
    }

    TransactionsModule.renderCategoryOptions();
    TransactionsModule.renderAccountOptions();
  },

  refreshDashboardMetrics() {
    const txs = Storage.getTransactions();
    const settings = Storage.getSettings();

    // 1. Patrimonio total consolidado bimoneda del usuario
    const netWorth = Storage.getTotalNetWorthConsolidated();

    // 2. Ingresos y Gastos del mes actual
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    let monthIncome = 0;
    let monthExpense = 0;

    txs.forEach(t => {
      const d = new Date(t.date + 'T00:00:00');
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        if (t.type === 'income') monthIncome += parseFloat(t.amount);
        if (t.type === 'expense') monthExpense += parseFloat(t.amount);
      }
    });

    const netSavings = monthIncome - monthExpense;
    const savingsRate = monthIncome > 0 ? Math.max(0, (netSavings / monthIncome) * 100) : 0;

    // Actualizar elementos DOM
    const elTotal = document.getElementById('metric-total-balance');
    const elSecondaryTotal = document.getElementById('metric-secondary-balance');
    const elIncome = document.getElementById('metric-month-income');
    const elExpense = document.getElementById('metric-month-expense');
    const elSavings = document.getElementById('metric-savings-rate');
    const elUserName = document.getElementById('header-user-name');

    if (elTotal) elTotal.innerText = Storage.formatMoney(netWorth.totalInMain, netWorth.mainCurr);
    if (elSecondaryTotal) {
      elSecondaryTotal.innerText = `≈ ${Storage.formatMoney(netWorth.totalInSecondary, netWorth.secondaryCurr)} (T.C. ${netWorth.rate})`;
    }
    if (elIncome) elIncome.innerText = Storage.formatMoney(monthIncome);
    if (elExpense) elExpense.innerText = Storage.formatMoney(monthExpense);
    if (elSavings) elSavings.innerText = `${savingsRate.toFixed(1)}%`;
    if (elUserName) elUserName.innerText = (AuthModule.currentUser ? AuthModule.currentUser.name : (settings.userName || 'Usuario'));

    // 3. Renderizar Regla 50/30/20
    this.renderRule50_30_20Widget();
  },

  renderRule50_30_20Widget() {
    const container = document.getElementById('rule-50-30-20-card');
    if (!container) return;

    const r = Storage.getRule50_30_20Analysis();

    const needsColor = r.needsPct > 55 ? '#ef4444' : '#10b981';
    const wantsColor = r.wantsPct > 35 ? '#f59e0b' : '#3b82f6';
    const savingsColor = r.savingsPct >= 20 ? '#10b981' : '#8b5cf6';

    let diagnosis = '🎉 ¡Tus finanzas tienen un balance óptimo!';
    if (r.incomeTotal === 0 && r.needsTotal === 0 && r.wantsTotal === 0) {
      diagnosis = '✨ Registra tus ingresos y gastos para ver tu diagnóstico 50/30/20';
    } else if (r.needsPct > 50) {
      diagnosis = '⚠️ Tus necesidades básicas superan el 50% de tus ingresos. Busca optimizar costos fijos.';
    } else if (r.wantsPct > 30) {
      diagnosis = '⚡ Tus gastos en estilo de vida y ocio superan el 30%. Considera recortar gastos hormiga.';
    } else if (r.savingsPct < 20) {
      diagnosis = '💡 Intenta elevar tu tasa de ahorro hacia el 20% para acelerar tus metas.';
    }

    container.innerHTML = `
      <div class="rule-header">
        <div>
          <span class="text-muted text-sm">Salud Financiera Personal</span>
          <h3 class="rule-title">Regla 50 / 30 / 20</h3>
        </div>
        <span class="status-badge badge-info">${diagnosis}</span>
      </div>

      <!-- Barra Segmentada Tricolor -->
      <div class="segmented-bar-container">
        <div class="segment-bar seg-needs" style="width: ${Math.min(100, r.needsPct)}%" title="Necesidades: ${r.needsPct.toFixed(1)}%"></div>
        <div class="segment-bar seg-wants" style="width: ${Math.min(100, r.wantsPct)}%" title="Deseos: ${r.wantsPct.toFixed(1)}%"></div>
        <div class="segment-bar seg-savings" style="width: ${Math.min(100, r.savingsPct)}%" title="Ahorro: ${r.savingsPct.toFixed(1)}%"></div>
      </div>

      <div class="rule-items-grid">
        <div class="rule-col">
          <div class="rule-col-title">
            <span class="rule-dot dot-needs"></span>
            <b>50% Necesidades</b>
          </div>
          <div class="rule-col-val" style="color: ${needsColor}">${r.needsPct.toFixed(1)}%</div>
          <span class="text-sm text-muted">${Storage.formatMoney(r.needsTotal)} de ${Storage.formatMoney(r.idealNeeds)} ideal</span>
        </div>

        <div class="rule-col">
          <div class="rule-col-title">
            <span class="rule-dot dot-wants"></span>
            <b>30% Deseos & Ocio</b>
          </div>
          <div class="rule-col-val" style="color: ${wantsColor}">${r.wantsPct.toFixed(1)}%</div>
          <span class="text-sm text-muted">${Storage.formatMoney(r.wantsTotal)} de ${Storage.formatMoney(r.idealWants)} ideal</span>
        </div>

        <div class="rule-col">
          <div class="rule-col-title">
            <span class="rule-dot dot-savings"></span>
            <b>20% Ahorro / Metas</b>
          </div>
          <div class="rule-col-val" style="color: ${savingsColor}">${r.savingsPct.toFixed(1)}%</div>
          <span class="text-sm text-muted">${Storage.formatMoney(r.savingsTotal)} de ${Storage.formatMoney(r.idealSavings)} ideal</span>
        </div>
      </div>
    `;
  },

  renderDashboardCharts() {
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    const txs = Storage.getTransactions();

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();

    const labels = [];
    const incomeSeries = [];
    const expenseSeries = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      labels.push(`${monthNames[mIdx]} ${String(y).slice(-2)}`);

      let inc = 0;
      let exp = 0;

      txs.forEach(t => {
        const td = new Date(t.date + 'T00:00:00');
        if (td.getFullYear() === y && td.getMonth() === mIdx) {
          if (t.type === 'income') inc += parseFloat(t.amount);
          if (t.type === 'expense') exp += parseFloat(t.amount);
        }
      });

      incomeSeries.push(inc);
      expenseSeries.push(exp);
    }

    FinanceCharts.renderCashFlowChart('cashflow-chart-canvas', {
      labels,
      incomeSeries,
      expenseSeries
    }, isDark);

    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const catMap = {};

    txs.forEach(t => {
      const td = new Date(t.date + 'T00:00:00');
      if (t.type === 'expense' && td.getFullYear() === curYear && td.getMonth() === curMonth) {
        catMap[t.category] = (catMap[t.category] || 0) + parseFloat(t.amount);
      }
    });

    const categoryData = Object.keys(catMap).map(catName => ({
      name: catName,
      amount: catMap[catName]
    }));

    FinanceCharts.renderCategoryDonut('category-donut-canvas', categoryData, isDark);
  },

  renderRecentTransactions() {
    const container = document.getElementById('recent-txns-list');
    if (!container) return;

    const txs = Storage.getTransactions().slice(0, 5);
    const accounts = Storage.getAccounts();
    const accMap = {};
    accounts.forEach(a => { accMap[a.id] = a; });

    const cats = Storage.getCategories();
    const catMap = {};
    [...cats.expense, ...cats.income].forEach(c => { catMap[c.name] = c; });

    if (txs.length === 0) {
      container.innerHTML = `
        <div class="empty-state-sm">
          <p class="text-muted">No hay transacciones registradas para este usuario.</p>
        </div>
      `;
      return;
    }

    let html = '';
    txs.forEach(t => {
      const isIncome = t.type === 'income';
      const sign = isIncome ? '+' : '-';
      const amountClass = isIncome ? 'amount-income' : 'amount-expense';
      const acc = accMap[t.accountId] || { name: 'Cuenta', icon: '💳', currency: 'PEN' };
      const cat = catMap[t.category] || { icon: isIncome ? '📈' : '💸' };

      html += `
        <div class="recent-txn-row">
          <div class="recent-txn-left">
            <span class="recent-cat-icon ${isIncome ? 'icon-income' : 'icon-expense'}">${cat.icon}</span>
            <div>
              <div class="recent-txn-desc">${t.description || t.category}</div>
              <div class="recent-txn-sub">${t.category} • ${acc.name}</div>
            </div>
          </div>
          <div class="recent-txn-right">
            <div class="${amountClass}">${sign}${Storage.formatMoney(t.amount, t.currency || acc.currency || 'PEN')}</div>
            <div class="recent-txn-date">${t.date}</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  // Gestión de Cuentas
  renderAccountsView() {
    const container = document.getElementById('accounts-list-container');
    if (!container) return;

    const accounts = Storage.getAccounts();
    const netWorth = Storage.getTotalNetWorthConsolidated();

    let html = `
      <div class="accounts-summary-banner">
        <div>
          <span class="text-muted text-sm">Patrimonio Total en Cuentas</span>
          <h2 class="accounts-total-sum">${Storage.formatMoney(netWorth.totalInMain, netWorth.mainCurr)}</h2>
          <span class="text-sm text-muted">≈ ${Storage.formatMoney(netWorth.totalInSecondary, netWorth.secondaryCurr)} (T.C. ${netWorth.rate})</span>
        </div>
        <button class="btn btn-primary" onclick="App.openAccountModal()">
          + Nueva Cuenta
        </button>
      </div>
      <div class="accounts-grid">
    `;

    if (accounts.length === 0) {
      html += `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">💳</div>
          <h3>Sin cuentas configuradas</h3>
          <p>Agrega tu primera cuenta bancaria o billetera digital para comenzar a gestionar tu dinero.</p>
        </div>
      `;
    } else {
      accounts.forEach(a => {
        html += `
          <div class="account-card" style="border-left: 4px solid ${a.color || '#3b82f6'}">
            <div class="account-card-top">
              <span class="account-icon-badge">${a.icon || '💳'}</span>
              <div class="account-actions">
                <button class="btn-icon" title="Editar" onclick="App.editAccount('${a.id}')">✏️</button>
                <button class="btn-icon btn-icon-danger" title="Eliminar" onclick="App.deleteAccount('${a.id}')">🗑️</button>
              </div>
            </div>
            <h3 class="account-name">${a.name}</h3>
            <span class="account-type-tag">${this.formatAccountType(a.type)} • <b>${a.currency || 'PEN'}</b></span>
            <div class="account-balance-val">${Storage.formatMoney(a.balance, a.currency || 'PEN')}</div>
          </div>
        `;
      });
    }

    html += '</div>';
    container.innerHTML = html;
  },

  formatAccountType(type) {
    const map = {
      cash: 'Efectivo',
      bank: 'Cuenta Bancaria',
      savings: 'Cuenta de Ahorros',
      wallet: 'Billetera Digital',
      credit: 'Tarjeta de Crédito'
    };
    return map[type] || 'Cuenta';
  },

  editingAccountId: null,

  openAccountModal() {
    this.editingAccountId = null;
    const modal = document.getElementById('account-modal');
    const form = document.getElementById('account-form');
    const title = document.getElementById('modal-account-title');

    if (form) form.reset();
    if (title) title.innerText = 'Nueva Cuenta o Billetera';
    if (modal) modal.classList.add('active');
  },

  closeAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) modal.classList.remove('active');
    this.editingAccountId = null;
  },

  editAccount(id) {
    const accounts = Storage.getAccounts();
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;

    this.editingAccountId = id;
    const modal = document.getElementById('account-modal');
    const title = document.getElementById('modal-account-title');

    document.getElementById('modal-acc-name').value = acc.name;
    document.getElementById('modal-acc-type').value = acc.type || 'bank';
    document.getElementById('modal-acc-currency').value = acc.currency || 'PEN';
    document.getElementById('modal-acc-balance').value = acc.balance;
    document.getElementById('modal-acc-icon').value = acc.icon || '💳';
    document.getElementById('modal-acc-color').value = acc.color || '#3b82f6';

    if (title) title.innerText = 'Editar Cuenta';
    if (modal) modal.classList.add('active');
  },

  saveAccountForm() {
    const name = document.getElementById('modal-acc-name').value.trim();
    const type = document.getElementById('modal-acc-type').value;
    const currency = document.getElementById('modal-acc-currency').value || 'PEN';
    const balance = parseFloat(document.getElementById('modal-acc-balance').value) || 0;
    const icon = document.getElementById('modal-acc-icon').value || '💳';
    const color = document.getElementById('modal-acc-color').value || '#3b82f6';

    if (!name) {
      this.showToast('Por favor introduce un nombre para la cuenta', 'warning');
      return;
    }

    const accounts = Storage.getAccounts();

    if (this.editingAccountId) {
      const idx = accounts.findIndex(a => a.id === this.editingAccountId);
      if (idx !== -1) {
        accounts[idx] = { ...accounts[idx], name, type, currency, balance, icon, color };
      }
      this.showToast('Cuenta actualizada', 'success');
    } else {
      accounts.push({
        id: 'acc_' + Date.now(),
        name,
        type,
        currency,
        balance,
        icon,
        color
      });
      this.showToast('Nueva cuenta añadida', 'success');
    }

    Storage.saveAccounts(accounts);
    this.closeAccountModal();
    this.renderAccountsView();
    TransactionsModule.renderAccountOptions();
    this.refreshDashboardMetrics();
  },

  deleteAccount(id) {
    const accounts = Storage.getAccounts();
    if (accounts.length <= 1) {
      this.showToast('Debes mantener al menos una cuenta registrada', 'warning');
      return;
    }

    if (confirm('¿Eliminar esta cuenta?')) {
      const filtered = accounts.filter(a => a.id !== id);
      Storage.saveAccounts(filtered);
      this.showToast('Cuenta eliminada', 'info');
      this.renderAccountsView();
      TransactionsModule.renderAccountOptions();
      this.refreshDashboardMetrics();
    }
  },

  // Ajustes y Configuración
  loadSettingsForm() {
    const settings = Storage.getSettings();
    const nameInput = document.getElementById('settings-user-name');
    const currencySelect = document.getElementById('settings-currency');
    const rateInput = document.getElementById('settings-exchange-rate');
    const themeSelect = document.getElementById('settings-theme');
    const pinCheck = document.getElementById('setting-pin-enable');

    if (nameInput) nameInput.value = (AuthModule.currentUser ? AuthModule.currentUser.name : (settings.userName || ''));
    if (currencySelect) currencySelect.value = settings.currency || 'PEN';
    if (rateInput) rateInput.value = settings.exchangeRateUSD || 3.75;
    if (themeSelect) themeSelect.value = settings.theme || 'dark';
    if (pinCheck) pinCheck.checked = !!settings.pinEnabled;
  },

  saveSettingsForm() {
    const settings = Storage.getSettings();
    const userName = document.getElementById('settings-user-name').value.trim();
    const currency = document.getElementById('settings-currency').value;
    const exchangeRateUSD = parseFloat(document.getElementById('settings-exchange-rate').value) || 3.75;
    const theme = document.getElementById('settings-theme').value;

    settings.userName = userName || 'Usuario';
    settings.currency = currency;
    settings.exchangeRateUSD = exchangeRateUSD;
    settings.theme = theme;

    if (AuthModule.currentUser) {
      AuthModule.currentUser.name = settings.userName;
      const users = AuthModule.getUsers();
      const u = users.find(x => x.id === AuthModule.currentUser.id);
      if (u) {
        u.name = settings.userName;
        AuthModule.saveUsers(users);
      }
    }

    Storage.saveSettings(settings);
    this.applyTheme();
    this.refreshAllViews();
    this.showToast('Configuraciones guardadas con éxito', 'success');
  },

  handleImportFile(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = Storage.importBackup(e.target.result);
      if (result.success) {
        this.showToast(result.message, 'success');
        this.refreshAllViews();
      } else {
        this.showToast('Error al importar: ' + result.message, 'danger');
      }
      inputElement.value = '';
    };
    reader.readAsText(file);
  },

  confirmRestoreDemo() {
    if (confirm('¿Cargar datos de demostración en esta cuenta? Se reescribirán tus datos actuales.')) {
      Storage.restoreDemoData();
      this.showToast('Datos cargados', 'success');
      this.refreshAllViews();
    }
  },

  confirmClearAll() {
    if (confirm('⚠️ ATENCIÓN: ¿Seguro que deseas eliminar todas las transacciones de esta cuenta? Esta acción no se puede deshacer.')) {
      Storage.clearAllData();
      this.showToast('Datos de la cuenta limpiados', 'info');
      this.refreshAllViews();
    }
  },

  // Toast Notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '✅',
      warning: '⚠️',
      danger: '❌',
      info: '💡'
    };

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '🔔'}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  },

  // Service Worker y PWA Install Banner
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('[FinanzFlow PWA] Service Worker registrado con éxito en scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[FinanzFlow PWA] Error al registrar Service Worker:', err);
          });
      });
    }
  },

  initPwaInstall() {
    const banner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('btn-pwa-install');
    const dismissBtn = document.getElementById('btn-pwa-dismiss');
    const headerInstallBtn = document.getElementById('header-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[FinanzFlow PWA] Evento beforeinstallprompt capturado');
      e.preventDefault();
      this.deferredInstallPrompt = e;

      if (banner) banner.classList.add('visible');
      if (headerInstallBtn) headerInstallBtn.style.display = 'inline-flex';
    });

    const triggerInstall = async () => {
      if (!this.deferredInstallPrompt) {
        this.showToast('Para instalar en tu móvil o PC, usa la opción "Instalar app" o "Agregar a pantalla de inicio" del menú de tu navegador.', 'info');
        return;
      }
      this.deferredInstallPrompt.prompt();
      const { outcome } = await this.deferredInstallPrompt.userChoice;
      console.log('[FinanzFlow PWA] Resultado de instalación:', outcome);
      this.deferredInstallPrompt = null;
      if (banner) banner.classList.remove('visible');
      if (headerInstallBtn) headerInstallBtn.style.display = 'none';
    };

    if (installBtn) installBtn.addEventListener('click', triggerInstall);
    if (headerInstallBtn) headerInstallBtn.addEventListener('click', triggerInstall);
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        if (banner) banner.classList.remove('visible');
      });
    }

    window.addEventListener('appinstalled', () => {
      console.log('[FinanzFlow PWA] App instalada con éxito');
      this.showToast('¡FinanzFlow ha sido instalada exitosamente!', 'success');
      if (banner) banner.classList.remove('visible');
      if (headerInstallBtn) headerInstallBtn.style.display = 'none';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
