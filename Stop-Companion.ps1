$ErrorActionPreference = 'Stop'
$baseUrl = 'http://127.0.0.1:43127'
try {
    try { $health = Invoke-RestMethod -Uri "$baseUrl/__local/health" -TimeoutSec 2 -UseBasicParsing } catch { $health = $null }
    if (!$health) { Write-Host 'Transition Companion is already stopped.'; exit 0 }
    if ($health.service -ne 'transition-companion-local' -or $health.root -ne $PSScriptRoot) { throw 'Another app or copy is using this port. No process was stopped.' }
    $statePath = Join-Path $PSScriptRoot '.local\runtime.json'
    $state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($state.pid -ne $health.pid) { throw 'The server state does not match this instance. No process was stopped.' }
    Invoke-RestMethod -Uri "$baseUrl/__local/stop" -Method Post -Headers @{'X-Local-Control'=$state.token} -TimeoutSec 3 -UseBasicParsing | Out-Null
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 100
        try { $null = Invoke-RestMethod -Uri "$baseUrl/__local/health" -TimeoutSec 1 -UseBasicParsing } catch { Write-Host 'Transition Companion stopped. Your browser data was kept.'; exit 0 }
    }
    throw 'The server has not finished stopping. Close its browser windows and try Stop.cmd again.'
} catch {
    Write-Host "Could not stop Transition Companion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
