# 💰 FinanzFlow — Control Financiero Personal (app.py)

[![Python Version](https://img.shields.io/badge/python-3.9%20%7C%203.10%20%7C%203.11%20%7C%203.12-blue)](https://www.python.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-green.svg)](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)
[![Security](https://img.shields.io/badge/Security-SHA--256%20Crypto-blueviolet.svg)](https://developer.mozilla.org/es/docs/Web/API/SubtleCrypto)

**FinanzFlow** es una Aplicación Web Progresiva (**Progressive Web App - PWA**) para la gestión integral de finanzas personales, presupuestos 50/30/20, deudas y metas de ahorro.

El aplicativo principal es **[`app.py`](file:///app.py)**, el cual opera **100% de manera local con la Biblioteca Estándar de Python** y además está listo para desplegarse en **GitHub y Streamlit Community Cloud**.

---

## 💻 1. Ejecución Local (Sin dependencias externas)

Haz doble clic en:
* **[`ejecutar_pwa_finanzas.bat`](file:///ejecutar_pwa_finanzas.bat)**

O desde tu terminal:
```powershell
python app.py
```

* **Acceso local:** `http://localhost:8000/index.html`
* **Acceso móvil en red Wi-Fi:** Se mostrará tu IP local en la consola (ej. `http://192.168.1.X:8000/index.html`).
* **Offline-First:** Funciona sin conexión a internet y guarda todos los datos localmente en tu navegador (`LocalStorage` e `IndexedDB`).

---

## 🚀 2. Subir a GitHub y Desplegar en Streamlit Cloud

### Paso A: Subir a GitHub
1. Crea un nuevo repositorio en tu cuenta de GitHub (ej. `https://github.com/tu-usuario/finanzflow`).
2. Ejecuta el script:
   ```cmd
   subir_a_github.bat
   ```
3. Pega la URL de tu nuevo repositorio y presiona ENTER.

### Paso B: Desplegar en Streamlit Cloud
1. Ingresa a [share.streamlit.io](https://share.streamlit.io).
2. Haz clic en **"Create app"**.
3. Selecciona tu repositorio, rama `main` y en **Main file path** coloca:
   ```text
   app.py
   ```
4. Haz clic en **"Deploy!"**.

---

## 👑 Credenciales por Defecto
* **Usuario:** `admin`
* **Contraseña:** `admin123`
* Desde el panel de Administrador General puedes crear usuarios adicionales con datos 100% privados e independientes.

---

## 📁 Estructura Limpia del Proyecto

```text
20261028 - PWA CONTROL FINANCIERO STREAMLIT/
├── css/
│   └── styles.css            # Estilos CSS de la interfaz y modo oscuro
├── js/
│   ├── app.js                # Lógica principal y navegación
│   ├── auth.js               # Multi-usuario y cifrado SHA-256
│   ├── storage.js            # Almacenamiento IndexedDB y LocalStorage
│   ├── transactions.js       # CRUD de transacciones
│   ├── budgets.js            # Presupuestos y regla 50/30/20
│   ├── goals.js              # Metas de ahorro
│   ├── calendar.js           # Calendario de pagos y vencimientos
│   ├── calculators.js        # Simuladores de deuda e interés
│   ├── charts.js             # Gráficos y analítica
│   └── security.js           # PIN de 4 dígitos y privacidad
├── icons/                    # Iconos y favicons PWA
├── index.html                # Interfaz principal de la PWA
├── manifest.json             # Manifiesto PWA para instalación móvil
├── sw.js                     # Service Worker para funcionamiento offline
├── app.py                    # Servidor local nativo y entry point para deploy
├── ejecutar_pwa_finanzas.bat # Lanzador local de 1 clic (python app.py)
├── subir_a_github.bat        # Script para subir a GitHub
├── requirements.txt          # Requisitos mínimos de deploy
├── .gitignore                # Archivos ignorados por Git
└── README.md                 # Documentación
```
