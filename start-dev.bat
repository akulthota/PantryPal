@echo off
title PantryPal Dev Server
echo ===================================================
echo Starting PantryPal Dev Server (DeepSeek Edition)...
echo ===================================================
cd /d "%~dp0"
npm.cmd run dev
pause
