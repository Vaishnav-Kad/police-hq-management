@echo off
title Maharashtra Police Headquarters System Launcher
color 0B
echo ================================================================
echo    MAHARASHTRA POLICE HEADQUARTERS DATA MANAGEMENT SYSTEM
echo                   Starting Local Servers...
echo ================================================================
echo.

echo [1/2] Starting Backend API Server (Port 5000)...
start "PHDMS Backend API" cmd /k "cd server && node index.js"

echo [2/2] Starting Frontend Vite Dev Server (Port 5173)...
start "PHDMS Frontend Client" cmd /k "cd client && npx vite --host"

echo.
echo ================================================================
echo    All services launched successfully!
echo    - Frontend App:   http://localhost:5173/
echo    - Officers Roster: http://localhost:5173/officers
echo    - Crime GIS Map:  http://localhost:5173/map
echo    - Backend API:    http://localhost:5000/
echo ================================================================
echo.
timeout /t 5
start http://localhost:5173/
exit
