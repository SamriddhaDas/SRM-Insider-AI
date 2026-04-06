@echo off
setlocal enabledelayedexpansion
title SRM Insider AI

echo.
echo  ==========================================
echo    SRM Insider AI  v1.0.0
echo    Submission Query Assistant
echo  ==========================================
echo.

REM Check Node
where node >nul 2>&1 || (echo [ERROR] Node.js not found - install from nodejs.org & pause & exit /b 1)
for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js %%v

REM Load API key from .env
set ANTHROPIC_API_KEY=
if exist "backend\.env" (
  for /f "usebackq tokens=1,2 delims==" %%a in ("backend\.env") do (
    if "%%a"=="ANTHROPIC_API_KEY" set ANTHROPIC_API_KEY=%%b
  )
  echo [OK] Loaded backend\.env
)

if "!ANTHROPIC_API_KEY!"=="" (
  echo.
  echo [WARNING] ANTHROPIC_API_KEY not found!
  echo.
  echo  Create file: backend\.env
  echo  Add line:    ANTHROPIC_API_KEY=sk-ant-your-key
  echo.
  set /p INPUT_KEY="Or paste your key here and press Enter: "
  if not "!INPUT_KEY!"=="" (
    set ANTHROPIC_API_KEY=!INPUT_KEY!
    echo ANTHROPIC_API_KEY=!INPUT_KEY!> backend\.env
    echo [OK] Key saved to backend\.env
  )
) else (
  echo [OK] API key loaded
)

REM Install deps
echo.
echo [..] Installing dependencies...
pushd backend && call npm install --silent && popd
pushd frontend && call npm install --silent && popd
echo [OK] Dependencies ready

REM Kill processes on ports 3000 and 3001 first
echo.
echo [..] Freeing ports 3000 and 3001...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do (
  taskkill /f /pid %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
  taskkill /f /pid %%p >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo [OK] Ports cleared

REM Start Backend
echo.
echo [..] Starting backend on port 3001...
start "SRM-Backend" cmd /c "cd backend && set ANTHROPIC_API_KEY=!ANTHROPIC_API_KEY! && node server.js"
timeout /t 5 /nobreak >nul

REM Check backend is up
curl -s http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Backend failed to start!
  echo         Check that node is installed and port 3001 is free.
  pause & exit /b 1
)
echo [OK] Backend running on http://localhost:3001

REM Start Frontend
echo.
echo [..] Starting frontend on port 3000...
start "SRM-Frontend" cmd /c "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo  ==========================================
echo  [OK] SRM Insider AI is running!
echo.
echo    Open browser: http://localhost:3000
echo.
echo    Closing this window will stop the app.
echo  ==========================================
echo.

start "" http://localhost:3000
echo Press any key to stop all services...
pause >nul

echo Stopping...
taskkill /fi "WINDOWTITLE eq SRM-Backend" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq SRM-Frontend" /f >nul 2>&1
echo Done.
