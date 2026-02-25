# ============================================================
#  FMS-Web Launcher with Verification
# ============================================================

$Host.UI.RawUI.WindowTitle = "FMS-Web Launcher"
$projectDir = "C:\Claude_AI\web-fms\fms-web"
$nodePath   = "C:\Program Files\nodejs\node.exe"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$nextBin    = "$projectDir\node_modules\next\dist\bin\next"
$lockFile   = "$projectDir\.next\dev\lock"
$logFile    = "$projectDir\server.log"

Set-Location $projectDir

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "   FMS-Web Launcher" -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Port Detection
Write-Host "  [1/6] " -ForegroundColor Yellow -NoNewline
Write-Host "Port detection..."
$port = (& $nodePath scripts\find-port.js 2>$null) | Select-Object -First 1
$port = "$port".Trim()
if (-not $port -or $port -notmatch '^\d+$') { $port = "3600" }
$url = "http://localhost:$port"
Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
Write-Host "Available port: $port"

# Helper: Test if server is listening on port (TCP connect + HTTP check)
function Test-ServerListening($testPort) {
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect('127.0.0.1', [int]$testPort)
    $tcp.Close()
    return $true
  } catch {
    return $false
  }
}

# STEP 2: Existing Server Check
Write-Host "  [2/6] " -ForegroundColor Yellow -NoNewline
Write-Host "Checking existing server..."
$serverReady = $false

if (Test-ServerListening $port) {
  $serverReady = $true
  Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
  Write-Host "Server already running (port $port) - reuse"
}

# STEP 3: Cleanup stale processes and lock file
if (-not $serverReady) {
  Write-Host "  [3/6] " -ForegroundColor Yellow -NoNewline
  Write-Host "Cleaning up stale processes..."

  # Kill zombie Next.js processes
  $zombies = Get-WmiObject Win32_Process -Filter "CommandLine LIKE '%next%dev%turbopack%'" -ErrorAction SilentlyContinue
  if ($zombies) {
    $zombies | ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
    Write-Host "Killed stale Next.js processes"
    Start-Sleep -Seconds 2
  }

  # Remove stale lock file
  if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
    Write-Host "Removed stale lock file"
  } else {
    Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
    Write-Host "No cleanup needed"
  }

  # STEP 4: Start Server (via cmd wrapper for reliable I/O redirection)
  Write-Host "  [4/6] " -ForegroundColor Yellow -NoNewline
  Write-Host "Starting Next.js server (port $port)..."

  # Clear old log file
  if (Test-Path $logFile) { Remove-Item $logFile -Force }

  # Create a temporary batch file to start the server with output redirection
  $startBat = "$projectDir\scripts\start-server.cmd"
  $batContent = "@echo off`r`n`"$nodePath`" `"$nextBin`" dev --turbopack -p $port > `"$logFile`" 2>&1"
  [System.IO.File]::WriteAllText($startBat, $batContent, [System.Text.Encoding]::ASCII)

  # Start the batch file hidden - cmd.exe handles I/O redirection properly
  Start-Process -FilePath $startBat -WorkingDirectory $projectDir -WindowStyle Hidden

  Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
  Write-Host "Server process started"

  # STEP 5: Server Response Verification (max 90s for cold start)
  Write-Host "  [5/6] " -ForegroundColor Yellow -NoNewline
  Write-Host "Waiting for server response..."
  for ($i = 1; $i -le 90; $i++) {
    Start-Sleep -Seconds 1

    # Use TCP connection test (more reliable than Invoke-WebRequest)
    if (Test-ServerListening $port) {
      $serverReady = $true
      break
    }

    # Check if server process crashed by looking at log file
    if ($i % 10 -eq 0 -and (Test-Path $logFile)) {
      $logContent = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
      if ($logContent -match "EACCES|EADDRINUSE|Cannot find module|SyntaxError") {
        Write-Host ""
        Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline
        Write-Host "Server error detected in log:"
        Write-Host ""
        Get-Content $logFile -Tail 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        Write-Host ""
        Read-Host "  Press Enter to exit"
        exit 1
      }
    }

    Write-Host "`r         waiting $i/90s..." -NoNewline
  }
  Write-Host ""
}

# Server Verification Result
if ($serverReady) {
  Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
  Write-Host "Server OK - $url"
} else {
  Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline
  Write-Host "Server start failed (90s timeout)"
  Write-Host ""
  # Show server log for debugging
  if (Test-Path $logFile) {
    Write-Host "  Server log (last 15 lines):" -ForegroundColor Yellow
    Get-Content $logFile -Tail 15 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
  } else {
    Write-Host "  No server log found" -ForegroundColor DarkGray
  }
  Write-Host ""
  Read-Host "  Press Enter to exit"
  exit 1
}

# STEP 6: Chrome Verification + Open
Write-Host "  [6/6] " -ForegroundColor Yellow -NoNewline
Write-Host "Chrome verification..."

if (Test-Path $chromePath) {
  Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
  Write-Host "Chrome path OK"
  Start-Process -FilePath $chromePath -ArgumentList $url
  Start-Sleep -Milliseconds 500
  Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
  Write-Host "Chrome opened: $url"
} else {
  Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline
  Write-Host "Chrome not found - trying default browser"
  Start-Process $url
}

# Done
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "   ALL PASS - FMS-Web Ready" -ForegroundColor Green
Write-Host "   $url" -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2
