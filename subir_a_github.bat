@echo off
title SUBIR FINANZFLOW A GITHUB (DEPLOY STREAMLIT)
chcp 65001 > nul
cd /d "%~dp0"

echo ======================================================================
echo    FINANZFLOW - SUBIR PROYECTO A GITHUB PARA STREAMLIT CLOUD
echo ======================================================================
echo.

:: 1. Verificar si git está inicializado
if not exist ".git" (
    echo [1/4] Inicializando nuevo repositorio Git local...
    git init
    git branch -M main
    echo   [OK] Repositorio Git inicializado en rama main.
) else (
    echo [1/4] Repositorio Git local existente detectado.
    git branch -M main >nul 2>&1
)

:: 2. Verificar o configurar el repositorio remoto de GitHub
echo.
echo [2/4] Verificando repositorio remoto de GitHub...
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   ------------------------------------------------------------------
    echo   No se ha configurado un repositorio remoto aun.
    echo   Primero, crea un repositorio vacio en https://github.com/new
    echo   (por ejemplo llamado: personal-finance-streamlit o similar)
    echo   ------------------------------------------------------------------
    echo.
    set /p REPO_URL="  Ingresa la URL del repositorio de GitHub (HTTPS o SSH): "
    if "%REPO_URL%"=="" (
        echo   [!] No ingresaste una URL. No se puede continuar con la subida.
        pause
        exit /b 1
    )
    git remote add origin %REPO_URL%
    echo   [OK] Destino remoto configurado: %REPO_URL%
) else (
    for /f "delims=" %%i in ('git remote get-url origin') do set CURRENT_REMOTE=%%i
    echo   Destino remoto actual: %CURRENT_REMOTE%
    echo.
    set /p CAMBIAR="  ¿Deseas cambiar la URL del repositorio remoto? (S/N) [N]: "
    if /i "%CAMBIAR%"=="S" (
        set /p NUEVA_URL="  Ingresa la nueva URL de GitHub: "
        if not "%NUEVA_URL%"=="" (
            git remote set-url origin %NUEVA_URL%
            set CURRENT_REMOTE=%NUEVA_URL%
            echo   [OK] Repositorio remoto actualizado a: %CURRENT_REMOTE%
        )
    )
)

:: 3. Preparar todos los archivos y realizar Commit
echo.
echo [3/4] Preparando archivos para commit (git add -A)...
git add -A

git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
    echo   Archivos detectados listos para subir:
    git status --short
    echo.
    set /p COMMIT_MSG="  Mensaje del commit (ENTER para mensaje por defecto): "
    if "%COMMIT_MSG%"=="" (
        set COMMIT_MSG=Despliegue de FinanzFlow PWA para Streamlit Cloud - app.py
    )
    git commit -m "%COMMIT_MSG%"
    echo   [OK] Commit confirmado localmente.
) else (
    echo   No hay cambios nuevos pendientes de commit.
)

:: 4. Subir a GitHub
echo.
echo [4/4] Subiendo cambios a GitHub (git push -u origin main)...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   [EXITO] ¡Proyecto subido exitosamente a GitHub!
    echo ======================================================================
    echo.
    echo   PROXIMOS PASOS PARA DESPLEGAR EN STREAMLIT COMMUNITY CLOUD:
    echo   1. Ingresa a: https://share.streamlit.io
    echo   2. Inicia sesion con tu cuenta de GitHub.
    echo   3. Haz clic en "Create app" o "New app".
    echo   4. Configura:
    echo        - Repository:     Tu nuevo repositorio
    echo        - Branch:         main
    echo        - Main file path: app.py
    echo   5. Haz clic en "Deploy!".
    echo.
    echo ======================================================================
) else (
    echo.
    echo ======================================================================
    echo   [!] Error al subir a GitHub.
    echo ======================================================================
    echo   Verifica:
    echo   1. Que el repositorio remoto exista en tu cuenta de GitHub.
    echo   2. Que tengas permisos de escritura y tus credenciales autenticadas.
    echo   3. Que tu conexion a internet este activa.
    echo.
)

pause
