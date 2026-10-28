"""
FinanzFlow PWA - Entry Point Alternativo para Streamlit Cloud
============================================================
Redirige la ejecucion a app.py para compatibilidad total con Streamlit Community Cloud.
"""
import os
import sys
import runpy

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

app_path = os.path.join(BASE_DIR, "app.py")
runpy.run_path(app_path, run_name="__main__")
