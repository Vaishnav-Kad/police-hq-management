@echo off
title Police HQ - Public Teammate Sharing Gateway
color 0B
cls
echo ======================================================================
echo    POLICE HEADQUARTERS DATA MANAGEMENT SYSTEM (PHDMS v2.0)
echo    TEAMMATE SHARING GATEWAY (PUBLIC INTERNET TUNNEL)
echo ======================================================================
echo.
echo Checking connection to local server on port 5173...
echo Starting free secure tunnel...
echo.
echo Teammates can open this link from ANY computer or phone without installing anything!
echo.
npx localtunnel --port 5173
pause
