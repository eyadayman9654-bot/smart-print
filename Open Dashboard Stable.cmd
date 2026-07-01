@echo off
setlocal
set "APP_DIR=C:\Users\Ayman Makroum\Desktop\insight-dashboard-main (1)\insight-dashboard-main"
set "URL=http://127.0.0.1:5173/login"
set "PORT=5173"

if exist "%APP_DIR%\package.json" goto app_found
echo Dashboard app folder was not found.
echo Expected: "%APP_DIR%"
pause
exit /b 1

:app_found
where node >nul 2>nul
if not errorlevel 1 goto node_found
echo Node.js is required to open this dashboard.
echo Install Node.js, then run this launcher again.
pause
exit /b 1

:node_found
cd /d "%APP_DIR%"

if exist "node_modules" goto deps_ready
echo First launch setup: installing dashboard files. This can take a few minutes.
call npm.cmd install --cache ".npm-cache"
if not errorlevel 1 goto deps_ready
echo Setup failed. Check your internet connection and run this again.
pause
exit /b 1

:deps_ready
echo Resetting dashboard server...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$pids = @(Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); foreach ($processId in $pids) { if ($processId -and $processId -ne $PID) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue } }"

if exist ".output" goto build_ready
echo Preparing dashboard for stable launch. This can take a minute.
call npm.cmd run build
if not errorlevel 1 goto build_ready
echo Dashboard build failed.
pause
exit /b 1

:build_ready
echo Starting fresh dashboard server...
start "Dashboard Server" /min cmd /k "cd /d ""%APP_DIR%"" && npm.cmd run preview -- --host 127.0.0.1 --port %PORT% --strictPort"

echo Waiting for dashboard to be ready...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready = $false; for ($i = 0; $i -lt 60; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5173/login' -TimeoutSec 2; if ($r.StatusCode -ge 200) { $ready = $true; break } } catch {}; Start-Sleep -Milliseconds 750 }; if ($ready) { exit 0 } else { exit 1 }"
if not errorlevel 1 goto open_dashboard

echo Dashboard did not start in time.
echo Close any Dashboard Server windows, then run this launcher again.
pause
exit /b 1

:open_dashboard
start "" "%URL%"
exit /b 0
