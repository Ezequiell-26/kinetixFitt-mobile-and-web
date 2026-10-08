# KinetixFitt multiplatform verification
# Run from repository root: npm -w apps/mobile run verify
param([ValidateSet("all","android","ios")][string]$Platform = "all")
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$mobile = Join-Path $root "apps/mobile"
$desktop = Join-Path $root "apps/desktop"
$script:errors = @()
$script:warnings = @()
$script:success = @()

function Ok($m) { $script:success += $m; Write-Host "[OK] $m" -ForegroundColor Green }
function Warn($m) { $script:warnings += $m; Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Fail($m) { $script:errors += $m; Write-Host "[FAIL] $m" -ForegroundColor Red }
function Exists($p,$label) { if (Test-Path $p) { Ok $label; return } Fail "$label - missing $p" }

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

$pkg = Get-Content (Join-Path $mobile "package.json") -Raw | ConvertFrom-Json
if ($pkg.dependencies.'@capacitor/core' -or $pkg.devDependencies.'@capacitor/core') { Ok "Capacitor core dependency declared" } else { Fail "Capacitor core dependency missing" }
if ($pkg.dependencies.'@capacitor/android' -or $pkg.devDependencies.'@capacitor/android') { Ok "Capacitor Android dependency declared" } else { Fail "Capacitor Android dependency missing" }
if ($pkg.scripts.'native:add:android') { Ok "Android native generation script" } else { Fail "Android native generation script missing" }
if ($pkg.scripts.'native:add:ios') { Ok "iOS native generation script" } else { Fail "iOS native generation script missing" }
if ($pkg.scripts.'desktop:dev') { Ok "Desktop shell remains app-owned" } else { Warn "Desktop Electron shell is not exposed through a mobile package script" }

$configText = Get-Content (Join-Path $mobile "capacitor.config.ts") -Raw
if ($configText -match 'webDir:s*"native-shell"') { Ok "Capacitor webDir is the lightweight native shell" } else { Fail "Capacitor webDir does not use native-shell" }
if ($configText -notmatch 'cleartext:s*true') { Ok "Native transport does not allow cleartext" } else { Fail "Native transport allows cleartext" }

$manifestPath = Join-Path $mobile "public/manifest.json"
if (Test-Path $manifestPath) {
  $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
  foreach ($icon in @($manifest.icons)) {
    if ($icon.src -and $icon.src.StartsWith("/")) {
      $asset = Join-Path $mobile ("public" + $icon.src.Replace("/", ""))
      Exists $asset ("Manifest asset " + $icon.src)
    }
  }
}

# Local runtime prerequisites only; CI performs actual platform builds.
if (Get-Command node -ErrorAction SilentlyContinue) { Ok "Node.js available" } else { Fail "Node.js unavailable" }
if (Get-Command rustc -ErrorAction SilentlyContinue) { Ok "Rust compiler available" } else { Warn "Rust compiler unavailable - required for Tauri desktop builds" }
if (Test-Path (Join-Path $root "node_modules")) { Ok "Root node_modules present" } else { Warn "Root node_modules missing - run npm ci" }

Write-Host "`n--- SUMMARY ---" -ForegroundColor Cyan
Write-Host "Success: $($script:success.Count)" -ForegroundColor Green
Write-Host "Warnings: $($script:warnings.Count)" -ForegroundColor Yellow
Write-Host "Errors: $($script:errors.Count)" -ForegroundColor Red

if ($script:errors.Count -gt 0) { exit 2 }
exit 0
