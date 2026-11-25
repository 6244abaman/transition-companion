@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0next-generation\windows\start.ps1" -KnowledgeDesk -NoBrowser
if errorlevel 1 goto end
node "%~dp0next-generation\server\staff-cli.mjs"
:end
pause
