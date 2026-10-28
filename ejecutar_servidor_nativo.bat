@echo off
title FINANZFLOW - SERVIDOR NATIVO OFFLINE
chcp 65001 > nul
cd /d "%~dp0"

echo ======================================================================
echo       FINANZFLOW - SERVIDOR NATIVO (HTTP.SERVER STANDARD)
echo ======================================================================
echo.
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Error al ejecutar el servidor nativo.
    pause
)
