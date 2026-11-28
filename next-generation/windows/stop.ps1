param([switch]$KnowledgeDesk)
$ErrorActionPreference = 'Stop'
$runtimeDir = Join-Path (Split-Path -Parent $PSScriptRoot) '.local'
$ownerPath = Join-Path $runtimeDir $(if ($KnowledgeDesk) { 'knowledge-owner.json' } else { 'owner.json' })
$port = if ($KnowledgeDesk) { 43129 } else { 43128 }
$serverScript = if ($KnowledgeDesk) { 'server/desk-main.mjs' } else { 'server/main.mjs' }
$appLabel = if ($KnowledgeDesk) { 'Knowledge Desk' } else { 'Next Generation' }
try {
  if (-not (Test-Path $ownerPath)) { Write-Host "$appLabel is already stopped."; exit 0 }
  $owner = Get-Content $ownerPath -Raw | ConvertFrom-Json
  $ownedProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($owner.pid)" -ErrorAction SilentlyContinue
  if (-not $ownedProcess) { Remove-Item -LiteralPath $ownerPath; Write-Host "$appLabel is already stopped."; exit 0 }
  if ($ownedProcess.CommandLine -notlike "*$serverScript*") { throw 'The saved process no longer belongs to this app. It was not stopped.' }
  # Server verifies the random instance token; never kill other Node processes.
  Invoke-RestMethod "http://127.0.0.1:$port/__shutdown" -Method Post -Headers @{Authorization="Bearer $($owner.token)"} -TimeoutSec 5 | Out-Null
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    if (-not (Get-Process -Id $owner.pid -ErrorAction SilentlyContinue)) { break }
    Start-Sleep -Milliseconds 200
  }
  if (Get-Process -Id $owner.pid -ErrorAction SilentlyContinue) { throw 'The app is still finishing. Try Stop again shortly.' }
  Remove-Item -LiteralPath $ownerPath
  Write-Host $(if ($KnowledgeDesk) { 'Knowledge desk stopped. Its local public knowledge and staff records remain on this computer.' } else { 'Next Generation stopped. Your encrypted memory remains in this browser.' })
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
