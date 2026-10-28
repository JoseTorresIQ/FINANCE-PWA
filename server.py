#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FinanzFlow PWA - Servidor Centralizado Offline-First
Sirve la Progressive Web App con los tipos MIME correctos para Service Workers y Web App Manifest.
Permite acceso local (localhost) y acceso en red Wi-Fi para celulares y tablets (0.0.0.0).
"""

import sys
import os
import socket
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

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
        # Cabeceras para Service Worker y Caché adecuada en desarrollo local
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

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
    # Asegurar que el directorio de trabajo sea la raíz del proyecto
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    # Permitir puerto por variable de entorno o argumento
    env_port = os.environ.get('PORT')
    if env_port and env_port.isdigit():
        port = int(env_port)
    elif len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    else:
        port = find_available_port(8000)

    # Vincular a 0.0.0.0 para acceso tanto local como desde celular en la misma Wi-Fi
    server_address = ('0.0.0.0', port)
    local_ip = get_local_ip()
    local_url = f"http://localhost:{port}/index.html"
    network_url = f"http://{local_ip}:{port}/index.html"

    print("=" * 72)
    print("     FINANZFLOW - SERVIDOR CENTRALIZADO PWA OFFLINE-FIRST")
    print("=" * 72)
    print(f"[*] Directorio raiz:    {base_dir}")
    print(f"[*] Acceso en esta PC:  {local_url}")
    if local_ip != '127.0.0.1':
        print(f"[*] Acceso desde Movil: {network_url}")
        print("    (Conectate a la misma red Wi-Fi desde tu celular e ingresa)")
    print("[*] Service Worker y Cache Offline: LISTOS")
    print("[*] Presiona Ctrl+C en cualquier momento para detener el servidor.")
    print("=" * 72)

    # Abrir navegador automáticamente solo si no se pasó --no-browser
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

if __name__ == '__main__':
    run_server()
