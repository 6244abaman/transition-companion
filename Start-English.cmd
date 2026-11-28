@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Companion.ps1" -Language en %*
if errorlevel 1 pause
