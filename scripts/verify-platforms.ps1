# KinetixFitt multiplatform verification
# Run from repository root: npm -w apps/mobile run verify
param([ValidateSet("all","windows","macos","android","ios")][string]$Platform = "all")
$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
$mobile = Join-Path $root "apps/mobile"
$desktop = Join-Path $root "apps/desktop"
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
Exists (Join-Path $mobile "native-shell/index.html") "Minimal native shell"
Exists (Join-Path $mobile "public/manifest.json") "PWA manifest"
Exists (Join-Path $mobile "public/sw.js") "Service worker"
Exists (Join-Path $mobile "public/icons/icon-192.png") "PWA icon 192"
Exists (Join-Path $mobile "public/icons/icon-512.png") "PWA icon 512"
Exists (Join-Path $mobile "electron/main.js") "Electron fallback main process"
Exists (Join-Path $mobile "electron/builder.json") "Electron fallback builder config"
Exists (Join-Path $desktop "package.json") "Tauri desktop package"
Exists (Join-Path $desktop "src-tauri/tauri.conf.json") "Tauri config"
Exists (Join-Path $desktop "src-tauri/Cargo.toml") "Tauri Cargo manifest"
Exists (Join-Path $desktop "src-tauri/src/main.rs") "Tauri Rust entrypoint"

$pkg = Get-Content (Join-Path $mobile "package.json") -Raw | ConvertFrom-Json
$rootPkg = Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$electronVersion = if ($pkg.devDependencies.electron) { $pkg.devDependencies.electron } else { $pkg.dependencies.electron }
if ($electronVersion) { Ok "Electron fallback dependency declared" } else { Fail "Electron fallback dependency missing" }
if ($pkg.dependencies.'@capacitor/core' -or $pkg.devDependencies.'@capacitor/core') { Ok "Capacitor core dependency declared" } else { Fail "Capacitor core dependency missing" }
if ($pkg.dependencies.'@capacitor/android' -or $pkg.devDependencies.'@capacitor/android') { Ok "Capacitor Android dependency declared" } else { Fail "Capacitor Android dependency missing" }

$desktopPkg = Get-Content (Join-Path $desktop "package.json") -Raw | ConvertFrom-Json
if ($desktopPkg.scripts.dev) { Ok "Tauri desktop dev script" } else { Fail "Tauri desktop dev script missing" }
if ($desktopPkg.scripts.'build:win') { Ok "Tauri Windows build script" } else { Fail "Tauri Windows build script missing" }
if ($desktopPkg.scripts.'build:mac') { Ok "Tauri macOS build script" } else { Fail "Tauri macOS build script missing" }
if ($rootPkg.scripts.'desktop:build:win' -like '*apps/desktop*') { Ok "Root Windows build targets Tauri" } else { Fail "Root Windows build does not target Tauri" }
if ($rootPkg.scripts.'desktop:build:mac' -like '*apps/desktop*') { Ok "Root macOS build targets Tauri" } else { Fail "Root macOS build does not target Tauri" }

if ($Platform -in @("all","windows","macos")) {
  $tauriConfigPath = Join-Path $desktop "src-tauri/tauri.conf.json"
  if (Test-Path $tauriConfigPath) {
    $tauriConfig = Get-Content $tauriConfigPath -Raw | ConvertFrom-Json
    if ($tauriConfig.build.frontendDist -eq "https://app.kinetixfitt.com") { Ok "Production desktop uses remote HTTPS frontend" } else { Fail "Production desktop frontend URL is not the expected HTTPS deployment" }
    if ($tauriConfig.bundle.targets -contains "nsis") { Ok "Tauri Windows NSIS target" } else { Fail "Tauri Windows NSIS target missing" }
    if ($tauriConfig.bundle.targets -contains "dmg") { Ok "Tauri macOS DMG target" } else { Fail "Tauri macOS DMG target missing" }
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

# Ensure native packaging cannot accidentally grow by pointing Capacitor back at the
# full public asset tree. The public tree remains the web/PWA asset source.
$configText = Get-Content (Join-Path $mobile "capacitor.config.ts") -Raw
if ($configText -match 'webDir:\s*"native-shell"') { Ok "Capacitor webDir is the lightweight native shell" } else { Fail "Capacitor webDir does not use native-shell" }
if ($configText -notmatch 'cleartext:\s*true') { Ok "Native transport does not allow cleartext" } else { Fail "Native transport allows cleartext" }

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
if (Get-Command rustc -ErrorAction SilentlyContinue) { Ok "Rust compiler available" } else { Warn "Rust compiler unavailable — required for Tauri desktop builds" }
if (Test-Path (Join-Path $root "node_modules")) { Ok "Root node_modules present" } else { Warn "Root node_modules missing — run npm ci" }

Write-Host "`n--- SUMMARY ---" -ForegroundColor Cyan
Write-Host "Success: $($script:success.Count)" -ForegroundColor Green
Write-Host "Warnings: $($script:warnings.Count)" -ForegroundColor Yellow
Write-Host "Errors: $($script:errors.Count)" -ForegroundColor Red

if ($script:errors.Count -gt 0) { exit 2 }
exit 0
