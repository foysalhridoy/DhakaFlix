@echo off
setlocal
cd /d "%~dp0"
title DhakaFlix Modern Streamer

echo ========================================================
echo          DhakaFlix Modern ISP FTP Streamer
echo ========================================================
echo.
echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Freeing port 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting streaming server...
start "" http://localhost:3000
node server.js

pause
