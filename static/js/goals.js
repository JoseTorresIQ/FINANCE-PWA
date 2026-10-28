// js/goals.js - Metas de Ahorro y Fondos de Inversión

const GoalsModule = {
  editingId: null,
  contributingGoalId: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Formulario de Meta (Crear / Editar)
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveForm();
      });
    }

    // Formulario de Aporte a Meta
    const contributeForm = document.getElementById('contribute-form');
    if (contributeForm) {
      contributeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveContribution();
      });
    }
  },

  renderGoalsView() {
    const container = document.getElementById('goals-list-container');
    const summaryCard = document.getElementById('goals-summary-card');
    if (!container) return;

    const goals = Storage.getGoals();

    let totalTarget = 0;
    let totalSaved = 0;

    goals.forEach(g => {
      totalTarget += parseFloat(g.targetAmount) || 0;
      totalSaved += parseFloat(g.currentAmount) || 0;
    });

    const globalPct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
    const remaining = Math.max(0, totalTarget - totalSaved);

    if (summaryCard) {
      summaryCard.innerHTML = `
        <div class="goal-summary-header">
          <div>
            <span class="text-muted text-sm">Progreso Global de Ahorros</span>
            <h2 class="goal-summary-total">${Storage.formatMoney(totalSaved)} <span class="goal-target-sub">de ${Storage.formatMoney(totalTarget)}</span></h2>
          </div>
          <span class="status-badge badge-info">${globalPct.toFixed(1)}% Alcanzado</span>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-fill fill-accent" style="width: ${globalPct}%"></div>
        </div>

        <div class="goal-summary-footer">
          <span>Metas activas: <b>${goals.length}</b></span>
          <span>Faltante total: <b class="text-accent">${Storage.formatMoney(remaining)}</b></span>
        </div>
      `;
    }

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <h3>Aún no tienes metas de ahorro</h3>
          <p>Tener objetivos claros (como un viaje, un curso o tu fondo de emergencia) acelera tu crecimiento financiero.</p>
          <button class="btn btn-primary" onclick="GoalsModule.openModal()">
            + Crear Primera Meta
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    const now = new Date();

    goals.forEach(g => {
      const target = parseFloat(g.targetAmount) || 1;
      const current = parseFloat(g.currentAmount) || 0;
      const pct = Math.min(100, (current / target) * 100);
      const isCompleted = current >= target;

      // Calcular tiempo restante
      const targetDate = new Date(g.targetDate + 'T00:00:00');
      const diffMs = targetDate - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let timeText = '';
      if (isCompleted) {
        timeText = '🎉 ¡Meta Cumplida!';
      } else if (diffDays <= 0) {
        timeText = '⚠️ Fecha límite alcanzada';
      } else {
        const months = Math.ceil(diffDays / 30);
        timeText = `${diffDays} días restantes (~${months} meses)`;
      }

      // Sugerencia de ahorro mensual
      const monthlyPace = (diffDays > 0 && !isCompleted)
        ? ((target - current) / Math.max(1, diffDays / 30))
        : 0;

      html += `
        <div class="goal-card ${isCompleted ? 'goal-completed' : ''}" style="border-top: 4px solid ${g.color || '#10b981'}">
          <div class="goal-card-header">
            <div class="goal-info-title">
              <span class="goal-icon-badge">${g.icon || '🎯'}</span>
              <div>
                <h4 class="goal-title">${g.title}</h4>
                <span class="goal-time-text ${diffDays <= 15 && !isCompleted ? 'text-expense' : 'text-muted'}">${timeText}</span>
              </div>
            </div>
            <div class="goal-card-actions">
              <button class="btn-icon" title="Editar" onclick="GoalsModule.editGoal('${g.id}')">✏️</button>
              <button class="btn-icon btn-icon-danger" title="Eliminar" onclick="GoalsModule.deleteGoal('${g.id}')">🗑️</button>
            </div>
          </div>

          <p class="goal-notes">${g.notes || 'Sin descripción adicional.'}</p>

          <div class="goal-progress-section">
            <div class="goal-amounts-row">
              <span class="text-sm">Ahorrado: <b>${Storage.formatMoney(current)}</b></span>
              <span class="goal-pct-badge" style="background: ${g.color || '#10b981'}25; color: ${g.color || '#10b981'}">${pct.toFixed(0)}%</span>
            </div>

            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${g.color || '#10b981'}"></div>
            </div>

            <div class="goal-footer-meta">
              <span class="text-sm text-muted">Objetivo: <b>${Storage.formatMoney(target)}</b></span>
              ${monthlyPace > 0 ? `<span class="text-sm goal-pace">Ahorro sugerido: <b>${Storage.formatMoney(monthlyPace)}/mes</b></span>` : ''}
            </div>
          </div>

          <div class="goal-action-btn-row">
            <button class="btn btn-outline-primary btn-block" onclick="GoalsModule.openContributeModal('${g.id}')">
              💰 Aportar Fondos
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  openModal() {
    this.editingId = null;
    const modal = document.getElementById('goal-modal');
    const form = document.getElementById('goal-form');
    const title = document.getElementById('modal-goal-title');

    if (form) form.reset();

    // Fecha default a 6 meses
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 6);
    document.getElementById('modal-goal-date').value = defaultDate.toISOString().split('T')[0];

    if (title) title.innerText = 'Nueva Meta de Ahorro';
    if (modal) modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('goal-modal');
    if (modal) modal.classList.remove('active');
    this.editingId = null;
  },

  editGoal(id) {
    const goals = Storage.getGoals();
    const g = goals.find(item => item.id === id);
    if (!g) return;

    this.editingId = id;
    const modal = document.getElementById('goal-modal');
    const title = document.getElementById('modal-goal-title');

    document.getElementById('modal-goal-title-input').value = g.title;
    document.getElementById('modal-goal-target').value = g.targetAmount;
    document.getElementById('modal-goal-current').value = g.currentAmount;
    document.getElementById('modal-goal-date').value = g.targetDate;
    document.getElementById('modal-goal-icon').value = g.icon || '🎯';
    document.getElementById('modal-goal-color').value = g.color || '#10b981';
    document.getElementById('modal-goal-notes').value = g.notes || '';

    if (title) title.innerText = 'Editar Meta';
    if (modal) modal.classList.add('active');
  },

  saveForm() {
    const title = document.getElementById('modal-goal-title-input').value.trim();
    const targetAmount = parseFloat(document.getElementById('modal-goal-target').value);
    const currentAmount = parseFloat(document.getElementById('modal-goal-current').value) || 0;
    const targetDate = document.getElementById('modal-goal-date').value;
    const icon = document.getElementById('modal-goal-icon').value || '🎯';
    const color = document.getElementById('modal-goal-color').value || '#10b981';
    const notes = document.getElementById('modal-goal-notes').value.trim();

    if (!title || isNaN(targetAmount) || targetAmount <= 0) {
      App.showToast('Ingresa un título y monto objetivo válido', 'warning');
      return;
    }

    const goals = Storage.getGoals();

    if (this.editingId) {
      const idx = goals.findIndex(g => g.id === this.editingId);
      if (idx !== -1) {
        goals[idx] = {
          ...goals[idx],
          title,
          targetAmount,
          currentAmount,
          targetDate,
          icon,
          color,
          notes
        };
      }
      App.showToast('Meta actualizada', 'success');
    } else {
      goals.push({
        id: 'goal_' + Date.now(),
        title,
        targetAmount,
        currentAmount,
        targetDate,
        icon,
        color,
        notes
      });
      App.showToast('Nueva meta creada', 'success');
    }

    Storage.saveGoals(goals);
    this.closeModal();
    this.renderGoalsView();
    App.refreshDashboardMetrics();
  },

  openContributeModal(goalId) {
    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    this.contributingGoalId = goalId;
    const modal = document.getElementById('contribute-modal');
    const form = document.getElementById('contribute-form');
    const title = document.getElementById('contribute-goal-name');
    const accountSelect = document.getElementById('contribute-account-select');

    if (form) form.reset();
    if (title) title.innerText = goal.title;

    // Llenar select de cuentas con fondos
    const accounts = Storage.getAccounts();
    let html = '';
    accounts.forEach(a => {
      html += `<option value="${a.id}">${a.icon} ${a.name} (Saldo: ${Storage.formatMoney(a.balance)})</option>`;
    });
    if (accountSelect) accountSelect.innerHTML = html;

    if (modal) modal.classList.add('active');
  },

  closeContributeModal() {
    const modal = document.getElementById('contribute-modal');
    if (modal) modal.classList.remove('active');
    this.contributingGoalId = null;
  },

  saveContribution() {
    const amount = parseFloat(document.getElementById('contribute-amount').value);
    const accountId = document.getElementById('contribute-account-select').value;

    if (isNaN(amount) || amount <= 0) {
      App.showToast('Ingresa un monto de aporte válido', 'warning');
      return;
    }

    const accounts = Storage.getAccounts();
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;

    if (acc.balance < amount) {
      if (!confirm(`La cuenta seleccionada tiene saldo menor (${Storage.formatMoney(acc.balance)}). ¿Deseas continuar de todas formas?`)) {
        return;
      }
    }

    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === this.contributingGoalId);
    if (!goal) return;

    // Sumar a la meta
    goal.currentAmount = (parseFloat(goal.currentAmount) || 0) + amount;
    Storage.saveGoals(goals);

    // Registrar como gasto / transferencia en la cuenta
    Storage.addTransaction({
      type: 'expense',
      amount,
      category: 'Ahorro / Metas',
      accountId,
      date: new Date().toISOString().split('T')[0],
      description: `Aporte a meta: ${goal.title}`,
      tags: ['ahorro', 'meta'],
      isRecurring: false
    });

    App.showToast(`¡Aporte de ${Storage.formatMoney(amount)} registrado con éxito! 🎉`, 'success');
    this.closeContributeModal();
    App.refreshAllViews();
  },

  deleteGoal(id) {
    if (confirm('¿Deseas eliminar esta meta de ahorro?')) {
      const goals = Storage.getGoals().filter(g => g.id !== id);
      Storage.saveGoals(goals);
      App.showToast('Meta eliminada', 'info');
      this.renderGoalsView();
      App.refreshDashboardMetrics();
    }
  }
};
