# KinetixFitt multiplatform verification
# Run from repository root: npm -w apps/mobile run verify
param([ValidateSet("all","windows","macos","android","ios")][string]$Platform = "all")
$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
$mobile = Join-Path $root "apps/mobile"
$errors = @()
$warnings = @()
$success = @()

function Ok($m) { $success += $m; Write-Host "[OK] $m" -ForegroundColor Green }
function Warn($m) { $warnings += $m; Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Fail($m) { $errors += $m; Write-Host "[FAIL] $m" -ForegroundColor Red }
function Exists($p,$label) { if (Test-Path $p) { Ok $label; return $true } Fail "$label — falta $p"; return $false }

Write-Host "`n=== KINETIXFITT MULTIPLATFORM ===`nPlatform: $Platform`n" -ForegroundColor Cyan

# Shared web/PWA baseline
Exists (Join-Path $mobile "capacitor.config.ts") "Capacitor config"
Exists (Join-Path $mobile "public/manifest.json") "PWA manifest"
Exists (Join-Path $mobile "public/sw.js") "Service worker"
Exists (Join-Path $mobile "public/icons/icon-192.png") "PWA icon 192"
Exists (Join-Path $mobile "public/icons/icon-512.png") "PWA icon 512"
Exists (Join-Path $mobile "electron/main.js") "Electron main process"
Exists (Join-Path $mobile "electron/builder.json") "Electron builder config"

$pkg = Get-Content (Join-Path $mobile "package.json") -Raw | ConvertFrom-Json
if ($pkg.dependencies.electron) { Ok "Electron dependency declared" } else { Fail "Electron dependency missing" }
if ($pkg.dependencies.'@capacitor/core') { Ok "Capacitor dependency declared" } else { Fail "Capacitor dependency missing" }
if ($pkg.dependencies.'@capacitor/android') { Ok "Capacitor Android dependency declared" } else { Fail "Capacitor Android dependency missing" }

if ($Platform -in @("all","windows","macos")) {
  if ($pkg.scripts.'desktop:build:win') { Ok "Windows desktop build script" } else { Fail "Windows desktop build script missing" }
  if ($pkg.scripts.'desktop:build:mac') { Ok "macOS desktop build script" } else { Fail "macOS desktop build script missing" }
  if ((Test-Path (Join-Path $mobile "electron/builder.json"))) {
    $builder = Get-Content (Join-Path $mobile "electron/builder.json") -Raw | ConvertFrom-Json
    if ($builder.win.target -contains "nsis") { Ok "Windows NSIS target" } else { Fail "Windows NSIS target missing" }
    if ($builder.mac.target -contains "dmg") { Ok "macOS DMG target" } else { Fail "macOS DMG target missing" }
  }
}

if ($Platform -in @("all","android","ios")) {
  if ($pkg.scripts.'native:add:android') { Ok "Android native generation script" } else { Fail "Android native generation script missing" }
  if ($pkg.scripts.'native:add:ios') { Ok "iOS native generation script" } else { Fail "iOS native generation script missing" }
  if ($Platform -eq "android" -and (Test-Path (Join-Path $mobile "android"))) { Ok "Committed Android project" }
  elseif ($Platform -eq "android") { Warn "Android project is generated reproducibly in CI/local; it is not committed in the repository" }
  if ($Platform -eq "ios" -and (Test-Path (Join-Path $mobile "ios"))) { Ok "Committed iOS project" }
  elseif ($Platform -eq "ios") { Warn "iOS project is generated reproducibly on macOS CI/local; it is not committed in the repository" }
  if ($Platform -eq "all") {
    if (Test-Path (Join-Path $mobile "android")) { Ok "Android project present" } else { Warn "Android project generated in CI/local rather than committed" }
    if (Test-Path (Join-Path $mobile "ios")) { Ok "iOS project present" } else { Warn "iOS project generated on macOS CI/local rather than committed" }
  }
}

# Shared script/runtime verification from the correct repository paths.
if (Get-Command node -ErrorAction SilentlyContinue) { Ok "Node.js available" } else { Fail "Node.js unavailable" }
if (Test-Path (Join-Path $root "node_modules")) { Ok "Root node_modules present" } else { Warn "Root node_modules missing — run npm ci" }

Write-Host "`n--- SUMMARY ---" -ForegroundColor Cyan
Write-Host "Success: $($success.Count)" -ForegroundColor Green
Write-Host "Warnings: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "Errors: $($errors.Count)" -ForegroundColor Red

if ($errors.Count -gt 0) { exit 2 }
if ($warnings.Count -gt 0) { exit 0 }
exit 0
