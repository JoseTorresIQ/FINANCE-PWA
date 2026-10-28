// js/budgets.js - Control de Presupuestos Mensuales por Categoría

const BudgetsModule = {
  editingId: null,

  init() {
    this.bindEvents();
    this.populateCategorySelect();
  },

  bindEvents() {
    const form = document.getElementById('budget-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveForm();
      });
    }
  },

  populateCategorySelect() {
    const cats = Storage.getCategories();
    const select = document.getElementById('modal-budget-category');
    if (!select) return;

    let html = '';
    cats.expense.forEach(c => {
      html += `<option value="${c.name}">${c.icon} ${c.name}</option>`;
    });
    select.innerHTML = html;
  },

  getCurrentMonthSpendingByCategory() {
    const txs = Storage.getTransactions();
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const spending = {};

    txs.forEach(t => {
      if (t.type === 'expense') {
        const d = new Date(t.date + 'T00:00:00');
        if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
          spending[t.category] = (spending[t.category] || 0) + parseFloat(t.amount);
        }
      }
    });

    return spending;
  },

  renderBudgetsView() {
    const container = document.getElementById('budgets-list-container');
    const summaryCard = document.getElementById('budgets-summary-card');
    if (!container) return;

    const budgets = Storage.getBudgets();
    const spendingMap = this.getCurrentMonthSpendingByCategory();
    const cats = Storage.getCategories();
    const catMap = {};
    cats.expense.forEach(c => { catMap[c.name] = c; });

    let totalBudgeted = 0;
    let totalSpent = 0;

    budgets.forEach(b => {
      totalBudgeted += parseFloat(b.limit) || 0;
      totalSpent += spendingMap[b.category] || 0;
    });

    const globalPct = totalBudgeted > 0 ? Math.min(100, (totalSpent / totalBudgeted) * 100) : 0;
    const remainingTotal = totalBudgeted - totalSpent;

    // Renderizar tarjeta de resumen
    if (summaryCard) {
      const statusText = remainingTotal >= 0 ? 'Finanzas Saludables' : 'Límite Excedido';
      const statusClass = remainingTotal >= 0 ? 'badge-success' : 'badge-danger';

      summaryCard.innerHTML = `
        <div class="budget-summary-header">
          <div>
            <span class="text-muted text-sm">Ejecución del Presupuesto (Mes Actual)</span>
            <h2 class="budget-summary-total">${Storage.formatMoney(totalSpent)} <span class="budget-limit-sub">de ${Storage.formatMoney(totalBudgeted)}</span></h2>
          </div>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-fill ${globalPct > 90 ? 'fill-danger' : globalPct > 75 ? 'fill-warning' : 'fill-success'}" 
               style="width: ${globalPct}%"></div>
        </div>

        <div class="budget-summary-footer">
          <span>Utilizado: <b>${globalPct.toFixed(1)}%</b></span>
          <span>Disponible: <b class="${remainingTotal >= 0 ? 'text-income' : 'text-expense'}">${Storage.formatMoney(remainingTotal)}</b></span>
        </div>
      `;
    }

    if (budgets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <h3>Sin presupuestos configurados</h3>
          <p>Establece límites de gasto para tus categorías principales y evita fugas de dinero.</p>
          <button class="btn btn-primary" onclick="BudgetsModule.openModal()">
            + Crear Presupuesto
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    budgets.forEach(b => {
      const limit = parseFloat(b.limit) || 0;
      const spent = spendingMap[b.category] || 0;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      const diff = limit - spent;
      const cat = catMap[b.category] || { icon: '🏷️', color: '#6366f1' };

      let statusColor = '#10b981';
      let progressClass = 'fill-success';
      let alertMsg = '';

      if (pct > 100) {
        statusColor = '#ef4444';
        progressClass = 'fill-danger';
        alertMsg = `<div class="budget-alert-badge">⚠️ Excedido por ${Storage.formatMoney(Math.abs(diff))}</div>`;
      } else if (pct >= 80) {
        statusColor = '#f59e0b';
        progressClass = 'fill-warning';
        alertMsg = `<div class="budget-warning-badge">⚡ Alerta: Te queda ${Storage.formatMoney(diff)}</div>`;
      }

      html += `
        <div class="budget-card">
          <div class="budget-card-header">
            <div class="budget-cat-info">
              <span class="budget-icon" style="background-color: ${cat.color}20">${cat.icon}</span>
              <div>
                <h4 class="budget-title">${b.category}</h4>
                <span class="budget-subtitle">Límite mensual: ${Storage.formatMoney(limit)}</span>
              </div>
            </div>
            <div class="budget-card-actions">
              <button class="btn-icon" title="Editar" onclick="BudgetsModule.editBudget('${b.id}')">✏️</button>
              <button class="btn-icon btn-icon-danger" title="Eliminar" onclick="BudgetsModule.deleteBudget('${b.id}')">🗑️</button>
            </div>
          </div>

          <div class="budget-amounts-row">
            <span class="budget-spent-txt">Gastado: <b>${Storage.formatMoney(spent)}</b></span>
            <span class="budget-pct-txt" style="color: ${statusColor}">${pct.toFixed(0)}%</span>
          </div>

          <div class="progress-bar-container">
            <div class="progress-bar-fill ${progressClass}" style="width: ${Math.min(100, pct)}%"></div>
          </div>

          <div class="budget-footer-row">
            <span class="text-sm text-muted">Disponible: <b class="${diff >= 0 ? 'text-income' : 'text-expense'}">${Storage.formatMoney(diff)}</b></span>
            ${alertMsg}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  openModal() {
    this.editingId = null;
    const modal = document.getElementById('budget-modal');
    const form = document.getElementById('budget-form');
    const title = document.getElementById('modal-budget-title');

    if (form) form.reset();
    this.populateCategorySelect();

    if (title) title.innerText = 'Nuevo Presupuesto';
    if (modal) modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('budget-modal');
    if (modal) modal.classList.remove('active');
    this.editingId = null;
  },

  editBudget(id) {
    const budgets = Storage.getBudgets();
    const bgt = budgets.find(b => b.id === id);
    if (!bgt) return;

    this.editingId = id;
    const modal = document.getElementById('budget-modal');
    const title = document.getElementById('modal-budget-title');

    this.populateCategorySelect();
    document.getElementById('modal-budget-category').value = bgt.category;
    document.getElementById('modal-budget-limit').value = bgt.limit;

    if (title) title.innerText = 'Editar Presupuesto';
    if (modal) modal.classList.add('active');
  },

  saveForm() {
    const cat = document.getElementById('modal-budget-category').value;
    const limit = parseFloat(document.getElementById('modal-budget-limit').value);

    if (isNaN(limit) || limit <= 0) {
      App.showToast('El límite mensual debe ser mayor a 0', 'warning');
      return;
    }

    const budgets = Storage.getBudgets();

    if (this.editingId) {
      const idx = budgets.findIndex(b => b.id === this.editingId);
      if (idx !== -1) {
        budgets[idx].category = cat;
        budgets[idx].limit = limit;
      }
      App.showToast('Presupuesto actualizado', 'success');
    } else {
      // Verificar si ya existe para esa categoría
      const existing = budgets.find(b => b.category === cat);
      if (existing) {
        existing.limit = limit;
        App.showToast('Presupuesto actualizado para ' + cat, 'info');
      } else {
        budgets.push({
          id: 'bgt_' + Date.now(),
          category: cat,
          limit,
          period: 'monthly'
        });
        App.showToast('Nuevo presupuesto creado', 'success');
      }
    }

    Storage.saveBudgets(budgets);
    this.closeModal();
    this.renderBudgetsView();
    App.refreshDashboardMetrics();
  },

  deleteBudget(id) {
    if (confirm('¿Eliminar este presupuesto?')) {
      const budgets = Storage.getBudgets().filter(b => b.id !== id);
      Storage.saveBudgets(budgets);
      App.showToast('Presupuesto eliminado', 'info');
      this.renderBudgetsView();
      App.refreshDashboardMetrics();
    }
  }
};
