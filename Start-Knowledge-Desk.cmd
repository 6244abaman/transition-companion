@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0next-generation\windows\start.ps1" -KnowledgeDesk %*
if errorlevel 1 pause
