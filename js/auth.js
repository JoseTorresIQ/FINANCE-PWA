// js/auth.js - Sistema de Autenticación, Usuarios y Control de Acceso por Roles (Admin / Usuario)

const AuthModule = {
  USERS_KEY: 'finanzflow_system_users_v1',
  SESSION_KEY: 'finanzflow_active_session_v1',

  currentUser: null,

  async init() {
    this.ensureMasterAdmin();
    this.loadSession();
    this.bindEvents();
  },

  bindEvents() {
    // Formulario de inicio de sesión
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Botones de Cerrar Sesión
    const logoutBtns = document.querySelectorAll('.btn-logout-action');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleLogout());
    });

    // Formulario de crear/editar usuario (solo admin)
    const userForm = document.getElementById('admin-user-form');
    if (userForm) {
      userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveUserForm();
      });
    }
  },

  // Generar hash SHA-256 para almacenamiento seguro de contraseñas
  async hashPassword(password) {
    try {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback simple si crypto.subtle no estuviera disponible
      return btoa(password);
    }
  },

  // Inicializar o reparar el Administrador General por defecto
  async ensureMasterAdmin() {
    let users = this.getUsers();
    let admin = users.find(u => u.username.toLowerCase() === 'admin');
    const adminHash = await this.hashPassword('admin123');

    if (!admin) {
      const masterAdmin = {
        id: 'usr_admin',
        username: 'admin',
        name: 'Administrador General',
        passwordHash: adminHash,
        role: 'admin', // 'admin' | 'user'
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      users.unshift(masterAdmin);
      this.saveUsers(users);
      console.log('[FinanzFlow Auth] Administrador General creado (Usuario: admin / Clave: admin123)');
    } else if (admin.status !== 'active') {
      admin.status = 'active';
      this.saveUsers(users);
    }
  },

  // Restablecimiento inmediato y forzado de credenciales del Administrador
  async resetAdminCredentials() {
    let users = this.getUsers();
    const adminHash = await this.hashPassword('admin123');
    const adminIndex = users.findIndex(u => u.username.toLowerCase() === 'admin');

    const masterAdmin = {
      id: 'usr_admin',
      username: 'admin',
      name: 'Administrador General',
      passwordHash: adminHash,
      role: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    if (adminIndex >= 0) {
      users[adminIndex] = masterAdmin;
    } else {
      users.unshift(masterAdmin);
    }
    this.saveUsers(users);

    // Desactivar cualquier bloqueo por PIN que pudiera estar bloqueando la pantalla
    try {
      const settings = (window.Storage && Storage.getSettings) ? Storage.getSettings() : {};
      if (settings.pinEnabled) {
        settings.pinEnabled = false;
        settings.pinCode = '';
        if (Storage.saveSettings) Storage.saveSettings(settings);
      }
      const pinOverlay = document.getElementById('pin-lock-overlay');
      if (pinOverlay) pinOverlay.classList.remove('active');
    } catch (e) {}

    // Rellenar automáticamente los campos del formulario de login
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error-msg');
    if (uInput) uInput.value = 'admin';
    if (pInput) pInput.value = 'admin123';
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.innerText = '';
    }

    if (window.App && App.showToast) {
      App.showToast('✅ Credenciales de Administrador restablecidas: admin / admin123', 'success');
    } else {
      alert('Credenciales de Administrador restablecidas:\nUsuario: admin\nContraseña: admin123');
    }
  },

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  loadSession() {
    try {
      const session = JSON.parse(localStorage.getItem(this.SESSION_KEY));
      if (session && session.id) {
        // Verificar que el usuario siga existiendo y esté activo
        const users = this.getUsers();
        const user = users.find(u => u.id === session.id && u.status === 'active');
        if (user) {
          this.currentUser = user;
          this.onLoginSuccess(false);
          return;
        }
      }
    } catch (e) {
      console.warn('[FinanzFlow Auth] Error al cargar sesión previa:', e);
    }

    this.showLoginScreen();
  },

  async handleLogin() {
    const usernameInput = document.getElementById('login-username').value.trim().toLowerCase();
    const passwordInput = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error-msg');

    if (!usernameInput || !passwordInput) {
      if (errorEl) {
        errorEl.innerText = 'Por favor ingresa usuario y contraseña';
        errorEl.style.display = 'block';
      }
      return;
    }

    let users = this.getUsers();
    let user = users.find(u => u.username.toLowerCase() === usernameInput);

    // RECUPERACIÓN MAESTRA UNIVERSAL:
    // Si se ingresa usuario 'admin' y contraseña 'admin123', el acceso está 100% GARANTIZADO
    if (usernameInput === 'admin' && passwordInput === 'admin123') {
      const properHash = await this.hashPassword('admin123');
      if (!user) {
        user = {
          id: 'usr_admin',
          username: 'admin',
          name: 'Administrador General',
          passwordHash: properHash,
          role: 'admin',
          createdAt: new Date().toISOString().split('T')[0],
          status: 'active'
        };
        users.unshift(user);
        this.saveUsers(users);
      } else {
        user.passwordHash = properHash;
        user.status = 'active';
        this.saveUsers(users);
      }
    } else {
      const inputHash = await this.hashPassword(passwordInput);
      const isMatch = user && (
        user.passwordHash === inputHash ||
        user.passwordHash === btoa(passwordInput) ||
        user.passwordHash === passwordInput
      );

      if (!user || !isMatch) {
        if (errorEl) {
          errorEl.innerText = 'Usuario o contraseña incorrectos. Si olvidaste la clave de administrador, presiona "Restablecer Credenciales de Admin".';
          errorEl.style.display = 'block';
        }
        return;
      }

      if (user.status !== 'active') {
        if (errorEl) {
          errorEl.innerText = 'Esta cuenta está desactivada por el administrador';
          errorEl.style.display = 'block';
        }
        return;
      }
    }

    // Sesión correcta
    if (errorEl) errorEl.style.display = 'none';
    this.currentUser = user;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }));

    App.showToast(`¡Bienvenido de nuevo, ${user.name}!`, 'success');
    this.onLoginSuccess(true);
  },

  onLoginSuccess(isNewLogin = false) {
    // 1. Ocultar pantalla de login y mostrar app principal
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.querySelector('.app-container');
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    const fabBtn = document.querySelector('.fab-btn');

    if (loginScreen) loginScreen.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    if (bottomNav) bottomNav.style.display = '';
    if (fabBtn) fabBtn.style.display = 'flex';

    // 2. Actualizar identidad del usuario en el encabezado
    const userNameEl = document.getElementById('header-user-name');
    const userRoleBadge = document.getElementById('header-user-role-badge');
    if (userNameEl) userNameEl.innerText = this.currentUser.name;
    if (userRoleBadge) {
      userRoleBadge.innerText = this.currentUser.role === 'admin' ? '👑 Administrador' : '👤 Usuario';
      userRoleBadge.className = `status-badge ${this.currentUser.role === 'admin' ? 'badge-danger' : 'badge-info'}`;
    }

    // 3. Mostrar u ocultar pestaña de Administración de Usuarios según el Rol
    const adminNavItems = document.querySelectorAll('.admin-only-nav');
    adminNavItems.forEach(el => {
      el.style.display = this.currentUser.role === 'admin' ? '' : 'none';
    });

    // 4. Cambiar el contexto de almacenamiento al del usuario activo
    Storage.setActiveUser(this.currentUser.id, this.currentUser.name);

    // 5. Refrescar todas las vistas con los datos específicos de este usuario
    App.switchTab('dashboard');
    App.refreshAllViews();

    if (this.currentUser.role === 'admin') {
      this.renderUsersList();
    }
  },

  handleLogout() {
    if (confirm('¿Deseas cerrar tu sesión?')) {
      localStorage.removeItem(this.SESSION_KEY);
      this.currentUser = null;
      this.showLoginScreen();
      App.showToast('Sesión cerrada con éxito', 'info');
    }
  },

  showLoginScreen() {
    if (typeof App !== 'undefined' && App.closeMobileMenu) {
      App.closeMobileMenu();
    }
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.querySelector('.app-container');
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    const fabBtn = document.querySelector('.fab-btn');

    if (loginScreen) {
      loginScreen.style.display = 'flex';
      const form = document.getElementById('login-form');
      if (form) form.reset();
      const err = document.getElementById('login-error-msg');
      if (err) err.style.display = 'none';
    }
    if (appContainer) appContainer.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
    if (fabBtn) fabBtn.style.display = 'none';
  },

  // -------------------------------------------------------------
  // GESTIÓN DE USUARIOS (SOLO ADMINISTRADOR GENERAL)
  // -------------------------------------------------------------
  editingUserId: null,

  renderUsersList() {
    const container = document.getElementById('admin-users-list-container');
    if (!container || !this.currentUser || this.currentUser.role !== 'admin') return;

    const users = this.getUsers();

    let html = `
      <div class="users-stats-bar">
        <div>
          <span class="text-muted text-sm">Usuarios Registrados en el Sistema</span>
          <h3 style="font-size: 1.5rem; font-weight: 800;">${users.length} Cuentas Independientes</h3>
        </div>
        <button class="btn btn-primary" onclick="AuthModule.openUserModal()">
          + Crear Nuevo Usuario
        </button>
      </div>

      <div class="users-grid">
    `;

    users.forEach(u => {
      const isCurrent = u.id === this.currentUser.id;
      const isAdmin = u.role === 'admin';

      html += `
        <div class="user-card ${isCurrent ? 'user-card-current' : ''}">
          <div class="user-card-header">
            <div class="user-avatar-badge">${isAdmin ? '👑' : '👤'}</div>
            <div class="user-card-actions">
              <button class="btn-icon" title="Editar / Cambiar Clave" onclick="AuthModule.editUser('${u.id}')">✏️</button>
              ${!isCurrent ? `<button class="btn-icon btn-icon-danger" title="Eliminar Usuario" onclick="AuthModule.deleteUser('${u.id}')">🗑️</button>` : ''}
            </div>
          </div>

          <h4 class="user-card-name">${u.name} ${isCurrent ? '<span class="text-xs text-income">(Tú)</span>' : ''}</h4>
          <span class="user-card-username">@${u.username}</span>

          <div class="user-card-footer">
            <span class="status-badge ${isAdmin ? 'badge-danger' : 'badge-info'}">
              ${isAdmin ? 'Admin General' : 'Usuario Individual'}
            </span>
            <span class="text-xs text-muted">Creado: ${u.createdAt || '2026-10-19'}</span>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  openUserModal() {
    this.editingUserId = null;
    const modal = document.getElementById('admin-user-modal');
    const form = document.getElementById('admin-user-form');
    const title = document.getElementById('admin-user-modal-title');
    const passHelp = document.getElementById('admin-user-pass-help');

    if (form) form.reset();
    if (title) title.innerText = 'Crear Nuevo Usuario';
    if (passHelp) passHelp.innerText = 'Asigna una contraseña de acceso para el usuario.';
    document.getElementById('admin-modal-username').disabled = false;
    document.getElementById('admin-modal-pass').required = true;

    if (modal) modal.classList.add('active');
  },

  closeUserModal() {
    const modal = document.getElementById('admin-user-modal');
    if (modal) modal.classList.remove('active');
    this.editingUserId = null;
  },

  editUser(id) {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;

    this.editingUserId = id;
    const modal = document.getElementById('admin-user-modal');
    const title = document.getElementById('admin-user-modal-title');
    const passHelp = document.getElementById('admin-user-pass-help');

    document.getElementById('admin-modal-name').value = user.name;
    document.getElementById('admin-modal-username').value = user.username;
    document.getElementById('admin-modal-username').disabled = true; // No cambiar username
    document.getElementById('admin-modal-pass').value = '';
    document.getElementById('admin-modal-pass').required = false; // Opcional al editar
    document.getElementById('admin-modal-role').value = user.role || 'user';

    if (title) title.innerText = `Editar Usuario: @${user.username}`;
    if (passHelp) passHelp.innerText = 'Deja el campo de contraseña en blanco si deseas mantener la actual.';

    if (modal) modal.classList.add('active');
  },

  async saveUserForm() {
    const name = document.getElementById('admin-modal-name').value.trim();
    const username = document.getElementById('admin-modal-username').value.trim().toLowerCase();
    const pass = document.getElementById('admin-modal-pass').value;
    const role = document.getElementById('admin-modal-role').value;

    if (!name || (!this.editingUserId && !username)) {
      App.showToast('Por favor completa los campos requeridos', 'warning');
      return;
    }

    const users = this.getUsers();

    if (this.editingUserId) {
      const idx = users.findIndex(u => u.id === this.editingUserId);
      if (idx !== -1) {
        users[idx].name = name;
        users[idx].role = role;
        if (pass) {
          users[idx].passwordHash = await this.hashPassword(pass);
        }
      }
      this.saveUsers(users);
      App.showToast('Usuario actualizado con éxito', 'success');
    } else {
      // Validar si username ya existe
      if (users.some(u => u.username.toLowerCase() === username)) {
        App.showToast(`El usuario @${username} ya existe. Elige otro nombre de usuario.`, 'danger');
        return;
      }

      if (!pass || pass.length < 4) {
        App.showToast('La contraseña debe tener al menos 4 caracteres', 'warning');
        return;
      }

      const passHash = await this.hashPassword(pass);
      const newUserId = 'usr_' + Date.now();

      const newUser = {
        id: newUserId,
        username,
        name,
        passwordHash: passHash,
        role,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      users.push(newUser);
      this.saveUsers(users);

      // Inicializar automáticamente el almacenamiento aislado para este nuevo usuario
      Storage.initializeUserData(newUserId, name);

      App.showToast(`¡Usuario @${username} creado exitosamente!`, 'success');
    }

    this.closeUserModal();
    this.renderUsersList();
  },

  deleteUser(id) {
    if (id === this.currentUser.id) {
      App.showToast('No puedes eliminar tu propia cuenta activa', 'warning');
      return;
    }

    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;

    if (confirm(`¿Estás seguro de eliminar al usuario "${user.name}" (@${user.username}) y toda su información financiera? Esta acción no se puede deshacer.`)) {
      const filtered = users.filter(u => u.id !== id);
      this.saveUsers(filtered);

      // Eliminar datos aislados de ese usuario
      Storage.purgeUserData(id);

      App.showToast(`Usuario @${user.username} eliminado`, 'info');
      this.renderUsersList();
    }
  }
};
