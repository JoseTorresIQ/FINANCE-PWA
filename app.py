#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
FINANZFLOW — SISTEMA DE CONTROL FINANCIERO PERSONAL (EDICIÓN PWA & STREAMLIT)
=============================================================================
Punto de Entrada Principal (Entry Point): app.py
Diseñado para despliegue en:
  1. Streamlit Community Cloud (https://share.streamlit.io)
  2. Ejecución local en Windows/macOS/Linux con 'streamlit run app.py' o 'python app.py'
  3. Despliegue PWA nativo e instalable mediante '/app/static/index.html'

Arquitectura Offline-First:
  - Todo el procesamiento y almacenamiento se realiza en el cliente (IndexedDB + LocalStorage).
  - Cifrado criptográfico SHA-256 para contraseñas de usuarios.
  - Multi-usuario con Administrador General y aislamiento total de datos.
=============================================================================
"""

import io
import os
import sys
import socket
from typing import Optional

# Auto-lanzador si se ejecuta con 'python app.py' directamente en terminal
if __name__ == "__main__":
    try:
        from streamlit.runtime.scriptrunner import get_script_run_ctx
        if get_script_run_ctx(suppress_warning=True) is None:
            from streamlit.web import cli as stcli
            sys.argv = ["streamlit", "run", os.path.abspath(__file__)]
            sys.exit(stcli.main())
    except Exception:
        pass

import streamlit as st
import streamlit.components.v1 as components

# Importación opcional de qrcode y Pillow para generación local de códigos QR
try:
    import qrcode
    from PIL import Image
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False

# ==============================================================================
# CONFIGURACIÓN GLOBAL DE LA PÁGINA STREAMLIT
# ==============================================================================
st.set_page_config(
    page_title="FinanzFlow — Control Financiero Personal | PWA",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ==============================================================================
# UTILIDADES DE RED Y CÓDIGOS QR
# ==============================================================================
def get_local_ip() -> str:
    """Detecta la IP local de la máquina en la red Wi-Fi/LAN."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"

def generar_qr_bytes(texto: str) -> Optional[bytes]:
    """Genera una imagen PNG del código QR estilizada con la paleta de FinanzFlow."""
    if not HAS_QRCODE:
        return None
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=2,
        )
        qr.add_data(texto)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#3b82f6", back_color="#0f172a")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()
    except Exception:
        return None

# ==============================================================================
# ESTILOS CSS PERSONALIZADOS (DARK MODE, GLASSMORPHISM & CLEAN STREAMLIT)
# ==============================================================================
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  /* Tipografía y contenedor general */
  html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  /* Cabecera nativa de Streamlit transparente y discreta */
  header[data-testid="stHeader"] {
    background: rgba(15, 23, 42, 0.85) !important;
    backdrop-filter: blur(10px);
    z-index: 99;
  }

  /* Reducción de márgenes para experiencia 'App Nativa' */
  .main .block-container {
    padding-top: 0.8rem !important;
    padding-bottom: 1rem !important;
    padding-left: 0.8rem !important;
    padding-right: 0.8rem !important;
    max-width: 100% !important;
  }

  footer {
    display: none !important;
  }

  /* Estilos para pestañas superiores de Streamlit */
  div[data-testid="stTabs"] button[role="tab"] {
    font-size: 0.95rem;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 8px 8px 0 0;
  }

  /* Tarjetas informativas glassmorphic */
  .glass-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 14px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  }

  .badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .badge-blue {
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.35);
    color: #60a5fa;
  }
  .badge-green {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #34d399;
  }
  .badge-amber {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.35);
    color: #fbbf24;
  }

  /* Iframe contenedor */
  iframe {
    border: 1px solid rgba(59, 130, 246, 0.25) !important;
    border-radius: 14px !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5) !important;
    background: #0f172a !important;
  }
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# BARRA LATERAL (SIDEBAR)
# ==============================================================================
with st.sidebar:
    st.markdown("""
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <span style="font-size: 2rem;">💰</span>
        <div>
            <h3 style="margin:0; font-size:1.2rem; font-weight:800; color:#f8fafc;">FinanzFlow</h3>
            <span class="badge-tag badge-blue">PWA • Streamlit Cloud</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.caption("Control Financiero Personal Avanzado • Offline-First")
    st.markdown("---")

    st.markdown("#### 👑 Administrador General")
    st.info("""
    **Usuario:** `admin`  
    **Contraseña:** `admin123`  
    
    *Ingresa con esta cuenta para crear nuevos usuarios con almacenamiento aislado e individual.*
    """)

    st.markdown("---")
    st.markdown("#### 📱 Modo Standalone (PWA)")
    st.markdown("Para abrir la aplicación fuera del marco de Streamlit e instalarla como app de escritorio o móvil:")
    st.link_button("🚀 Abrir FinanzFlow Standalone", "/app/static/index.html", use_container_width=True, type="primary")

    st.markdown("---")
    st.markdown("#### 🌐 Arquitectura y Seguridad")
    st.markdown("""
    - **Offline-First:** Funciona sin conexión mediante Service Worker.
    - **Privacidad Total:** Los datos se guardan exclusivamente en tu navegador (`LocalStorage` e `IndexedDB`).
    - **Criptografía:** Contraseñas protegidas mediante hash **SHA-256** con `crypto.subtle`.
    - **Cero suscripciones:** Totalmente gratuito y de código abierto.
    """)

# ==============================================================================
# CABECERA PRINCIPAL
# ==============================================================================
head_col1, head_col2 = st.columns([3, 1.4])

with head_col1:
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 2.2rem;">💰</span>
        <div>
            <h1 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #f8fafc; letter-spacing: -0.02em;">
                FinanzFlow — Control Financiero Personal
            </h1>
            <p style="margin: 2px 0 0 0; font-size: 0.88rem; color: #94a3b8;">
                Gestión Inteligente de Ingresos, Gastos, Presupuestos 50/30/20, Metas, Bimoneda y Deudas
            </p>
        </div>
    </div>
    """, unsafe_allow_html=True)

with head_col2:
    st.markdown("<div style='height: 4px;'></div>", unsafe_allow_html=True)
    c_btn1, c_btn2 = st.columns(2)
    with c_btn1:
        st.link_button("↗️ Standalone PWA", "/app/static/index.html", use_container_width=True, type="primary")
    with c_btn2:
        if st.button("🔄 Recargar", use_container_width=True):
            st.rerun()

# ==============================================================================
# PESTAÑAS PRINCIPALES DEL SISTEMA
# ==============================================================================
tab_app, tab_install, tab_admin, tab_deploy = st.tabs([
    "💵 FinanzFlow (Aplicación)",
    "📱 Instalación Móvil & QR",
    "👑 Usuarios & Seguridad",
    "🚀 Despliegue en Streamlit Cloud"
])

# ------------------------------------------------------------------------------
# TAB 1: APLICATIVO PRINCIPAL FINANZFLOW
# ------------------------------------------------------------------------------
with tab_app:
    # Selector de altura del iframe para comodidad del usuario
    top_bar1, top_bar2, top_bar3 = st.columns([2, 1, 1])
    with top_bar1:
        st.caption("💡 Para la mejor experiencia móvil y para instalar la app en tu pantalla de inicio, usa el botón **'↗️ Standalone PWA'**.")
    with top_bar2:
        altura_iframe = st.selectbox(
            "Altura del visor:",
            options=[850, 950, 1100, 1300],
            index=1,
            format_func=lambda x: f"📏 {x} px"
        )
    with top_bar3:
        st.write("")
        st.markdown(
            '<div style="text-align: right; padding-top: 8px;"><span class="badge-tag badge-green">● Sistema Activo</span></div>',
            unsafe_allow_html=True
        )

    # Iframe de FinanzFlow cargado vía Streamlit static serving
    components.iframe(
        src="/app/static/index.html",
        height=altura_iframe,
        scrolling=True
    )

# ------------------------------------------------------------------------------
# TAB 2: INSTALACIÓN MÓVIL Y CÓDIGO QR
# ------------------------------------------------------------------------------
with tab_install:
    st.markdown("### 📱 Instala FinanzFlow en tu Celular o Tablet")
    st.markdown("""
    FinanzFlow es una **Progressive Web App (PWA)**. Puedes instalarla en cualquier dispositivo móvil o computadora 
    para utilizarla como una aplicación nativa, con icono en tu pantalla de inicio y funcionamiento sin conexión.
    """)

    col_qr, col_instrucciones = st.columns([1.2, 2.5])

    with col_qr:
        st.markdown("#### 📷 Escanea para abrir en tu Celular:")
        ip_local = get_local_ip()
        
        # Entrada opcional por si el usuario ya tiene su URL de Streamlit Cloud
        url_input = st.text_input(
            "URL del aplicativo:",
            value=f"http://{ip_local}:8501/app/static/index.html" if ip_local != "127.0.0.1" else "http://localhost:8501/app/static/index.html",
            help="Si ya desplegaste en Streamlit Cloud, escribe aquí tu enlace https://tu-app.streamlit.app/app/static/index.html para generar el QR."
        )

        qr_bytes = generar_qr_bytes(url_input)
        if qr_bytes:
            st.image(qr_bytes, caption="Escanea con la cámara de tu celular", use_container_width=True)
            st.download_button(
                label="💾 Descargar Código QR (PNG)",
                data=qr_bytes,
                file_name="finanzflow_qr.png",
                mime="image/png",
                use_container_width=True
            )
        else:
            st.info(f"Abre desde tu celular conectado a la misma red Wi-Fi: `{url_input}`")

    with col_instrucciones:
        st.markdown("#### 📲 Pasos de Instalación por Dispositivo:")

        with st.container():
            st.markdown("""
            <div class="glass-card">
                <h4 style="color:#60a5fa; margin-top:0;">🤖 Android (Google Chrome / Brave / Edge)</h4>
                <ol style="margin-bottom:0; font-size:0.92rem; line-height:1.6;">
                    <li>Abre el enlace directo en Google Chrome (<b>/app/static/index.html</b>).</li>
                    <li>Aparecerá automáticamente el banner inferior <b>"📲 Instalar FinanzFlow"</b>.</li>
                    <li>Si no aparece, toca el menú de tres puntos (<b>⋮</b>) en la esquina superior derecha.</li>
                    <li>Selecciona <b>"Instalar aplicación"</b> o <b>"Agregar a la pantalla principal"</b>.</li>
                    <li>¡Listo! FinanzFlow se abrirá como app nativa a pantalla completa.</li>
                </ol>
            </div>
            """, unsafe_allow_html=True)

        with st.container():
            st.markdown("""
            <div class="glass-card">
                <h4 style="color:#34d399; margin-top:0;">🍎 iPhone & iPad (Safari)</h4>
                <ol style="margin-bottom:0; font-size:0.92rem; line-height:1.6;">
                    <li>Abre el enlace directo en el navegador <b>Safari</b>.</li>
                    <li>Toca el botón <b>Compartir</b> (icono de cuadrado con una flecha hacia arriba en la barra inferior).</li>
                    <li>Desplázate hacia abajo y selecciona <b>"Agregar a pantalla de inicio"</b> (Add to Home Screen).</li>
                    <li>Confirma haciendo clic en <b>"Agregar"</b> en la esquina superior derecha.</li>
                    <li>FinanzFlow se guardará en tu pantalla con su propio icono sin barra de navegador.</li>
                </ol>
            </div>
            """, unsafe_allow_html=True)

        with st.container():
            st.markdown("""
            <div class="glass-card">
                <h4 style="color:#fbbf24; margin-top:0;">💻 Windows & macOS (Chrome / Edge)</h4>
                <ol style="margin-bottom:0; font-size:0.92rem; line-height:1.6;">
                    <li>Abre la aplicación en Chrome o Microsoft Edge.</li>
                    <li>Observa la barra de direcciones; aparecerá el icono <b>⊕</b> o <b>🖥️ Instalar</b>.</li>
                    <li>Haz clic en <b>"Instalar"</b> y se abrirá en una ventana independiente como programa de escritorio.</li>
                </ol>
            </div>
            """, unsafe_allow_html=True)

# ------------------------------------------------------------------------------
# TAB 3: USUARIOS Y ADMINISTRADOR GENERAL
# ------------------------------------------------------------------------------
with tab_admin:
    st.markdown("### 👑 Sistema Multi-Usuario con Administrador General")
    st.markdown("""
    FinanzFlow cuenta con un **sistema de autenticación robusto** y **aislamiento estricto de datos** por usuario.
    Cada miembro de la familia o del equipo gestiona sus finanzas de forma 100% independiente.
    """)

    col_u1, col_u2 = st.columns(2)

    with col_u1:
        st.markdown("""
        <div class="glass-card">
            <h4 style="color:#60a5fa; margin-top:0;">🔑 Credenciales de Acceso Inicial</h4>
            <table style="width:100%; font-size:0.95rem; color:#e2e8f0; border-collapse:collapse;">
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                    <td style="padding:8px 0;"><b>Rol:</b></td>
                    <td style="padding:8px 0;"><span class="badge-tag badge-blue">Administrador Maestro</span></td>
                </tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                    <td style="padding:8px 0;"><b>Usuario:</b></td>
                    <td style="padding:8px 0;"><code>admin</code></td>
                </tr>
                <tr>
                    <td style="padding:8px 0;"><b>Contraseña:</b></td>
                    <td style="padding:8px 0;"><code>admin123</code></td>
                </tr>
            </table>
            <p style="font-size:0.83rem; color:#94a3b8; margin-top:12px; margin-bottom:0;">
                💡 Puedes cambiar la contraseña del administrador en cualquier momento desde la sección <b>"👑 Gestión de Usuarios"</b> dentro de la app.
            </p>
        </div>
        """, unsafe_allow_html=True)

    with col_u2:
        st.markdown("""
        <div class="glass-card">
            <h4 style="color:#34d399; margin-top:0;">🛡️ Privacidad & Aislamiento Total</h4>
            <ul style="font-size:0.9rem; color:#e2e8f0; line-height:1.6; margin-bottom:0; padding-left:20px;">
                <li><b>Espacios de Datos Aislados:</b> La información de cada usuario se guarda bajo claves separadas (<code>finanzflow_u_&lt;id&gt;_*</code>).</li>
                <li><b>Ningún Usuario Puede Ver los Datos de Otro:</b> Ingresos, gastos, cuentas bancarias, metas y recibos son estrictamente privados.</li>
                <li><b>Hash SHA-256:</b> Las contraseñas nunca se guardan en texto plano; se utiliza la API criptográfica nativa del navegador.</li>
            </ul>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("#### 📦 Respaldo y Exportación de Datos")
    st.info("""
    Para salvaguardar tu información o transferirla entre dispositivos:
    1. Ingresa a FinanzFlow y dirígete a la sección **⚙️ Ajustes**.
    2. En el panel **"Copia de Seguridad y Restauración"**, haz clic en **"Exportar Copia de Seguridad (JSON)"**.
    3. Para restaurar tus datos en otro teléfono o navegador, haz clic en **"Importar Copia de Seguridad"** y selecciona tu archivo JSON.
    """)

# ------------------------------------------------------------------------------
# TAB 4: GUÍA DE DESPLIEGUE EN STREAMLIT CLOUD
# ------------------------------------------------------------------------------
with tab_deploy:
    st.markdown("### 🚀 Cómo Desplegar este Proyecto en Streamlit Community Cloud")
    st.markdown("""
    Streamlit Community Cloud ofrece **alojamiento gratuito e ilimitado** directamente desde tu repositorio de GitHub.
    """)

    st.markdown("""
    <div class="glass-card">
        <h4 style="color:#60a5fa; margin-top:0;">Paso 1: Subir el proyecto a GitHub</h4>
        <ol style="font-size:0.92rem; line-height:1.6; color:#e2e8f0; margin-bottom:0;">
            <li>Crea un nuevo repositorio en tu cuenta de GitHub (ejemplo: <code>https://github.com/tu-usuario/finanzflow-streamlit</code>).</li>
            <li>En esta carpeta, ejecuta el archivo <code>subir_a_github.bat</code>.</li>
            <li>Ingresa la URL de tu nuevo repositorio cuando el script lo solicite.</li>
            <li>El script confirmará y subirá todos los archivos a la rama <code>main</code> automáticamente.</li>
        </ol>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="glass-card">
        <h4 style="color:#34d399; margin-top:0;">Paso 2: Conectar en Streamlit Community Cloud</h4>
        <ol style="font-size:0.92rem; line-height:1.6; color:#e2e8f0; margin-bottom:0;">
            <li>Ingresa a <a href="https://share.streamlit.io" target="_blank" style="color:#60a5fa; font-weight:700;">share.streamlit.io</a> e inicia sesión con tu cuenta de GitHub.</li>
            <li>Haz clic en el botón azul <b>"Create app"</b> (o <b>"New app"</b>).</li>
            <li>Completa el formulario con la siguiente configuración exacta:
                <ul style="margin-top:6px;">
                    <li><b>Repository:</b> <code>tu-usuario/finanzflow-streamlit</code></li>
                    <li><b>Branch:</b> <code>main</code></li>
                    <li><b>Main file path:</b> <code>app.py</code></li>
                </ul>
            </li>
            <li>Haz clic en <b>"Deploy!"</b>.</li>
            <li>¡En 1 a 2 minutos tu aplicativo estará disponible públicamente con certificado SSL gratuito (https)!</li>
        </ol>
    </div>
    """, unsafe_allow_html=True)
