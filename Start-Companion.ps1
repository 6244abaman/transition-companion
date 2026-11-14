param(
    [ValidateSet('he', 'en')][string]$Language = 'he',
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
$appRoot = $PSScriptRoot
$baseUrl = 'http://127.0.0.1:43127'
$runtimeDir = Join-Path $appRoot '.local'
function Read-Health {
    try { Invoke-RestMethod -Uri "$baseUrl/__local/health" -TimeoutSec 2 -UseBasicParsing } catch { $null }
}
function Is-ThisApp($health) {
    $health -and $health.service -eq 'transition-companion-local' -and $health.root -eq $appRoot
}
try {
    $health = Read-Health
    if ($health -and !(Is-ThisApp $health)) { throw 'Port 43127 belongs to another app or copy. Stop that copy first. The port stays fixed to preserve your browser data.' }
    if (!(Is-ThisApp $health)) {
        $node = Get-Command node.exe -ErrorAction SilentlyContinue
        if (!$node) { throw 'Node.js 24 is required. Install Node.js 24 LTS, then double-click Start.cmd again.' }
        $nodeVersion = & $node.Source --version
        if ($nodeVersion -notmatch '^v24\.') { throw "This app is tested with Node.js 24. Found $nodeVersion. Use Node.js 24, then try again." }
        New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
        $serverFile = Join-Path $appRoot 'windows\server.cjs'
        $serverProcess = Start-Process -FilePath $node.Source -ArgumentList @('"' + $serverFile + '"') -WorkingDirectory $appRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'server.log') -RedirectStandardError (Join-Path $runtimeDir 'error.log') -PassThru
        for ($attempt = 0; $attempt -lt 40; $attempt++) {
            Start-Sleep -Milliseconds 250
            $health = Read-Health
            if (Is-ThisApp $health) { break }
            if ($serverProcess.HasExited) { throw 'The local server could not start. Port 43127 may be busy. See .local\error.log in this folder.' }
        }
        if (!(Is-ThisApp $health)) { throw 'The local server did not become ready. See .local\error.log in this folder.' }
    }
    $page = if ($Language -eq 'he') { 'indexH.html' } else { 'index.html' }
    $appUrl = "$baseUrl/$page"
    Write-Host "Transition Companion is ready: $appUrl"
    Write-Host 'You can close this window. Use Stop.cmd to stop the local server.'
    if (!$NoBrowser) {
        $browserPath = @(
            (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
            (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe')
        ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
        if ($browserPath) { Start-Process -FilePath $browserPath -ArgumentList @("--app=$appUrl") }
        else { Start-Process $appUrl }
    }
    exit 0
} catch {
    Write-Host "Could not open Transition Companion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
