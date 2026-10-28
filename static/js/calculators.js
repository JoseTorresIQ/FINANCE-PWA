// js/calculators.js - Calculadora de Deudas (Bola de Nieve vs Avalancha) e Interés Compuesto

const CalculatorsModule = {
  currentDebtStrategy: 'avalanche', // 'avalanche' | 'snowball'

  init() {
    this.bindEvents();
    this.renderDebtList();
    this.calculateDebtPayoff();
    this.calculateCompoundInterest();
  },

  bindEvents() {
    // Alternar estrategia de deuda
    const stratRadios = document.querySelectorAll('input[name="debt-strategy"]');
    stratRadios.forEach(r => {
      r.addEventListener('change', (e) => {
        this.currentDebtStrategy = e.target.value;
        this.calculateDebtPayoff();
      });
    });

    // Cambio en presupuesto de pago de deudas
    const budgetInput = document.getElementById('debt-monthly-budget');
    if (budgetInput) {
      budgetInput.addEventListener('input', () => this.calculateDebtPayoff());
    }

    // Formulario de nueva deuda
    const debtForm = document.getElementById('add-debt-form');
    if (debtForm) {
      debtForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addDebt();
      });
    }

    // Eventos calculadora de interés compuesto
    ['comp-initial', 'comp-monthly', 'comp-rate', 'comp-years'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateCompoundInterest());
    });
  },

  // -------------------------------------------------------------
  // SIMULADOR DE DEUDAS (AVALANCHA vs BOLA DE NIEVE)
  // -------------------------------------------------------------
  renderDebtList() {
    const container = document.getElementById('debts-items-container');
    if (!container) return;

    const debts = Storage.getDebts();
    let totalBalance = 0;
    let totalMin = 0;

    debts.forEach(d => {
      totalBalance += parseFloat(d.balance) || 0;
      totalMin += parseFloat(d.minPayment) || 0;
    });

    const budgetInput = document.getElementById('debt-monthly-budget');
    if (budgetInput && (!budgetInput.value || parseFloat(budgetInput.value) < totalMin)) {
      budgetInput.value = Math.ceil(totalMin * 1.25); // 25% por encima del mínimo sugerido
    }

    if (debts.length === 0) {
      container.innerHTML = `
        <div class="empty-state-sm">
          <p class="text-muted">No tienes deudas registradas. ¡Felicitaciones o añade una para simular!</p>
        </div>
      `;
      return;
    }

    let html = '';
    debts.forEach((d, idx) => {
      html += `
        <div class="debt-card-row">
          <div class="debt-card-left">
            <span class="debt-order-num">#${idx + 1}</span>
            <div>
              <div class="debt-name">${d.name}</div>
              <div class="debt-meta">TEA: <b>${d.interestRate}%</b> • Pago Mínimo: ${Storage.formatMoney(d.minPayment)}</div>
            </div>
          </div>
          <div class="debt-card-right">
            <div class="debt-balance">${Storage.formatMoney(d.balance)}</div>
            <button class="btn-icon btn-icon-danger" title="Eliminar" onclick="CalculatorsModule.deleteDebt('${d.id}')">🗑️</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  addDebt() {
    const name = document.getElementById('modal-debt-name').value.trim();
    const balance = parseFloat(document.getElementById('modal-debt-balance').value);
    const interestRate = parseFloat(document.getElementById('modal-debt-rate').value);
    const minPayment = parseFloat(document.getElementById('modal-debt-min').value);
    const dueDate = parseInt(document.getElementById('modal-debt-day').value, 10) || 15;

    if (!name || isNaN(balance) || isNaN(interestRate) || isNaN(minPayment)) {
      App.showToast('Por favor completa todos los campos con valores válidos', 'warning');
      return;
    }

    const debts = Storage.getDebts();
    debts.push({
      id: 'debt_' + Date.now(),
      name,
      balance,
      interestRate,
      minPayment,
      dueDate
    });

    Storage.saveDebts(debts);
    this.renderDebtList();
    this.calculateDebtPayoff();
    App.showToast('Deuda agregada a la simulación', 'success');

    document.getElementById('add-debt-form').reset();
    document.getElementById('debt-modal').classList.remove('active');
  },

  deleteDebt(id) {
    if (confirm('¿Eliminar esta deuda del simulador?')) {
      const debts = Storage.getDebts().filter(d => d.id !== id);
      Storage.saveDebts(debts);
      this.renderDebtList();
      this.calculateDebtPayoff();
      App.showToast('Deuda eliminada', 'info');
    }
  },

  calculateDebtPayoff() {
    const debts = Storage.getDebts();
    const resultBox = document.getElementById('debt-results-card');
    if (!resultBox || debts.length === 0) return;

    const monthlyBudget = parseFloat(document.getElementById('debt-monthly-budget').value) || 0;
    const totalMin = debts.reduce((sum, d) => sum + (parseFloat(d.minPayment) || 0), 0);

    if (monthlyBudget < totalMin) {
      resultBox.innerHTML = `
        <div class="alert-box-warning">
          ⚠️ Tu presupuesto mensual (${Storage.formatMoney(monthlyBudget)}) es menor a la suma de los pagos mínimos (${Storage.formatMoney(totalMin)}). Aumenta el presupuesto mensual para simular la liquidación.
        </div>
      `;
      return;
    }

    // Ejecutar ambas simulaciones para comparar
    const simAvalanche = this.simulateStrategy(debts, monthlyBudget, 'avalanche');
    const simSnowball = this.simulateStrategy(debts, monthlyBudget, 'snowball');

    const activeSim = this.currentDebtStrategy === 'avalanche' ? simAvalanche : simSnowball;
    const interestSaved = Math.abs(simSnowball.totalInterest - simAvalanche.totalInterest);

    resultBox.innerHTML = `
      <div class="debt-metrics-grid">
        <div class="debt-metric-box">
          <span class="text-muted text-sm">Tiempo para Liquidar</span>
          <h3 class="debt-metric-val">${activeSim.months} meses</h3>
          <span class="text-sm text-accent">~${(activeSim.months / 12).toFixed(1)} años</span>
        </div>

        <div class="debt-metric-box">
          <span class="text-muted text-sm">Intereses Totales</span>
          <h3 class="debt-metric-val text-expense">${Storage.formatMoney(activeSim.totalInterest)}</h3>
          <span class="text-sm text-muted">Costo del financiamiento</span>
        </div>

        <div class="debt-metric-box">
          <span class="text-muted text-sm">Ahorro con Avalancha</span>
          <h3 class="debt-metric-val text-income">${Storage.formatMoney(interestSaved)}</h3>
          <span class="text-sm text-muted">Diferencia entre métodos</span>
        </div>
      </div>

      <div class="debt-strategy-explanation">
        <p><b>Estrategia actual: ${this.currentDebtStrategy === 'avalanche' ? 'Avalancha (Mayor Interés Primero)' : 'Bola de Nieve (Menor Saldo Primero)'}</b></p>
        <p class="text-muted text-sm">
          ${this.currentDebtStrategy === 'avalanche'
            ? '🔥 La Avalancha es la más eficiente matemáticamente: pagas los mínimos de todo y abonas todo el dinero extra a la deuda con mayor tasa (TEA), ahorrando el máximo en intereses.'
            : '❄️ La Bola de Nieve busca victorias psicológicas rápidas: eliminas primero la deuda más pequeña, liberando flujo de caja mental para atacar las siguientes.'}
        </p>
      </div>

      <div class="debt-schedule-table">
        <h4 style="margin-bottom: 12px; font-size: 0.95rem;">Orden Óptimo de Liquidación</h4>
        <div class="debt-order-list">
          ${activeSim.orderList.map((item, i) => `
            <div class="debt-order-step">
              <span class="step-num">${i + 1}</span>
              <div class="step-info">
                <strong>${item.name}</strong>
                <span class="text-sm text-muted">Saldo inicial: ${Storage.formatMoney(item.initialBalance)} • TEA ${item.interestRate}%</span>
              </div>
              <span class="step-badge">Liquidada en mes ${item.payoffMonth}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  simulateStrategy(rawDebts, monthlyBudget, strategy) {
    // Clonar lista de deudas
    let debts = rawDebts.map(d => ({
      id: d.id,
      name: d.name,
      balance: parseFloat(d.balance),
      initialBalance: parseFloat(d.balance),
      interestRate: parseFloat(d.interestRate),
      minPayment: parseFloat(d.minPayment),
      payoffMonth: 0
    }));

    // Ordenar según estrategia
    if (strategy === 'avalanche') {
      // Mayor tasa primero
      debts.sort((a, b) => b.interestRate - a.interestRate);
    } else {
      // Menor saldo primero
      debts.sort((a, b) => a.balance - b.balance);
    }

    let months = 0;
    let totalInterest = 0;
    const maxMonths = 360; // 30 años límite de seguridad
    const orderList = [];

    while (debts.some(d => d.balance > 0) && months < maxMonths) {
      months++;
      let extraCash = monthlyBudget;

      // 1. Calcular intereses del mes y pagar mínimos
      debts.forEach(d => {
        if (d.balance > 0) {
          // Tasa efectiva mensual aprox: (1 + TEA)^(1/12) - 1
          const monthlyRate = Math.pow(1 + (d.interestRate / 100), 1 / 12) - 1;
          const monthInterest = d.balance * monthlyRate;
          totalInterest += monthInterest;
          d.balance += monthInterest;

          const payment = Math.min(d.balance, d.minPayment);
          d.balance -= payment;
          extraCash -= payment;
        }
      });

      // 2. Abonar todo el dinero extra a la primera deuda con saldo > 0
      for (let i = 0; i < debts.length; i++) {
        const d = debts[i];
        if (d.balance > 0 && extraCash > 0) {
          const extraPay = Math.min(d.balance, extraCash);
          d.balance -= extraPay;
          extraCash -= extraPay;

          if (d.balance <= 0.01) {
            d.balance = 0;
            d.payoffMonth = months;
            orderList.push({ ...d });
          }
        }
      }
    }

    return { months, totalInterest, orderList };
  },

  // -------------------------------------------------------------
  // CALCULADORA DE INTERÉS COMPUESTO & PROYECCIÓN
  // -------------------------------------------------------------
  calculateCompoundInterest() {
    const initial = parseFloat(document.getElementById('comp-initial').value) || 0;
    const monthly = parseFloat(document.getElementById('comp-monthly').value) || 0;
    const annualRate = (parseFloat(document.getElementById('comp-rate').value) || 0) / 100;
    const years = parseInt(document.getElementById('comp-years').value, 10) || 5;

    const totalMonths = years * 12;
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

    let balance = initial;
    let totalInvested = initial;

    const yearlyData = [];

    for (let m = 1; m <= totalMonths; m++) {
      balance = balance * (1 + monthlyRate) + monthly;
      totalInvested += monthly;

      if (m % 12 === 0) {
        const yr = m / 12;
        yearlyData.push({
          year: yr,
          invested: totalInvested,
          interest: balance - totalInvested,
          total: balance
        });
      }
    }

    const totalInterest = Math.max(0, balance - totalInvested);

    // Actualizar resumen
    const elFinal = document.getElementById('comp-res-final');
    const elInvested = document.getElementById('comp-res-invested');
    const elInterest = document.getElementById('comp-res-interest');

    if (elFinal) elFinal.innerText = Storage.formatMoney(balance);
    if (elInvested) elInvested.innerText = Storage.formatMoney(totalInvested);
    if (elInterest) elInterest.innerText = Storage.formatMoney(totalInterest);

    // Tabla de proyección
    const tableBody = document.getElementById('comp-table-body');
    if (tableBody) {
      let html = '';
      yearlyData.forEach(row => {
        html += `
          <tr>
            <td>Año ${row.year}</td>
            <td>${Storage.formatMoney(row.invested)}</td>
            <td class="text-income">+${Storage.formatMoney(row.interest)}</td>
            <td><strong>${Storage.formatMoney(row.total)}</strong></td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    }
  }
};
