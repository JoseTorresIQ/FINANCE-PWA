@echo off
title FINANZFLOW - STREAMLIT PWA
chcp 65001 > nul
cd /d "%~dp0"

echo ======================================================================
echo       FINANZFLOW - SERVIDOR STREAMLIT PWA OFFLINE-FIRST
echo ======================================================================
echo.
echo [*] Directorio del Proyecto: %CD%
echo [*] Archivo de Despliegue:   app.py
echo [*] Verificando dependencias de Streamlit...
echo.

python -c "import streamlit" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Streamlit no esta instalado. Instalando dependencias desde requirements.txt...
    pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] No se pudieron instalar las dependencias requeridas.
        pause
        exit /b 1
    )
)

echo [*] Iniciando Streamlit (app.py)...
echo [*] Presiona Ctrl+C en cualquier momento para detener la aplicacion.
echo.

streamlit run app.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Ocurrio un error al ejecutar Streamlit.
    pause
)
