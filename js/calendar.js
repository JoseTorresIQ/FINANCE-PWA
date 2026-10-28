// js/calendar.js - Calendario Financiero de Vencimientos, Servicios y Pagos Recurrentes

const CalendarModule = {
  viewDate: new Date(),
  selectedDay: null,

  init() {
    this.selectedDay = this.viewDate.getDate();
    this.bindEvents();
  },

  bindEvents() {
    const prevBtn = document.getElementById('cal-prev-month');
    const nextBtn = document.getElementById('cal-next-month');
    const todayBtn = document.getElementById('cal-today-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        this.renderCalendar();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.viewDate = new Date();
        this.selectedDay = this.viewDate.getDate();
        this.renderCalendar();
      });
    }
  },

  renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('cal-month-title');
    if (!grid) return;

    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    if (title) title.innerText = `${monthNames[month]} ${year}`;

    // Primer día del mes y total de días
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Dom, 1: Lun, ...
    // Ajustar para que la semana empiece en Lunes (0: Lun ... 6: Dom)
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Recopilar eventos del mes
    const eventsMap = this.collectMonthEvents(year, month);

    let html = '';

    // Días del mes anterior (grises)
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      html += `<div class="calendar-day other-month">${dayNum}</div>`;
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = isCurrentMonth && d === today.getDate();
      const isSelected = d === this.selectedDay;
      const dayEvents = eventsMap[d] || [];

      let dotsHtml = '';
      if (dayEvents.length > 0) {
        dotsHtml += '<div class="cal-dots-row">';
        dayEvents.slice(0, 3).forEach(ev => {
          dotsHtml += `<span class="cal-dot dot-${ev.type}" title="${ev.title}"></span>`;
        });
        if (dayEvents.length > 3) {
          dotsHtml += `<span class="cal-dot-more">+${dayEvents.length - 3}</span>`;
        }
        dotsHtml += '</div>';
      }

      html += `
        <div class="calendar-day current-month ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
             onclick="CalendarModule.selectDay(${d})">
          <span class="day-number">${d}</span>
          ${dotsHtml}
        </div>
      `;
    }

    // Completar última fila
    const totalCells = startOffset + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let j = 1; j <= remainingCells; j++) {
      html += `<div class="calendar-day other-month">${j}</div>`;
    }

    grid.innerHTML = html;

    this.renderSelectedDayDetails(eventsMap[this.selectedDay] || []);
    this.renderUpcomingBills();
  },

  selectDay(d) {
    this.selectedDay = d;
    this.renderCalendar();
  },

  collectMonthEvents(year, month) {
    const events = {}; // day -> array of events
    const addEvent = (day, ev) => {
      if (!events[day]) events[day] = [];
      events[day].push(ev);
    };

    // 1. Transacciones recurrentes (Gastos fijos y sueldos)
    const txs = Storage.getTransactions();
    txs.forEach(t => {
      if (t.isRecurring) {
        const dObj = new Date(t.date + 'T00:00:00');
        const day = t.dueDay || dObj.getDate();
        addEvent(day, {
          title: t.description || t.category,
          amount: t.amount,
          type: t.type === 'income' ? 'income' : 'bill',
          category: t.category,
          tag: 'Recurrente'
        });
      }
    });

    // 2. Vencimientos de Tarjetas y Deudas
    const debts = Storage.getDebts();
    debts.forEach(debt => {
      if (debt.dueDate) {
        addEvent(debt.dueDate, {
          title: `Pago mínimo: ${debt.name}`,
          amount: debt.minPayment,
          type: 'debt',
          category: 'Deuda / Tarjeta',
          tag: `TEA ${debt.interestRate}%`
        });
      }
    });

    // 3. Metas con fecha límite este mes
    const goals = Storage.getGoals();
    goals.forEach(g => {
      const gDate = new Date(g.targetDate + 'T00:00:00');
      if (gDate.getFullYear() === year && gDate.getMonth() === month) {
        addEvent(gDate.getDate(), {
          title: `Límite meta: ${g.title}`,
          amount: g.targetAmount - g.currentAmount,
          type: 'goal',
          category: 'Meta de Ahorro',
          tag: 'Objetivo'
        });
      }
    });

    return events;
  },

  renderSelectedDayDetails(dayEvents) {
    const container = document.getElementById('cal-day-agenda');
    const titleEl = document.getElementById('cal-agenda-date-title');
    if (!container) return;

    if (titleEl) {
      titleEl.innerText = `Agenda para el día ${this.selectedDay}`;
    }

    if (dayEvents.length === 0) {
      container.innerHTML = `
        <div class="empty-state-sm">
          <p class="text-muted">No hay vencimientos ni pagos programados para este día.</p>
          <button class="btn btn-outline-primary btn-sm" onclick="TransactionsModule.openModal('expense')">
            + Registrar en esta fecha
          </button>
        </div>
      `;
      return;
    }

    let html = '<div class="agenda-items-list">';
    dayEvents.forEach(ev => {
      const typeIcons = {
        bill: '⚡',
        income: '💰',
        debt: '💳',
        goal: '🎯'
      };

      const typeLabels = {
        bill: 'Servicio / Pago Fijo',
        income: 'Ingreso Programado',
        debt: 'Vencimiento Tarjeta/Deuda',
        goal: 'Meta de Ahorro'
      };

      html += `
        <div class="agenda-item-card agenda-${ev.type}">
          <div class="agenda-left">
            <span class="agenda-icon">${typeIcons[ev.type] || '📌'}</span>
            <div>
              <h5 class="agenda-item-title">${ev.title}</h5>
              <span class="agenda-item-type">${typeLabels[ev.type]} • ${ev.category}</span>
            </div>
          </div>
          <div class="agenda-right">
            <span class="agenda-amount">${Storage.formatMoney(ev.amount)}</span>
            <button class="btn btn-secondary btn-sm" onclick="CalendarModule.payEvent('${ev.title}', ${ev.amount}, '${ev.category}')">
              Pagar ✓
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  },

  renderUpcomingBills() {
    const container = document.getElementById('cal-upcoming-bills');
    if (!container) return;

    const today = new Date();
    const curDay = today.getDate();

    // Buscar eventos en los próximos 15 días
    const eventsMap = this.collectMonthEvents(today.getFullYear(), today.getMonth());
    const upcoming = [];

    for (let d = curDay; d <= Math.min(31, curDay + 15); d++) {
      if (eventsMap[d]) {
        eventsMap[d].forEach(ev => {
          if (ev.type === 'bill' || ev.type === 'debt') {
            upcoming.push({ ...ev, day: d, daysLeft: d - curDay });
          }
        });
      }
    }

    if (upcoming.length === 0) {
      container.innerHTML = `<p class="text-muted text-sm">🎉 ¡Sin pagos urgentes en los próximos 15 días!</p>`;
      return;
    }

    let html = '<div class="upcoming-bills-list">';
    upcoming.forEach(b => {
      const badgeClass = b.daysLeft <= 2 ? 'badge-danger' : b.daysLeft <= 5 ? 'badge-warning' : 'badge-info';
      const daysText = b.daysLeft === 0 ? '¡Vence Hoy!' : b.daysLeft === 1 ? 'Vence Mañana' : `En ${b.daysLeft} días (Día ${b.day})`;

      html += `
        <div class="upcoming-bill-row">
          <div>
            <div class="upcoming-bill-name">${b.title}</div>
            <span class="status-badge ${badgeClass}">${daysText}</span>
          </div>
          <div class="upcoming-bill-right">
            <span class="upcoming-bill-amount">${Storage.formatMoney(b.amount)}</span>
            <button class="btn btn-outline-primary btn-sm" onclick="CalendarModule.payEvent('${b.title}', ${b.amount}, '${b.category}')">
              Registrar
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  },

  payEvent(title, amount, category) {
    TransactionsModule.openModal('expense');
    setTimeout(() => {
      document.getElementById('modal-txn-amount').value = amount;
      document.getElementById('modal-txn-desc').value = `Pago: ${title}`;
      const catSelect = document.getElementById('modal-txn-category');
      if (catSelect) {
        for (let i = 0; i < catSelect.options.length; i++) {
          if (catSelect.options[i].value === category) {
            catSelect.selectedIndex = i;
            break;
          }
        }
      }
    }, 150);
  }
};
