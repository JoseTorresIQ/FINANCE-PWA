#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
FINANZFLOW — SISTEMA DE CONTROL FINANCIERO PERSONAL OFFLINE-FIRST
=============================================================================
Archivo de Ejecución Principal (Entry Point): app.py

1. EJECUCIÓN LOCAL NATIVA (Recomendada):
   python app.py
   Opera 100% con la Biblioteca Estándar de Python (http.server, socket, webbrowser).
   No requiere instalar librerías externas ni crea archivos temporales.

2. DESPLIEGUE EN STREAMLIT COMMUNITY CLOUD:
   streamlit run app.py
   Detecta el entorno Streamlit e incrusta la aplicación de manera autónoma sin
   requerir carpetas ni configuraciones externas.
=============================================================================
"""

import sys
import os
import socket
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

# ---------------------------------------------------------------------------
# SERVIDOR NATIVO OFFLINE-FIRST (BIBLIOTECA ESTÁNDAR DE PYTHON)
# ---------------------------------------------------------------------------
class PWAHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Manejador HTTP con soporte explícito para Service Worker y Manifest PWA."""

    extensions_map = SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({
        '.webmanifest': 'application/manifest+json',
        '.json': 'application/json',
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.html': 'text/html; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.ico': 'image/x-icon',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf'
    })

    def end_headers(self):
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def get_local_ip():
    """Detecta la dirección IP local de la máquina en la red Wi-Fi/LAN."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(('8.8.8.8', 80))
            return s.getsockname()[0]
    except Exception:
        return '127.0.0.1'

def find_available_port(start_port=8000, max_attempts=50):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

def run_server():
    """Inicia el servidor local nativo y abre el navegador."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    env_port = os.environ.get('PORT')
    if env_port and env_port.isdigit():
        port = int(env_port)
    elif len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    else:
        port = find_available_port(8000)

    server_address = ('0.0.0.0', port)
    local_ip = get_local_ip()
    local_url = f"http://localhost:{port}/index.html"
    network_url = f"http://{local_ip}:{port}/index.html"

    print("=" * 72)
    print("     FINANZFLOW - SERVIDOR CENTRALIZADO PWA OFFLINE-FIRST")
    print("=" * 72)
    print(f"[*] Directorio:        {base_dir}")
    print(f"[*] Acceso en esta PC: {local_url}")
    if local_ip != '127.0.0.1':
        print(f"[*] Acceso desde Móvil:{network_url}")
        print("    (Conéctate a la misma red Wi-Fi desde tu celular e ingresa)")
    print("[*] Service Worker y Caché Offline: LISTOS")
    print("[*] Presiona Ctrl+C en cualquier momento para detener el servidor.")
    print("=" * 72)

    if '--no-browser' not in sys.argv:
        try:
            webbrowser.open(local_url)
        except Exception as e:
            print(f"[!] No se pudo abrir el navegador automáticamente: {e}")

    httpd = HTTPServer(server_address, PWAHTTPRequestHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Servidor detenido correctamente.")
        httpd.server_close()
        sys.exit(0)

# ---------------------------------------------------------------------------
# SOPORTE STREAMLIT (SÓLO SI SE INVOCA MEDIANTE 'streamlit run app.py')
# ---------------------------------------------------------------------------
def render_streamlit():
    """Renderiza FinanzFlow dentro del runtime de Streamlit sin dependencias de carpetas extra."""
    try:
        import streamlit as st
        import streamlit.components.v1 as components
    except ImportError:
        print("[!] Para desplegar en Streamlit se requiere instalar streamlit: pip install streamlit")
        return

    st.set_page_config(
        page_title="FinanzFlow — Control Financiero Personal",
        page_icon="💰",
        layout="wide",
        initial_sidebar_state="collapsed"
    )

    st.markdown("""
    <style>
      header[data-testid="stHeader"] { display: none !important; }
      footer { display: none !important; }
      .main .block-container {
        padding: 0 !important;
        max-width: 100% !important;
      }
      iframe {
        border: none !important;
        width: 100% !important;
      }
    </style>
    """, unsafe_allow_html=True)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    html_file = os.path.join(base_dir, "index.html")

    if not os.path.exists(html_file):
        st.error("No se encontró el archivo index.html en el directorio del proyecto.")
        return

    with open(html_file, "r", encoding="utf-8") as f:
        html = f.read()

    # Incrustar CSS directamente para evitar requerir rutas estáticas
    css_file = os.path.join(base_dir, "css", "styles.css")
    if os.path.exists(css_file):
        with open(css_file, "r", encoding="utf-8") as f:
            css_content = f.read()
        html = html.replace('<link rel="stylesheet" href="css/styles.css">', f'<style>\n{css_content}\n</style>')

    # Incrustar módulos JS directamente para compatibilidad total
    js_modules = [
        "storage.js", "auth.js", "charts.js", "security.js",
        "transactions.js", "budgets.js", "goals.js",
        "calendar.js", "calculators.js", "app.js"
    ]
    for js_name in js_modules:
        js_path = os.path.join(base_dir, "js", js_name)
        if os.path.exists(js_path):
            with open(js_path, "r", encoding="utf-8") as f:
                js_content = f.read()
            html = html.replace(f'<script src="js/{js_name}"></script>', f'<script>\n{js_content}\n</script>')

    components.html(html, height=950, scrolling=True)


# ---------------------------------------------------------------------------
# DETECCIÓN DE MODO DE EJECUCIÓN (LOCAL VS STREAMLIT)
# ---------------------------------------------------------------------------
def is_running_in_streamlit() -> bool:
    try:
        from streamlit.runtime.scriptrunner import get_script_run_ctx
        return get_script_run_ctx(suppress_warning=True) is not None
    except Exception:
        return False

if __name__ == '__main__':
    if sys.platform.startswith('win'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    # Si se ejecuta mediante 'streamlit run app.py'
    if is_running_in_streamlit():
        render_streamlit()
    else:
        # Ejecución local nativa directa: python app.py
        run_server()
else:
    # Si fue importado por Streamlit runtime
    if is_running_in_streamlit():
        render_streamlit()
