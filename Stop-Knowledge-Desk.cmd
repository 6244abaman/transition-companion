@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0next-generation\windows\stop.ps1" -KnowledgeDesk
if errorlevel 1 pause
