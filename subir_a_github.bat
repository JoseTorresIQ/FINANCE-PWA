@echo off
title SUBIR FINANZFLOW A GITHUB - FINANCE-PWA
chcp 65001 > nul
cd /d "%~dp0"

echo ======================================================================
echo    FINANZFLOW - SUBIR TODOS LOS ARCHIVOS A GITHUB
echo ======================================================================
echo.

set TARGET_REPO=https://github.com/JoseTorresIQ/FINANCE-PWA.git

:: 1. Verificar y asegurar el repositorio remoto de GitHub
echo [1/3] Verificando repositorio remoto de GitHub...
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   Configurando repositorio remoto: %TARGET_REPO%
    git remote add origin %TARGET_REPO%
) else (
    git remote set-url origin %TARGET_REPO%
)

echo   Destino remoto configurado: %TARGET_REPO%
git branch -M main >nul 2>&1

:: 2. Preparar todos los archivos para el commit
echo.
echo [2/3] Preparando todos los archivos del proyecto (git add -A)...
git add -A

git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
    echo   Archivos detectados con cambios listos para subir:
    git status --short
    echo.
    set /p COMMIT_MSG="  Mensaje del commit (Presiona ENTER para usar mensaje automatico): "
    if "%COMMIT_MSG%"=="" (
        set COMMIT_MSG=Actualizacion de FinanzFlow PWA - %DATE% %TIME%
    )
    git commit -m "%COMMIT_MSG%"
    echo   [OK] Cambios confirmados localmente.
) else (
    echo   No hay modificaciones locales nuevas por confirmar.
)

:: 3. Subir a GitHub
echo.
echo [3/3] Subiendo todos los archivos a GitHub (rama main)...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo  [EXITO] ¡Todos los archivos fueron subidos correctamente a GitHub!
    echo ======================================================================
    echo.
    echo  - Repositorio: %TARGET_REPO%
    echo  - Rama:        main
    echo  - Entry Point: app.py
    echo.
) else (
    echo.
    echo ======================================================================
    echo  [!] Error al subir a GitHub.
    echo ======================================================================
    echo  Verifica que tu conexion a internet este activa y que tus credenciales
    echo  de GitHub esten autenticadas en tu equipo.
    echo.
)

pause
