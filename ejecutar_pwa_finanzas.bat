@echo off
title FINANZFLOW - CONTROL FINANCIERO PERSONAL
chcp 65001 > nul
cd /d "%~dp0"

echo ======================================================================
echo    FINANZFLOW - CONTROL FINANCIERO PERSONAL (OFFLINE-FIRST)
echo ======================================================================
echo.
echo [*] Directorio de trabajo: %CD%
echo [*] Iniciando servidor web local (app.py)...
echo [*] Tu navegador predeterminado se abrira automaticamente.
echo [*] Presiona Ctrl+C en cualquier momento para detener la aplicacion.
echo.

python app.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Ocurrio un error al ejecutar el aplicativo.
    pause
)
