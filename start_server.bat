@echo off
setlocal enabledelayedexpansion
title Diario WebApp - Iniciar Servidor (Invisivel)

:: Define o diretório do script
cd /d "%~dp0"

echo ========================================
echo   DIARIO WEBAPP - INICIAR SERVIDOR
echo         (MODO INVISIVEL)
echo ========================================
echo.

:: Verifica se Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ ERRO: Python nao encontrado!
    echo   Instale o Python antes de continuar.
    echo   Download: https://python.org/
    pause
    exit /b 1
)

echo ✓ Python encontrado: 
python --version

:: Verifica se já existe servidor rodando na porta 5001 (porta padrão do Flask)
echo.
echo Verificando porta 5001...
netstat -ano | findstr :5001 >nul 2>&1
if %errorlevel% == 0 (
    echo ✗ ERRO: Porta 5001 ja esta em uso!
    echo   Pare o processo existente primeiro ou use uma porta diferente.
    echo    --------------------------------------------------------------
    echo ✓ Abrindo no navegador: http://localhost:5001
    start http://localhost:5001
::    echo.
    exit
::    pause
::    exit /b 1
)

echo ✓ Porta 5001 esta livre

:: Verifica se requirements.txt existe
if not exist "requirements.txt" (
    echo ✗ ERRO: requirements.txt nao encontrado!
    echo   Verifique se esta no diretorio correto.
    pause
    exit /b 1
)

:: Verifica se app.py existe
if not exist "app.py" (
    echo ✗ ERRO: app.py nao encontrado!
    echo   Verifique se o arquivo existe no diretorio atual.
    pause
    exit /b 1
)

:: Instala dependências do Python
echo.
echo ⚠ Verificando dependencias do Python...
pip install -r requirements.txt >nul 2>&1
if !errorlevel! neq 0 (
    echo ✗ ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas com sucesso

:: Cria arquivo de dados se não existir
if not exist "task-data.json" (
    echo Criando arquivo de dados...
    echo [] > task-data.json
)

echo.
echo ========================================
echo ✓ Iniciando servidor em modo invisivel...
echo ✓ Porta: 5001
echo ✓ Arquivo: app.py
echo ========================================
echo.
echo IMPORTANTE:
echo - O servidor sera executado em background (invisivel)
echo - Para parar o servidor, feche pelo Gerenciador de Tarefas
echo - O servidor continuara rodando mesmo se voce fechar esta janela
echo.

:: Inicia o servidor em modo invisível usando VBScript
echo Creating invisible server launcher...
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.Run "cmd /c cd /d ""%~dp0"" && python app.py", 0, False
) > "%TEMP%\start_invisible_flask.vbs"

:: Executa o VBScript
cscript //nologo "%TEMP%\start_invisible_flask.vbs"

:: Remove o arquivo temporário
del "%TEMP%\start_invisible_flask.vbs" >nul 2>&1

:: Aguarda um pouco para o servidor inicializar
timeout /t 3 /nobreak >nul

:: Verifica se o servidor está rodando
echo Verificando se o servidor foi iniciado...
netstat -ano | findstr :5001 >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Servidor iniciado com sucesso em modo invisivel!
    echo ✓ Acesse: http://localhost:5001
    echo.
    echo Para parar o servidor, use o Gerenciador de Tarefas
) else (
    echo ✗ ERRO: Falha ao iniciar o servidor
    echo   Verifique os logs ou tente executar python app.py manualmente
)

echo.
echo ========================================
echo ✓ INICIALIZACAO CONCLUIDA
echo ========================================
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
