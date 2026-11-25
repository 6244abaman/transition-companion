param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $appRoot '.local'
$baseUrl = 'http://127.0.0.1:43128'
try {
  $nodeCommand = Get-Command node -ErrorAction Stop
  $nodeVersion = & $nodeCommand.Source --version
  $major = $nodeVersion.TrimStart('v').Split('.')[0]
  if ($major -ne '24') { throw 'Install Node.js 24 LTS from https://nodejs.org/ then run this launcher again.' }
  $current = $null
  try { $current = Invoke-RestMethod "$baseUrl/healthz" -TimeoutSec 2 } catch {}
  if ($current -and $current.service -eq 'momentum-next-generation' -and (Test-Path (Join-Path $runtimeDir 'owner.json'))) {
    $owner = Get-Content (Join-Path $runtimeDir 'owner.json') -Raw | ConvertFrom-Json
    $ownedProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$($owner.pid)" -ErrorAction SilentlyContinue
    if (-not $ownedProcess -or $ownedProcess.CommandLine -notlike '*server/main.mjs*') { throw 'Port 43128 is already active but this launcher cannot verify ownership. Close its terminal first.' }
    Invoke-RestMethod "$baseUrl/__owner" -Headers @{Authorization="Bearer $($owner.token)"} -TimeoutSec 2 | Out-Null
    Write-Host "Already running: $baseUrl/"
    if (-not $NoBrowser) { Start-Process "$baseUrl/" }
    exit 0
  }
  if ($current) { throw 'Port 43128 is occupied. Stop that service before starting Next Generation.' }
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
  $tokenBytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($tokenBytes); $rng.Dispose()
  $token = -join ($tokenBytes | ForEach-Object { $_.ToString('x2') })
  $env:NEXTGEN_MANAGEMENT_TOKEN = $token
  $previousPort = $env:PORT
  $env:PORT = '43128'
  # All files stay within this app. The child inherits only a random shutdown token.
  $child = Start-Process -FilePath $nodeCommand.Source -ArgumentList '--env-file-if-exists=.env','server/main.mjs' -WorkingDirectory $appRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'server.log') -RedirectStandardError (Join-Path $runtimeDir 'server-error.log')
  Remove-Item Env:NEXTGEN_MANAGEMENT_TOKEN
  if ($null -eq $previousPort) { Remove-Item Env:PORT } else { $env:PORT = $previousPort }
  @{pid=$child.Id;token=$token} | ConvertTo-Json | Set-Content (Join-Path $runtimeDir 'owner.json') -Encoding UTF8
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 200
    if ($child.HasExited) { break }
    try { $health = Invoke-RestMethod "$baseUrl/healthz" -TimeoutSec 1; if ($health.service -eq 'momentum-next-generation') { $ready = $true; break } } catch {}
  }
  if (-not $ready) { throw 'Next Generation could not start. Check next-generation\.local\server-error.log and whether port 43128 is in use.' }
  Write-Host "Next Generation is ready: $baseUrl/"
  Write-Host 'Use Stop-Next-Generation.cmd when finished. No AI credentials are needed for local guided mode.'
  if (-not $NoBrowser) { Start-Process "$baseUrl/" }
} catch { Write-Host $_.Exception.Message -ForegroundColor Red; exit 1 }
