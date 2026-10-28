# 💰 FinanzFlow — PWA de Control Financiero Personal (Edición Streamlit)

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://share.streamlit.io)
[![Python Version](https://img.shields.io/badge/python-3.9%20%7C%203.10%20%7C%203.11%20%7C%203.12-blue)](https://www.python.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-green.svg)](https://developer.mozilla.org/es/docs/Web/Progressive_web_apps)
[![Security](https://img.shields.io/badge/Security-SHA--256%20Crypto-blueviolet.svg)](https://developer.mozilla.org/es/docs/Web/API/SubtleCrypto)

**FinanzFlow** es una Aplicación Web Progresiva (**Progressive Web App - PWA**) y Suite de Gestión Financiera Inteligente adaptada para su despliegue inmediato en **Streamlit Community Cloud** y ejecución local en cualquier plataforma.

---

## 🌟 Características Principales

1. **👑 Sistema Multi-Usuario con Administrador General:**
   - **Usuario Administrador Maestro:** `admin` | **Contraseña:** `admin123`
   - Creación de usuarios ilimitados con roles diferenciados.
   - **Aislamiento Total de Datos:** Cada usuario almacena sus finanzas de forma 100% individual y privada (`finanzflow_u_<id>_*`).
   - Contraseñas cifradas mediante hashing criptográfico **SHA-256** (`crypto.subtle`).

2. **⚡ Despliegue en Streamlit Community Cloud:**
   - Archivo principal para despliegue: [`app.py`](file:///app.py).
   - Compatible también mediante [`streamlit_app.py`](file:///streamlit_app.py).
   - Soporte nativo para servicio de archivos estáticos (`enableStaticServing = true` en [`.streamlit/config.toml`](file:///.streamlit/config.toml)).
   - Experiencia híbrida: Visor integrado en Streamlit + Acceso PWA Standalone a pantalla completa (`/app/static/index.html`).

3. **📱 PWA Offline-First Instalable:**
   - Instalación nativa con 1 clic en **Android**, **iPhone/iPad** y computadoras **Windows/macOS**.
   - Funcionamiento continuo sin conexión a internet mediante **Service Worker** (`sw.js`).
   - Soporte para fotos de comprobantes de pago mediante **IndexedDB** (superando el límite de LocalStorage).

4. **🧠 Suite Financiera Completa:**
   - **Regla 50 / 30 / 20:** Clasificación visual de gastos (Necesidades, Deseos y Ahorro).
   - **Soporte Bimoneda:** Balances consolidados en Soles (S/.) y Dólares ($ USD).
   - **Calendario de Vencimientos:** Control de pagos recurrentes, servicios y deudas.
   - **Simuladores de Deudas:** Métodos Avalancha y Bola de Nieve.
   - **Calculadora de Interés Compuesto:** Proyecciones de inversión a 1, 3, 5, 10 y 20 años.
   - **Modo Privacidad Inmediato:** Desenfoca montos y saldos en lugares públicos con un botón.
   - **Bloqueo por PIN de 4 dígitos:** Teclado numérico interactivo tipo smartphone.

---

## 🚀 Despliegue en Streamlit Community Cloud

Para tener tu aplicación funcionando en la nube con enlace HTTPS gratuito:

### 1. Subir este proyecto a GitHub
1. Crea un repositorio vacío en tu cuenta de GitHub (ejemplo: `finanzflow-streamlit`).
2. En la carpeta del proyecto, ejecuta:
   ```cmd
   subir_a_github.bat
   ```
3. Pega la URL de tu nuevo repositorio cuando el script lo solicite.
4. El script confirmará los cambios y subirá todo a la rama `main`.

### 2. Conectar en Streamlit Cloud
1. Ingresa a [share.streamlit.io](https://share.streamlit.io) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Create app"** (o **"New app"**).
3. Configura los siguientes campos:
   - **Repository:** `tu-usuario/finanzflow-streamlit`
   - **Branch:** `main`
   - **Main file path:** `app.py`
4. Haz clic en **"Deploy!"**.
5. ¡Listo! En aproximadamente 1 minuto tu aplicación estará disponible globalmente.

---

## 💻 Ejecución Local en tu Equipo

Tienes dos formas de ejecutar el proyecto en tu máquina:

### Opción A: Servidor Streamlit (Recomendado)
Haz doble clic en:
- [`ejecutar_streamlit.bat`](file:///ejecutar_streamlit.bat) (dentro de esta carpeta)
- O [`ejecutar_pwa_finanzas_streamlit.bat`](file:///../ejecutar_pwa_finanzas_streamlit.bat) (en la carpeta `PYTHON`)

O por consola:
```powershell
streamlit run app.py
```
Abre en tu navegador: `http://localhost:8501`

### Opción B: Servidor Nativo Python (Ligero, sin dependencias)
Haz doble clic en:
- [`ejecutar_servidor_nativo.bat`](file:///ejecutar_servidor_nativo.bat)

O por consola:
```powershell
python server.py
```
Abre en tu navegador: `http://localhost:8000`

---

## 📱 Cómo Instalar la PWA en tu Celular

1. Ingresa a la URL del aplicativo desde tu teléfono o escanea el **código QR** disponible en la pestaña *"Instalación Móvil & QR"* de Streamlit.
2. Abre la versión standalone: `/app/static/index.html`.
3. **En Android (Chrome):**
   - Toca el menú (⋮) y elige **"Instalar aplicación"** o presiona el banner **"📲 Instalar FinanzFlow"**.
4. **En iPhone (Safari):**
   - Toca el botón **Compartir** (cuadrado con flecha hacia arriba) y selecciona **"Agregar a pantalla de inicio"**.

---

## 📁 Estructura del Proyecto

```text
20261028 - PWA CONTROL FINANCIERO STREAMLIT/
├── .streamlit/
│   └── config.toml               # Configuración de tema y enableStaticServing
├── static/                       # Directorio servido por Streamlit en /app/static/
│   ├── index.html                # Interfaz completa FinanzFlow PWA
│   ├── manifest.json             # Manifiesto de la PWA
│   ├── sw.js                     # Service Worker con caché offline-first
│   ├── css/
│   │   └── styles.css            # Hoja de estilos con modo oscuro y responsive
│   ├── js/                       # Módulos JavaScript desacoplados
│   │   ├── app.js                # Lógica principal y enrutador PWA
│   │   ├── auth.js               # Multi-usuario, criptografía SHA-256
│   │   ├── storage.js            # Almacenamiento IndexedDB y LocalStorage
│   │   ├── transactions.js       # CRUD de transacciones y filtros
│   │   ├── budgets.js            # Presupuestos y regla 50/30/20
│   │   ├── goals.js              # Metas de ahorro y progreso
│   │   ├── calendar.js           # Agenda y recordatorios de pagos
│   │   ├── calculators.js        # Simuladores de deudas e interés
│   │   ├── charts.js             # Visualizaciones y gráficos
│   │   └── security.js           # PIN de 4 dígitos y modo privacidad
│   └── icons/                    # Iconografía y favicons PWA
├── app.py                        # Entry Point principal para despliegue en Streamlit Cloud
├── streamlit_app.py              # Wrapper de compatibilidad automática
├── server.py                     # Servidor HTTP nativo en Python estándar
├── requirements.txt              # Dependencias de Python para Streamlit Cloud
├── .gitignore                    # Reglas de exclusión de Git
├── ejecutar_streamlit.bat        # Lanzador local Streamlit
├── ejecutar_servidor_nativo.bat  # Lanzador local servidor nativo
├── subir_a_github.bat            # Script de subida y sincronización con GitHub
└── README.md                     # Documentación técnica completa
```

---

## 🔒 Privacidad y Almacenamiento

Todos los registros, presupuestos, metas y fotos de comprobantes se procesan **exclusivamente en el dispositivo del usuario**. Ningún dato se envía a servidores externos ni requiere base de datos centralizada, garantizando confidencialidad absoluta de tus finanzas personales.
