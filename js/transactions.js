// js/transactions.js - Gestión de Transacciones, Filtros, Bimoneda y Comprobantes IndexedDB

const TransactionsModule = {
  currentFilter: {
    search: '',
    type: 'all',
    category: 'all',
    account: 'all',
    dateRange: 'this_month'
  },
  editingId: null,
  currentReceiptBase64: null,

  init() {
    this.bindEvents();
    this.renderCategoryOptions();
    this.renderAccountOptions();
  },

  bindEvents() {
    const searchInput = document.getElementById('txn-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilter.search = e.target.value.trim().toLowerCase();
        this.renderTransactionList();
      });
    }

    const typeFilter = document.getElementById('txn-type-filter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.currentFilter.type = e.target.value;
        this.renderTransactionList();
      });
    }

    const catFilter = document.getElementById('txn-category-filter');
    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        this.currentFilter.category = e.target.value;
        this.renderTransactionList();
      });
    }

    const accFilter = document.getElementById('txn-account-filter');
    if (accFilter) {
      accFilter.addEventListener('change', (e) => {
        this.currentFilter.account = e.target.value;
        this.renderTransactionList();
      });
    }

    const timeFilter = document.getElementById('txn-time-filter');
    if (timeFilter) {
      timeFilter.addEventListener('change', (e) => {
        this.currentFilter.dateRange = e.target.value;
        this.renderTransactionList();
      });
    }

    // Toggle Tipo (Gasto vs Ingreso)
    const formTypeRadios = document.querySelectorAll('input[name="modal-txn-type"]');
    formTypeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.updateModalCategories(e.target.value);
      });
    });

    // Guardar formulario
    const form = document.getElementById('transaction-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveForm();
      });
    }

    // Input de foto/comprobante
    const receiptInput = document.getElementById('modal-txn-receipt');
    if (receiptInput) {
      receiptInput.addEventListener('change', (e) => this.handleReceiptUpload(e));
    }
  },

  handleReceiptUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      App.showToast('Por favor selecciona un archivo de imagen válido', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      this.currentReceiptBase64 = event.target.result;
      const preview = document.getElementById('modal-receipt-preview');
      if (preview) {
        preview.src = this.currentReceiptBase64;
        preview.style.display = 'block';
      }
      App.showToast('Foto de comprobante cargada 🧾', 'info');
    };
    reader.readAsDataURL(file);
  },

  clearReceipt() {
    this.currentReceiptBase64 = null;
    const input = document.getElementById('modal-txn-receipt');
    const preview = document.getElementById('modal-receipt-preview');
    if (input) input.value = '';
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
    }
  },

  renderCategoryOptions() {
    const cats = Storage.getCategories();
    const filterSelect = document.getElementById('txn-category-filter');
    if (filterSelect) {
      let html = '<option value="all">Todas las categorías</option>';
      const allList = [...cats.expense, ...cats.income];
      allList.forEach(c => {
        html += `<option value="${c.name}">${c.icon} ${c.name}</option>`;
      });
      filterSelect.innerHTML = html;
    }
  },

  renderAccountOptions() {
    const accounts = Storage.getAccounts();
    const filterSelect = document.getElementById('txn-account-filter');
    const modalSelect = document.getElementById('modal-txn-account');

    let filterHtml = '<option value="all">Todas las cuentas</option>';
    let modalHtml = '';

    accounts.forEach(a => {
      filterHtml += `<option value="${a.id}">${a.icon} ${a.name} (${a.currency || 'PEN'})</option>`;
      modalHtml += `<option value="${a.id}">${a.icon} ${a.name} (${Storage.formatMoney(a.balance, a.currency)})</option>`;
    });

    if (filterSelect) filterSelect.innerHTML = filterHtml;
    if (modalSelect) modalSelect.innerHTML = modalHtml;
  },

  updateModalCategories(type) {
    const cats = Storage.getCategories();
    const select = document.getElementById('modal-txn-category');
    if (!select) return;

    const list = type === 'income' ? cats.income : cats.expense;
    let html = '';
    list.forEach(c => {
      html += `<option value="${c.name}">${c.icon} ${c.name}</option>`;
    });
    select.innerHTML = html;
  },

  filterTransactions(transactions) {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    return transactions.filter(t => {
      if (this.currentFilter.search) {
        const text = `${t.description || ''} ${t.category || ''} ${(t.tags || []).join(' ')}`.toLowerCase();
        if (!text.includes(this.currentFilter.search)) return false;
      }

      if (this.currentFilter.type !== 'all' && t.type !== this.currentFilter.type) {
        return false;
      }

      if (this.currentFilter.category !== 'all' && t.category !== this.currentFilter.category) {
        return false;
      }

      if (this.currentFilter.account !== 'all' && t.accountId !== this.currentFilter.account) {
        return false;
      }

      if (this.currentFilter.dateRange !== 'all') {
        const tDate = new Date(t.date + 'T00:00:00');
        if (this.currentFilter.dateRange === 'this_month') {
          if (tDate.getFullYear() !== curYear || tDate.getMonth() !== curMonth) return false;
        } else if (this.currentFilter.dateRange === 'last_month') {
          const prevMonthDate = new Date(curYear, curMonth - 1, 1);
          if (tDate.getFullYear() !== prevMonthDate.getFullYear() || tDate.getMonth() !== prevMonthDate.getMonth()) return false;
        } else if (this.currentFilter.dateRange === 'this_year') {
          if (tDate.getFullYear() !== curYear) return false;
        }
      }

      return true;
    });
  },

  renderTransactionList() {
    const container = document.getElementById('transactions-list-container');
    if (!container) return;

    const allTxs = Storage.getTransactions();
    const filtered = this.filterTransactions(allTxs);
    const accounts = Storage.getAccounts();
    const accMap = {};
    accounts.forEach(a => { accMap[a.id] = a; });

    const cats = Storage.getCategories();
    const catMap = {};
    [...cats.expense, ...cats.income].forEach(c => { catMap[c.name] = c; });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No se encontraron transacciones</h3>
          <p>Prueba ajustando los filtros de búsqueda o registra una nueva operación.</p>
          <button class="btn btn-primary" onclick="TransactionsModule.openModal('expense')">
            + Registrar Transacción
          </button>
        </div>
      `;
      return;
    }

    const groups = {};
    filtered.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });

    let html = '';
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(dateStr => {
      const txsInDate = groups[dateStr];
      const dateFormatted = this.formatDateHeader(dateStr);

      let dayNet = 0;
      txsInDate.forEach(t => {
        dayNet += (t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount));
      });

      const dayClass = dayNet >= 0 ? 'text-income' : 'text-expense';
      const dayNetStr = (dayNet >= 0 ? '+' : '') + Storage.formatMoney(dayNet);

      html += `
        <div class="date-group-card">
          <div class="date-group-header">
            <span class="date-group-title">${dateFormatted}</span>
            <span class="date-group-subtotal ${dayClass}">${dayNetStr}</span>
          </div>
          <div class="date-group-items">
      `;

      txsInDate.forEach(t => {
        const isIncome = t.type === 'income';
        const sign = isIncome ? '+' : '-';
        const amountClass = isIncome ? 'amount-income' : 'amount-expense';
        const acc = accMap[t.accountId] || { name: 'Cuenta', icon: '💳', currency: 'PEN' };
        const cat = catMap[t.category] || { icon: isIncome ? '📈' : '💸' };

        const tagsHtml = (t.tags && t.tags.length > 0)
          ? t.tags.map(tag => `<span class="tag-badge">#${tag}</span>`).join('')
          : '';

        const recurringBadge = t.isRecurring
          ? '<span class="recurring-badge" title="Transacción recurrente">🔄 Recurrente</span>'
          : '';

        const receiptBtn = t.hasReceipt
          ? `<button class="btn-icon" title="Ver foto de comprobante" onclick="TransactionsModule.viewReceipt('${t.id}')">🧾</button>`
          : '';

        html += `
          <div class="txn-item-row" id="txn-${t.id}">
            <div class="txn-left">
              <div class="txn-cat-icon ${isIncome ? 'icon-income' : 'icon-expense'}">
                ${cat.icon}
              </div>
              <div class="txn-details">
                <div class="txn-desc-title">
                  <span class="txn-desc">${t.description || t.category}</span>
                  ${recurringBadge}
                </div>
                <div class="txn-meta-row">
                  <span class="txn-cat-name">${t.category}</span>
                  <span class="meta-dot">•</span>
                  <span class="txn-acc-badge">${acc.icon} ${acc.name}</span>
                  ${tagsHtml ? `<span class="meta-dot">•</span>` + tagsHtml : ''}
                </div>
              </div>
            </div>

            <div class="txn-right">
              <div class="txn-amount ${amountClass}">
                ${sign}${Storage.formatMoney(t.amount, t.currency || acc.currency || 'PEN')}
              </div>
              <div class="txn-actions">
                ${receiptBtn}
                <button class="btn-icon" title="Editar" onclick="TransactionsModule.editTransaction('${t.id}')">✏️</button>
                <button class="btn-icon btn-icon-danger" title="Eliminar" onclick="TransactionsModule.confirmDelete('${t.id}')">🗑️</button>
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  formatDateHeader(dateStr) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Hoy, ' + this.formatPrettyDate(dateStr);
    if (dateStr === yesterdayStr) return 'Ayer, ' + this.formatPrettyDate(dateStr);

    return this.formatPrettyDate(dateStr);
  },

  formatPrettyDate(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const d = new Date(year, month, day);

    return `${daysOfWeek[d.getDay()]}, ${day} de ${monthNames[month]} ${year}`;
  },

  openModal(preselectType = 'expense') {
    this.editingId = null;
    this.clearReceipt();
    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('modal-txn-title');
    const form = document.getElementById('transaction-form');

    if (form) form.reset();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('modal-txn-date').value = today;

    const radio = document.querySelector(`input[name="modal-txn-type"][value="${preselectType}"]`);
    if (radio) radio.checked = true;

    this.updateModalCategories(preselectType);
    this.renderAccountOptions();

    if (title) title.innerText = preselectType === 'income' ? 'Nuevo Ingreso' : 'Nuevo Gasto';
    if (modal) modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('transaction-modal');
    if (modal) modal.classList.remove('active');
    this.editingId = null;
    this.clearReceipt();
  },

  async editTransaction(id) {
    const txs = Storage.getTransactions();
    const txn = txs.find(t => t.id === id);
    if (!txn) return;

    this.editingId = id;
    this.clearReceipt();

    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('modal-txn-title');

    const radio = document.querySelector(`input[name="modal-txn-type"][value="${txn.type}"]`);
    if (radio) radio.checked = true;

    this.updateModalCategories(txn.type);
    this.renderAccountOptions();

    document.getElementById('modal-txn-amount').value = txn.amount;
    document.getElementById('modal-txn-currency').value = txn.currency || 'PEN';
    document.getElementById('modal-txn-date').value = txn.date;
    document.getElementById('modal-txn-category').value = txn.category;
    document.getElementById('modal-txn-account').value = txn.accountId;
    document.getElementById('modal-txn-desc').value = txn.description || '';
    document.getElementById('modal-txn-tags').value = (txn.tags || []).join(', ');
    document.getElementById('modal-txn-recurring').checked = !!txn.isRecurring;

    // Si tiene foto en IndexedDB, cargar vista previa
    if (txn.hasReceipt) {
      const receiptData = await ReceiptsDB.getReceipt(txn.id);
      if (receiptData) {
        this.currentReceiptBase64 = receiptData;
        const preview = document.getElementById('modal-receipt-preview');
        if (preview) {
          preview.src = receiptData;
          preview.style.display = 'block';
        }
      }
    }

    if (title) title.innerText = 'Editar Transacción';
    if (modal) modal.classList.add('active');
  },

  async saveForm() {
    const amountVal = parseFloat(document.getElementById('modal-txn-amount').value);
    if (isNaN(amountVal) || amountVal <= 0) {
      App.showToast('Por favor ingrese un monto válido mayor a 0', 'warning');
      return;
    }

    const typeRadio = document.querySelector('input[name="modal-txn-type"]:checked');
    const type = typeRadio ? typeRadio.value : 'expense';
    const currency = document.getElementById('modal-txn-currency').value || 'PEN';
    const date = document.getElementById('modal-txn-date').value;
    const category = document.getElementById('modal-txn-category').value;
    const accountId = document.getElementById('modal-txn-account').value;
    const desc = document.getElementById('modal-txn-desc').value.trim();
    const tagsRaw = document.getElementById('modal-txn-tags').value;
    const isRecurring = document.getElementById('modal-txn-recurring').checked;

    const tags = tagsRaw ? tagsRaw.split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean) : [];

    const txnId = this.editingId || ('tx_' + Date.now());
    const hasReceipt = !!this.currentReceiptBase64;

    const txnData = {
      id: txnId,
      type,
      amount: amountVal,
      currency,
      category,
      accountId,
      date,
      description: desc || category,
      tags,
      isRecurring,
      hasReceipt
    };

    // Guardar imagen en IndexedDB si existe
    if (hasReceipt) {
      await ReceiptsDB.saveReceipt(txnId, this.currentReceiptBase64);
    }

    if (this.editingId) {
      Storage.updateTransaction(this.editingId, txnData);
      App.showToast('Transacción actualizada con éxito', 'success');
    } else {
      Storage.addTransaction(txnData);
      App.showToast('Transacción registrada correctamente', 'success');
    }

    this.closeModal();
    App.refreshAllViews();
  },

  async viewReceipt(txnId) {
    const data = await ReceiptsDB.getReceipt(txnId);
    if (!data) {
      App.showToast('No se encontró la imagen del comprobante', 'warning');
      return;
    }

    const modal = document.getElementById('receipt-viewer-modal');
    const img = document.getElementById('receipt-viewer-img');
    if (img && modal) {
      img.src = data;
      modal.classList.add('active');
    }
  },

  closeReceiptViewer() {
    const modal = document.getElementById('receipt-viewer-modal');
    if (modal) modal.classList.remove('active');
  },

  confirmDelete(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta transacción? Se actualizará el saldo de la cuenta.')) {
      Storage.deleteTransaction(id);
      App.showToast('Transacción eliminada', 'info');
      App.refreshAllViews();
    }
  }
};
