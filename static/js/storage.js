// js/storage.js - Gestión de almacenamiento local aislado por usuario, IndexedDB y bimoneda

const DEFAULT_CURRENCY = 'PEN';

const SEED_DATA = {
  settings: {
    userName: 'Administrador General',
    currency: 'PEN',
    exchangeRateUSD: 3.75,
    theme: 'dark',
    monthlyStartDay: 1,
    budgetAlertThreshold: 85,
    pinEnabled: false,
    pinCode: '',
    privacyMode: false
  },
  accounts: [
    { id: 'acc_cash', name: 'Efectivo Soles', type: 'cash', balance: 450.00, currency: 'PEN', icon: '💵', color: '#10b981' },
    { id: 'acc_bcp', name: 'BCP Sueldo', type: 'bank', balance: 4850.50, currency: 'PEN', icon: '🏦', color: '#0284c7' },
    { id: 'acc_interbank', name: 'Interbank Débito', type: 'bank', balance: 1320.00, currency: 'PEN', icon: '💳', color: '#059669' },
    { id: 'acc_bbva', name: 'BBVA Ahorros', type: 'savings', balance: 6500.00, currency: 'PEN', icon: '💰', color: '#6366f1' },
    { id: 'acc_usd', name: 'BCP Ahorros USD', type: 'savings', balance: 850.00, currency: 'USD', icon: '💲', color: '#14b8a6' },
    { id: 'acc_yape', name: 'Yape / Billetera Digital', type: 'wallet', balance: 280.00, currency: 'PEN', icon: '📱', color: '#a855f7' }
  ],
  categories: {
    expense: [
      { id: 'cat_food', name: 'Alimentación & Super', bucket: 'needs', icon: '🛒', color: '#f59e0b' },
      { id: 'cat_housing', name: 'Vivienda & Alquiler', bucket: 'needs', icon: '🏠', color: '#ec4899' },
      { id: 'cat_transport', name: 'Transporte & Gasolina', bucket: 'needs', icon: '🚗', color: '#3b82f6' },
      { id: 'cat_utilities', name: 'Servicios (Luz, Agua, Net)', bucket: 'needs', icon: '⚡', color: '#8b5cf6' },
      { id: 'cat_health', name: 'Salud & Medicinas', bucket: 'needs', icon: '💊', color: '#ef4444' },
      { id: 'cat_education', name: 'Educación & Cursos', bucket: 'needs', icon: '📚', color: '#06b6d4' },
      { id: 'cat_leisure', name: 'Entretenimiento & Ocio', bucket: 'wants', icon: '🍿', color: '#14b8a6' },
      { id: 'cat_clothing', name: 'Ropa & Calzado', bucket: 'wants', icon: '👕', color: '#d946ef' },
      { id: 'cat_subscriptions', name: 'Suscripciones (Streaming)', bucket: 'wants', icon: '📺', color: '#64748b' },
      { id: 'cat_others_exp', name: 'Otros Gastos', bucket: 'wants', icon: '📦', color: '#94a3b8' }
    ],
    income: [
      { id: 'cat_salary', name: 'Salario / Nómina', icon: '💼', color: '#10b981' },
      { id: 'cat_freelance', name: 'Proyectos & Freelance', icon: '💻', color: '#3b82f6' },
      { id: 'cat_investments', name: 'Rendimientos & Dividendos', icon: '📈', color: '#8b5cf6' },
      { id: 'cat_sales', name: 'Ventas Personales', icon: '🏷️', color: '#f59e0b' },
      { id: 'cat_others_inc', name: 'Otros Ingresos', icon: '✨', color: '#06b6d4' }
    ]
  },
  budgets: [
    { id: 'bgt_1', category: 'Alimentación & Super', limit: 1400.00, period: 'monthly' },
    { id: 'bgt_2', category: 'Vivienda & Alquiler', limit: 1200.00, period: 'monthly' },
    { id: 'bgt_3', category: 'Transporte & Gasolina', limit: 450.00, period: 'monthly' },
    { id: 'bgt_4', category: 'Servicios (Luz, Agua, Net)', limit: 380.00, period: 'monthly' },
    { id: 'bgt_5', category: 'Entretenimiento & Ocio', limit: 350.00, period: 'monthly' }
  ],
  goals: [
    {
      id: 'goal_1',
      title: 'Fondo de Emergencia (6 meses)',
      targetAmount: 12000.00,
      currentAmount: 7500.00,
      targetDate: '2027-06-30',
      color: '#10b981',
      icon: '🛡️',
      notes: 'Respaldar 6 meses de gastos fijos ante contingencias.'
    },
    {
      id: 'goal_2',
      title: 'Viaje Vacaciones Cusco',
      targetAmount: 3500.00,
      currentAmount: 2100.00,
      targetDate: '2027-01-15',
      color: '#06b6d4',
      icon: '✈️',
      notes: 'Billetes, hotel y tours en Valle Sagrado.'
    },
    {
      id: 'goal_3',
      title: 'Renovación Laptop Pro',
      targetAmount: 5000.00,
      currentAmount: 1800.00,
      targetDate: '2027-04-30',
      color: '#8b5cf6',
      icon: '💻',
      notes: 'Equipo nuevo para desarrollo y productividad.'
    }
  ],
  debts: [
    {
      id: 'debt_1',
      name: 'Tarjeta de Crédito BCP Visa Signature',
      balance: 3200.00,
      interestRate: 49.5,
      minPayment: 210.00,
      dueDate: 18,
      notes: 'Compras a cuotas y consumos del mes'
    },
    {
      id: 'debt_2',
      name: 'Préstamo Personal Interbank',
      balance: 7500.00,
      interestRate: 21.0,
      minPayment: 480.00,
      dueDate: 25,
      notes: 'Crédito vehicular / estudios'
    },
    {
      id: 'debt_3',
      name: 'Línea de Crédito BBVA',
      balance: 1400.00,
      interestRate: 36.0,
      minPayment: 130.00,
      dueDate: 5,
      notes: 'Saldo rotativo'
    }
  ],
  transactions: [
    {
      id: 'tx_101',
      type: 'income',
      amount: 4500.00,
      currency: 'PEN',
      category: 'Salario / Nómina',
      accountId: 'acc_bcp',
      date: '2026-10-01',
      description: 'Sueldo mensual empresa principal',
      tags: ['nómina', 'trabajo'],
      isRecurring: true,
      dueDay: 1
    },
    {
      id: 'tx_102',
      type: 'income',
      amount: 1200.00,
      currency: 'PEN',
      category: 'Proyectos & Freelance',
      accountId: 'acc_interbank',
      date: '2026-10-08',
      description: 'Asesoría técnica y desarrollo de software',
      tags: ['freelance'],
      isRecurring: false
    },
    {
      id: 'tx_103',
      type: 'expense',
      amount: 1100.00,
      currency: 'PEN',
      category: 'Vivienda & Alquiler',
      accountId: 'acc_bcp',
      date: '2026-10-02',
      description: 'Pago mensual de departamento',
      tags: ['alquiler', 'fijo'],
      isRecurring: true,
      dueDay: 2
    },
    {
      id: 'tx_104',
      type: 'expense',
      amount: 320.00,
      currency: 'PEN',
      category: 'Alimentación & Super',
      accountId: 'acc_interbank',
      date: '2026-10-04',
      description: 'Compras de despensa semanal en supermercado',
      tags: ['comida', 'super'],
      isRecurring: false
    },
    {
      id: 'tx_105',
      type: 'expense',
      amount: 185.00,
      currency: 'PEN',
      category: 'Servicios (Luz, Agua, Net)',
      accountId: 'acc_bcp',
      date: '2026-10-06',
      description: 'Servicio de Internet Fibra Óptica y Telefonía',
      tags: ['servicios', 'fijo'],
      isRecurring: true,
      dueDay: 6
    },
    {
      id: 'tx_106',
      type: 'expense',
      amount: 95.00,
      currency: 'PEN',
      category: 'Transporte & Gasolina',
      accountId: 'acc_cash',
      date: '2026-10-09',
      description: 'Recarga combustible y pasajes urbanos',
      tags: ['transporte'],
      isRecurring: false
    },
    {
      id: 'tx_107',
      type: 'expense',
      amount: 140.00,
      currency: 'PEN',
      category: 'Alimentación & Super',
      accountId: 'acc_yape',
      date: '2026-10-12',
      description: 'Almuerzo fin de semana familiar',
      tags: ['restaurante', 'familia'],
      isRecurring: false
    },
    {
      id: 'tx_108',
      type: 'expense',
      amount: 65.00,
      currency: 'PEN',
      category: 'Suscripciones (Streaming)',
      accountId: 'acc_interbank',
      date: '2026-10-14',
      description: 'Suscripción mensual Netflix & Spotify',
      tags: ['streaming'],
      isRecurring: true,
      dueDay: 14
    },
    {
      id: 'tx_109',
      type: 'expense',
      amount: 220.00,
      currency: 'PEN',
      category: 'Alimentación & Super',
      accountId: 'acc_interbank',
      date: '2026-10-16',
      description: 'Compras de mercado central y carnes',
      tags: ['supermercado'],
      isRecurring: false
    },
    {
      id: 'tx_110',
      type: 'income',
      amount: 350.00,
      currency: 'PEN',
      category: 'Rendimientos & Dividendos',
      accountId: 'acc_bbva',
      date: '2026-10-17',
      description: 'Intereses generados fondo mutuo',
      tags: ['inversiones'],
      isRecurring: false
    },
    {
      id: 'tx_111',
      type: 'expense',
      amount: 110.00,
      currency: 'PEN',
      category: 'Entretenimiento & Ocio',
      accountId: 'acc_yape',
      date: '2026-10-18',
      description: 'Salida de cine y cafetería',
      tags: ['ocio'],
      isRecurring: false
    }
  ]
};

// -------------------------------------------------------------
// IndexedDB para Fotos de Comprobantes (Aislado por Usuario)
// -------------------------------------------------------------
const ReceiptsDB = {
  dbName: 'FinanzFlowReceiptsDB_v2',
  storeName: 'receipts',
  db: null,

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'userTxnKey' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => reject(e);
    });
  },

  async saveReceipt(txnId, base64Data) {
    if (!this.db) await this.init();
    const userTxnKey = `${Storage.activeUserId}_${txnId}`;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put({ userTxnKey, txnId, userId: Storage.activeUserId, data: base64Data, timestamp: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e);
    });
  },

  async getReceipt(txnId) {
    if (!this.db) await this.init();
    const userTxnKey = `${Storage.activeUserId}_${txnId}`;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(userTxnKey);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = (e) => reject(e);
    });
  },

  async deleteReceipt(txnId) {
    if (!this.db) await this.init();
    const userTxnKey = `${Storage.activeUserId}_${txnId}`;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.delete(userTxnKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e);
    });
  }
};

// -------------------------------------------------------------
// Motor Principal de Almacenamiento Multi-Usuario (100% Aislado)
// -------------------------------------------------------------
const Storage = {
  KEY_PREFIX: 'finanzflow_u_',
  activeUserId: 'usr_admin',

  // Obtener clave aislada para el usuario actual
  getKey(baseKey) {
    return `${this.KEY_PREFIX}${this.activeUserId}_${baseKey}`;
  },

  // Cambiar usuario activo y verificar inicialización
  setActiveUser(userId, userName = 'Usuario') {
    this.activeUserId = userId;
    const isInit = localStorage.getItem(this.getKey('initialized'));
    if (!isInit) {
      if (userId === 'usr_admin') {
        this.saveAll(SEED_DATA);
      } else {
        this.initializeUserData(userId, userName);
      }
      localStorage.setItem(this.getKey('initialized'), 'true');
    }
  },

  // Inicializar nuevo usuario individual con cuentas y categorías limpias
  initializeUserData(userId, userName) {
    const freshUserData = {
      settings: {
        userName: userName || 'Usuario',
        currency: 'PEN',
        exchangeRateUSD: 3.75,
        theme: 'dark',
        monthlyStartDay: 1,
        budgetAlertThreshold: 85,
        pinEnabled: false,
        pinCode: '',
        privacyMode: false
      },
      accounts: [
        { id: 'acc_cash_' + userId, name: 'Efectivo', type: 'cash', balance: 0.00, currency: 'PEN', icon: '💵', color: '#10b981' },
        { id: 'acc_bank_' + userId, name: 'Cuenta Principal', type: 'bank', balance: 0.00, currency: 'PEN', icon: '🏦', color: '#0284c7' },
        { id: 'acc_wallet_' + userId, name: 'Billetera Digital', type: 'wallet', balance: 0.00, currency: 'PEN', icon: '📱', color: '#a855f7' }
      ],
      categories: SEED_DATA.categories,
      budgets: [],
      goals: [],
      debts: [],
      transactions: []
    };

    const prevUser = this.activeUserId;
    this.activeUserId = userId;
    this.saveAll(freshUserData);
    localStorage.setItem(this.getKey('initialized'), 'true');
    this.activeUserId = prevUser;
  },

  // Eliminar todos los datos de un usuario eliminado
  purgeUserData(userId) {
    const prefix = `${this.KEY_PREFIX}${userId}_`;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  },

  init() {
    ReceiptsDB.init().catch(err => console.warn('[FinanzFlow] IndexedDB init warning:', err));
  },

  getAll() {
    try {
      const settings = JSON.parse(localStorage.getItem(this.getKey('settings'))) || SEED_DATA.settings;
      const accounts = JSON.parse(localStorage.getItem(this.getKey('accounts'))) || SEED_DATA.accounts;
      const categories = JSON.parse(localStorage.getItem(this.getKey('categories'))) || SEED_DATA.categories;
      const budgets = JSON.parse(localStorage.getItem(this.getKey('budgets'))) || [];
      const goals = JSON.parse(localStorage.getItem(this.getKey('goals'))) || [];
      const debts = JSON.parse(localStorage.getItem(this.getKey('debts'))) || [];
      const transactions = JSON.parse(localStorage.getItem(this.getKey('transactions'))) || [];

      return { settings, accounts, categories, budgets, goals, debts, transactions };
    } catch (e) {
      console.error('[FinanzFlow Storage] Error al cargar datos:', e);
      return SEED_DATA;
    }
  },

  saveAll(data) {
    if (data.settings) localStorage.setItem(this.getKey('settings'), JSON.stringify(data.settings));
    if (data.accounts) localStorage.setItem(this.getKey('accounts'), JSON.stringify(data.accounts));
    if (data.categories) localStorage.setItem(this.getKey('categories'), JSON.stringify(data.categories));
    if (data.budgets) localStorage.setItem(this.getKey('budgets'), JSON.stringify(data.budgets));
    if (data.goals) localStorage.setItem(this.getKey('goals'), JSON.stringify(data.goals));
    if (data.debts) localStorage.setItem(this.getKey('debts'), JSON.stringify(data.debts));
    if (data.transactions) localStorage.setItem(this.getKey('transactions'), JSON.stringify(data.transactions));
  },

  getSettings() {
    return JSON.parse(localStorage.getItem(this.getKey('settings'))) || SEED_DATA.settings;
  },

  saveSettings(settings) {
    localStorage.setItem(this.getKey('settings'), JSON.stringify(settings));
  },

  getAccounts() {
    return JSON.parse(localStorage.getItem(this.getKey('accounts'))) || [];
  },

  saveAccounts(accounts) {
    localStorage.setItem(this.getKey('accounts'), JSON.stringify(accounts));
  },

  getCategories() {
    return JSON.parse(localStorage.getItem(this.getKey('categories'))) || SEED_DATA.categories;
  },

  getBudgets() {
    return JSON.parse(localStorage.getItem(this.getKey('budgets'))) || [];
  },

  saveBudgets(budgets) {
    localStorage.setItem(this.getKey('budgets'), JSON.stringify(budgets));
  },

  getGoals() {
    return JSON.parse(localStorage.getItem(this.getKey('goals'))) || [];
  },

  saveGoals(goals) {
    localStorage.setItem(this.getKey('goals'), JSON.stringify(goals));
  },

  getDebts() {
    return JSON.parse(localStorage.getItem(this.getKey('debts'))) || [];
  },

  saveDebts(debts) {
    localStorage.setItem(this.getKey('debts'), JSON.stringify(debts));
  },

  getTransactions() {
    const txs = JSON.parse(localStorage.getItem(this.getKey('transactions'))) || [];
    return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  saveTransactions(transactions) {
    localStorage.setItem(this.getKey('transactions'), JSON.stringify(transactions));
  },

  addTransaction(txn) {
    const txs = this.getTransactions();
    txn.id = txn.id || 'tx_' + Date.now();
    txs.unshift(txn);
    this.saveTransactions(txs);

    this.updateAccountBalance(txn.accountId, txn.amount, txn.type);
    return txn;
  },

  updateTransaction(id, updatedTxn) {
    const txs = this.getTransactions();
    const index = txs.findIndex(t => t.id === id);
    if (index === -1) return false;

    const oldTxn = txs[index];
    const reverseType = oldTxn.type === 'income' ? 'expense' : 'income';
    this.updateAccountBalance(oldTxn.accountId, oldTxn.amount, reverseType);

    updatedTxn.id = id;
    txs[index] = updatedTxn;
    this.saveTransactions(txs);

    this.updateAccountBalance(updatedTxn.accountId, updatedTxn.amount, updatedTxn.type);
    return true;
  },

  deleteTransaction(id) {
    const txs = this.getTransactions();
    const txn = txs.find(t => t.id === id);
    if (!txn) return false;

    const reverseType = txn.type === 'income' ? 'expense' : 'income';
    this.updateAccountBalance(txn.accountId, txn.amount, reverseType);

    const filtered = txs.filter(t => t.id !== id);
    this.saveTransactions(filtered);

    ReceiptsDB.deleteReceipt(id).catch(() => {});
    return true;
  },

  updateAccountBalance(accountId, amount, type) {
    const accounts = this.getAccounts();
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;

    const delta = parseFloat(amount) || 0;
    if (type === 'income') {
      acc.balance = (parseFloat(acc.balance) || 0) + delta;
    } else if (type === 'expense') {
      acc.balance = (parseFloat(acc.balance) || 0) - delta;
    }
    this.saveAccounts(accounts);
  },

  getExchangeRate() {
    const settings = this.getSettings();
    return parseFloat(settings.exchangeRateUSD) || 3.75;
  },

  convertAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    const rate = this.getExchangeRate();
    if (fromCurrency === 'USD' && toCurrency === 'PEN') {
      return amount * rate;
    }
    if (fromCurrency === 'PEN' && toCurrency === 'USD') {
      return amount / rate;
    }
    return amount;
  },

  getTotalNetWorthConsolidated() {
    const accounts = this.getAccounts();
    const settings = this.getSettings();
    const mainCurr = settings.currency || 'PEN';
    const rate = this.getExchangeRate();

    let totalInMain = 0;
    let totalInUSD = 0;
    let totalInPEN = 0;

    accounts.forEach(acc => {
      const bal = parseFloat(acc.balance) || 0;
      const accCurr = acc.currency || 'PEN';

      if (accCurr === 'USD') {
        totalInUSD += bal;
        totalInPEN += bal * rate;
      } else {
        totalInPEN += bal;
        totalInUSD += bal / rate;
      }
    });

    totalInMain = mainCurr === 'USD' ? totalInUSD : totalInPEN;
    const secondaryCurr = mainCurr === 'USD' ? 'PEN' : 'USD';
    const totalInSecondary = mainCurr === 'USD' ? totalInPEN : totalInUSD;

    return { totalInMain, totalInSecondary, mainCurr, secondaryCurr, rate };
  },

  getCurrencySymbol(currencyCode) {
    const symbols = {
      PEN: 'S/.',
      USD: '$',
      EUR: '€',
      COP: 'COL$',
      MXN: 'MEX$',
      CLP: 'CLP$',
      ARS: 'ARS$'
    };
    return symbols[currencyCode] || currencyCode || 'S/.';
  },

  formatMoney(amount, currencyCode = null) {
    const settings = this.getSettings();
    const code = currencyCode || settings.currency || 'PEN';
    const symbol = this.getCurrencySymbol(code);
    const num = Math.abs(parseFloat(amount) || 0);

    const formatted = num.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const sign = amount < 0 ? '-' : '';
    return `${sign}${symbol} ${formatted}`;
  },

  getRule50_30_20Analysis() {
    const txs = this.getTransactions();
    const cats = this.getCategories();
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const catBucketMap = {};
    cats.expense.forEach(c => { catBucketMap[c.name] = c.bucket || 'wants'; });

    let incomeTotal = 0;
    let needsTotal = 0;
    let wantsTotal = 0;

    txs.forEach(t => {
      const d = new Date(t.date + 'T00:00:00');
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        if (t.type === 'income') {
          incomeTotal += parseFloat(t.amount);
        } else if (t.type === 'expense') {
          const bucket = catBucketMap[t.category] || 'wants';
          if (bucket === 'needs') {
            needsTotal += parseFloat(t.amount);
          } else {
            wantsTotal += parseFloat(t.amount);
          }
        }
      }
    });

    const savingsTotal = Math.max(0, incomeTotal - (needsTotal + wantsTotal));

    const needsPct = incomeTotal > 0 ? (needsTotal / incomeTotal) * 100 : 0;
    const wantsPct = incomeTotal > 0 ? (wantsTotal / incomeTotal) * 100 : 0;
    const savingsPct = incomeTotal > 0 ? (savingsTotal / incomeTotal) * 100 : 0;

    return {
      incomeTotal,
      needsTotal,
      wantsTotal,
      savingsTotal,
      needsPct,
      wantsPct,
      savingsPct,
      idealNeeds: incomeTotal * 0.50,
      idealWants: incomeTotal * 0.30,
      idealSavings: incomeTotal * 0.20
    };
  },

  exportBackup() {
    const data = this.getAll();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    const username = (AuthModule.currentUser ? AuthModule.currentUser.username : 'user');
    a.href = url;
    a.download = `finanzflow_${username}_respaldo_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup(fileContent) {
    try {
      const data = JSON.parse(fileContent);
      if (!data.transactions || !data.accounts) {
        throw new Error('Estructura de archivo de respaldo no válida');
      }
      this.saveAll(data);
      return { success: true, message: 'Datos personales restaurados exitosamente' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  exportCSV() {
    const txs = this.getTransactions();
    const accounts = this.getAccounts();
    const accMap = {};
    accounts.forEach(a => { accMap[a.id] = a.name; });

    let csv = '\uFEFF';
    csv += 'ID,Fecha,Tipo,Categoría,Monto,Moneda,Cuenta,Descripción,Etiquetas,Recurrente\r\n';

    txs.forEach(t => {
      const row = [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.type === 'income' ? 'Ingreso' : 'Gasto'}"`,
        `"${t.category || ''}"`,
        `${t.amount}`,
        `"${t.currency || 'PEN'}"`,
        `"${accMap[t.accountId] || t.accountId}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.tags || []).join('; ')}"`,
        `"${t.isRecurring ? 'Sí' : 'No'}"`
      ];
      csv += row.join(',') + '\r\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    const username = (AuthModule.currentUser ? AuthModule.currentUser.username : 'user');
    a.href = url;
    a.download = `finanzflow_${username}_transacciones_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  restoreDemoData() {
    this.saveAll(SEED_DATA);
    return true;
  },

  clearAllData() {
    const userSettings = this.getSettings();
    const blankData = {
      settings: userSettings,
      accounts: [
        { id: 'acc_cash_' + this.activeUserId, name: 'Efectivo', type: 'cash', balance: 0.00, currency: 'PEN', icon: '💵', color: '#10b981' },
        { id: 'acc_bank_' + this.activeUserId, name: 'Cuenta Principal', type: 'bank', balance: 0.00, currency: 'PEN', icon: '🏦', color: '#0284c7' }
      ],
      categories: SEED_DATA.categories,
      budgets: [],
      goals: [],
      debts: [],
      transactions: []
    };
    this.saveAll(blankData);
    return true;
  }
};
