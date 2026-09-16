# KinetixFitt multiplatform verification
# Run from repository root: npm -w apps/mobile run verify
param([ValidateSet("all","windows","macos","android","ios")][string]$Platform = "all")
$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
$mobile = Join-Path $root "apps/mobile"
$script:errors = @()
$script:warnings = @()
$script:success = @()

function Ok($m) { $script:success += $m; Write-Host "[OK] $m" -ForegroundColor Green }
function Warn($m) { $script:warnings += $m; Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Fail($m) { $script:errors += $m; Write-Host "[FAIL] $m" -ForegroundColor Red }
function Exists($p,$label) { if (Test-Path $p) { Ok $label; return $true } Fail "$label — falta $p"; return $false }

Write-Host "`n=== KINETIXFITT MULTIPLATFORM ===`nPlatform: $Platform`n" -ForegroundColor Cyan

# Shared application/native configuration
Exists (Join-Path $mobile "capacitor.config.ts") "Capacitor config"
Exists (Join-Path $mobile "public/manifest.json") "PWA manifest"
Exists (Join-Path $mobile "public/sw.js") "Service worker"
Exists (Join-Path $mobile "public/icons/icon-192.png") "PWA icon 192"
Exists (Join-Path $mobile "public/icons/icon-512.png") "PWA icon 512"
Exists (Join-Path $mobile "electron/main.js") "Electron main process"
Exists (Join-Path $mobile "electron/builder.json") "Electron builder config"

$pkg = Get-Content (Join-Path $mobile "package.json") -Raw | ConvertFrom-Json
$electronVersion = if ($pkg.devDependencies.electron) { $pkg.devDependencies.electron } else { $pkg.dependencies.electron }
if ($electronVersion) { Ok "Electron dependency declared" } else { Fail "Electron dependency missing" }
if ($pkg.dependencies.'@capacitor/core' -or $pkg.devDependencies.'@capacitor/core') { Ok "Capacitor core dependency declared" } else { Fail "Capacitor core dependency missing" }
if ($pkg.dependencies.'@capacitor/android' -or $pkg.devDependencies.'@capacitor/android') { Ok "Capacitor Android dependency declared" } else { Fail "Capacitor Android dependency missing" }

if ($Platform -in @("all","windows","macos")) {
  if ($pkg.scripts.'desktop:build:win') { Ok "Windows desktop build script" } else { Fail "Windows desktop build script missing" }
  if ($pkg.scripts.'desktop:build:mac') { Ok "macOS desktop build script" } else { Fail "macOS desktop build script missing" }
  $builderPath = Join-Path $mobile "electron/builder.json"
  if (Test-Path $builderPath) {
    $builder = Get-Content $builderPath -Raw | ConvertFrom-Json
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
    if (Test-Path (Join-Path $mobile "ios")) { Ok "iOS project present" } else { Warn "iOS project generated in macOS CI/local rather than committed" }
  }
}

# Static manifest integrity checks for referenced local assets.
$manifestPath = Join-Path $mobile "public/manifest.json"
if (Test-Path $manifestPath) {
  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
  foreach ($icon in @($manifest.icons)) {
    if ($icon.src -and $icon.src.StartsWith("/")) {
      $asset = Join-Path $mobile ("public" + $icon.src.Replace("/", "\\"))
      Exists $asset ("Manifest asset " + $icon.src)
    }
  }
}

# Local runtime prerequisites only; CI performs actual platform builds.
if (Get-Command node -ErrorAction SilentlyContinue) { Ok "Node.js available" } else { Fail "Node.js unavailable" }
if (Test-Path (Join-Path $root "node_modules")) { Ok "Root node_modules present" } else { Warn "Root node_modules missing — run npm ci" }

Write-Host "`n--- SUMMARY ---" -ForegroundColor Cyan
Write-Host "Success: $($script:success.Count)" -ForegroundColor Green
Write-Host "Warnings: $($script:warnings.Count)" -ForegroundColor Yellow
Write-Host "Errors: $($script:errors.Count)" -ForegroundColor Red

if ($script:errors.Count -gt 0) { exit 2 }
exit 0
