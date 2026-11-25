$ErrorActionPreference = 'Stop'
$runtimeDir = Join-Path (Split-Path -Parent $PSScriptRoot) '.local'
$ownerPath = Join-Path $runtimeDir 'owner.json'
try {
  if (-not (Test-Path $ownerPath)) { Write-Host 'Next Generation is already stopped.'; exit 0 }
  $owner = Get-Content $ownerPath -Raw | ConvertFrom-Json
  $ownedProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($owner.pid)" -ErrorAction SilentlyContinue
  if (-not $ownedProcess) { Remove-Item -LiteralPath $ownerPath; Write-Host 'Next Generation is already stopped.'; exit 0 }
  if ($ownedProcess.CommandLine -notlike '*server/main.mjs*') { throw 'The saved process no longer belongs to this app. It was not stopped.' }
  # Server verifies the random instance token; never kill other Node processes.
  Invoke-RestMethod 'http://127.0.0.1:43128/__shutdown' -Method Post -Headers @{Authorization="Bearer $($owner.token)"} -TimeoutSec 5 | Out-Null
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    if (-not (Get-Process -Id $owner.pid -ErrorAction SilentlyContinue)) { break }
    Start-Sleep -Milliseconds 200
  }
  if (Get-Process -Id $owner.pid -ErrorAction SilentlyContinue) { throw 'The app is still finishing. Try Stop again shortly.' }
  Remove-Item -LiteralPath $ownerPath
  Write-Host 'Next Generation stopped. Your encrypted memory remains in this browser.'
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
