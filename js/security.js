// js/security.js - Seguridad, Bloqueo por PIN y Modo Privacidad

const SecurityModule = {
  enteredPin: '',
  isUnlocked: false,

  init() {
    this.applyPrivacyMode();
    this.checkPinLockOnStartup();
    this.bindEvents();
  },

  bindEvents() {
    // Botón de Modo Privacidad en cabecera
    const privBtn = document.getElementById('privacy-toggle-btn');
    if (privBtn) {
      privBtn.addEventListener('click', () => this.togglePrivacyMode());
    }

    // Teclado numérico PIN
    const keypadBtns = document.querySelectorAll('.pin-keypad-btn');
    keypadBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = btn.getAttribute('data-val');
        this.handlePinInput(val);
      });
    });

    // Guardar PIN desde ajustes
    const pinForm = document.getElementById('pin-settings-form');
    if (pinForm) {
      pinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.savePinSettings();
      });
    }
  },

  // -------------------------------------------------------------
  // MODO PRIVACIDAD (Ocultar Saldos 👁️)
  // -------------------------------------------------------------
  applyPrivacyMode() {
    const settings = Storage.getSettings();
    const isPrivacy = !!settings.privacyMode;

    if (isPrivacy) {
      document.body.classList.add('privacy-mode-active');
    } else {
      document.body.classList.remove('privacy-mode-active');
    }

    const icon = document.getElementById('privacy-toggle-icon');
    if (icon) {
      icon.innerText = isPrivacy ? '🙈' : '👁️';
      icon.title = isPrivacy ? 'Modo Privacidad Activo (Saldos Ocultos)' : 'Ocultar Saldos (Modo Privacidad)';
    }
  },

  togglePrivacyMode() {
    const settings = Storage.getSettings();
    settings.privacyMode = !settings.privacyMode;
    Storage.saveSettings(settings);

    this.applyPrivacyMode();
    App.showToast(
      settings.privacyMode ? 'Modo Privacidad Activado (Saldos ocultos)' : 'Modo Privacidad Desactivado',
      'info'
    );
  },

  // -------------------------------------------------------------
  // BLOQUEO POR PIN LOCAL (4 dígitos)
  // -------------------------------------------------------------
  checkPinLockOnStartup() {
    const settings = Storage.getSettings();
    if (settings.pinEnabled && settings.pinCode && !this.isUnlocked) {
      this.showPinOverlay();
    } else {
      this.hidePinOverlay();
    }
  },

  showPinOverlay() {
    this.enteredPin = '';
    this.updatePinDots();
    const overlay = document.getElementById('pin-lock-overlay');
    if (overlay) overlay.classList.add('active');
  },

  hidePinOverlay() {
    const overlay = document.getElementById('pin-lock-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  handlePinInput(val) {
    if (val === 'clear') {
      this.enteredPin = '';
      this.updatePinDots();
      return;
    }

    if (val === 'backspace') {
      this.enteredPin = this.enteredPin.slice(0, -1);
      this.updatePinDots();
      return;
    }

    if (this.enteredPin.length < 4) {
      this.enteredPin += val;
      this.updatePinDots();

      if (this.enteredPin.length === 4) {
        setTimeout(() => this.verifyPin(), 120);
      }
    }
  },

  updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
      if (idx < this.enteredPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  },

  verifyPin() {
    const settings = Storage.getSettings();
    const correctPin = settings.pinCode;

    if (this.enteredPin === correctPin) {
      this.isUnlocked = true;
      this.hidePinOverlay();
      App.showToast('Acceso autorizado', 'success');
    } else {
      const container = document.querySelector('.pin-dots-container');
      if (container) {
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 400);
      }
      App.showToast('PIN incorrecto, intenta de nuevo', 'danger');
      this.enteredPin = '';
      this.updatePinDots();
    }
  },

  savePinSettings() {
    const enableCheck = document.getElementById('setting-pin-enable').checked;
    const newPin = document.getElementById('setting-new-pin').value.trim();
    const confirmPin = document.getElementById('setting-confirm-pin').value.trim();

    const settings = Storage.getSettings();

    if (!enableCheck) {
      settings.pinEnabled = false;
      settings.pinCode = '';
      Storage.saveSettings(settings);
      App.showToast('Bloqueo por PIN desactivado', 'info');
      return;
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      App.showToast('El PIN debe contener exactamente 4 dígitos numéricos', 'warning');
      return;
    }

    if (newPin !== confirmPin) {
      App.showToast('Los dos campos de PIN no coinciden', 'danger');
      return;
    }

    settings.pinEnabled = true;
    settings.pinCode = newPin;
    Storage.saveSettings(settings);
    App.showToast('PIN de seguridad configurado exitosamente', 'success');

    document.getElementById('setting-new-pin').value = '';
    document.getElementById('setting-confirm-pin').value = '';
  }
};
