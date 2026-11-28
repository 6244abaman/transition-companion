param([switch]$NoBrowser, [switch]$KnowledgeDesk)
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $appRoot '.local'
$port = if ($KnowledgeDesk) { 43129 } else { 43128 }
$baseUrl = "http://127.0.0.1:$port"
$openUrl = if ($KnowledgeDesk) { "$baseUrl/staff/" } else { "$baseUrl/" }
$serviceName = if ($KnowledgeDesk) { 'momentum-knowledge-desk' } else { 'momentum-next-generation' }
$serverScript = if ($KnowledgeDesk) { 'server/desk-main.mjs' } else { 'server/main.mjs' }
$ownerFile = if ($KnowledgeDesk) { 'knowledge-owner.json' } else { 'owner.json' }
$logName = if ($KnowledgeDesk) { 'knowledge' } else { 'server' }
try {
  $nodeCommand = Get-Command node -ErrorAction Stop
  $nodeVersion = & $nodeCommand.Source --version
  $major = $nodeVersion.TrimStart('v').Split('.')[0]
  if ($major -ne '24') { throw 'Install Node.js 24 LTS from https://nodejs.org/ then run this launcher again.' }
  $current = $null
  try { $current = Invoke-RestMethod "$baseUrl/healthz" -TimeoutSec 2 } catch {}
  if ($current -and $current.service -eq $serviceName -and (Test-Path (Join-Path $runtimeDir $ownerFile))) {
    $owner = Get-Content (Join-Path $runtimeDir $ownerFile) -Raw | ConvertFrom-Json
    $ownedProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($owner.pid)" -ErrorAction SilentlyContinue
    if (-not $ownedProcess -or $ownedProcess.CommandLine -notlike "*$serverScript*") { throw "Port $port is active but this launcher cannot verify ownership. Close its terminal first." }
    Invoke-RestMethod "$baseUrl/__owner" -Headers @{Authorization="Bearer $($owner.token)"} -TimeoutSec 2 | Out-Null
    Write-Host "Already running: $openUrl"
    if (-not $NoBrowser) { Start-Process $openUrl }
    exit 0
  }
  if ($current) { throw "Port $port is occupied. Stop that service before starting this app." }
  if ($KnowledgeDesk -and -not (Test-Path (Join-Path $appRoot 'node_modules/@electric-sql/pglite/package.json'))) {
    Write-Host 'First setup: installing the pinned knowledge database dependency. Internet is required once.'
    Push-Location $appRoot
    try { & npm.cmd ci --omit=dev --ignore-scripts --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed. Check internet access and try again.' } }
    finally { Pop-Location }
  }
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
  $tokenBytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($tokenBytes); $rng.Dispose()
  $token = -join ($tokenBytes | ForEach-Object { $_.ToString('x2') })
  $env:NEXTGEN_MANAGEMENT_TOKEN = $token
  $previousPort = $env:PORT
  $env:PORT = "$port"
  # All files stay within this app. The child inherits only a random shutdown token.
  $child = Start-Process -FilePath $nodeCommand.Source -ArgumentList '--env-file-if-exists=.env',$serverScript -WorkingDirectory $appRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir "$logName.log") -RedirectStandardError (Join-Path $runtimeDir "$logName-error.log")
  Remove-Item Env:NEXTGEN_MANAGEMENT_TOKEN
  if ($null -eq $previousPort) { Remove-Item Env:PORT } else { $env:PORT = $previousPort }
  @{pid=$child.Id;token=$token} | ConvertTo-Json | Set-Content (Join-Path $runtimeDir $ownerFile) -Encoding UTF8
  $ready = $false
  for ($attempt = 0; $attempt -lt 100; $attempt++) {
    Start-Sleep -Milliseconds 200
    if ($child.HasExited) { break }
    try { $health = Invoke-RestMethod "$baseUrl/healthz" -TimeoutSec 1; if ($health.service -eq $serviceName) { $ready = $true; break } } catch {}
  }
  if (-not $ready) { throw "Could not start. Check next-generation\.local\$logName-error.log and port $port." }
  Write-Host "Ready: $openUrl"
  Write-Host $(if ($KnowledgeDesk) { 'Use Stop-Knowledge-Desk.cmd when finished. Staff setup: Setup-Knowledge-Staff.cmd.' } else { 'Use Stop-Next-Generation.cmd when finished. No AI credentials are needed for local guided mode.' })
  if (-not $NoBrowser) { Start-Process $openUrl }
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
