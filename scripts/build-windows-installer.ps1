$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend"
$output = Join-Path $root "installer-output"
$inputDir = Join-Path $root "installer-input"

Write-Host "Building PharmaSathi frontend..."
Push-Location $frontend
npm ci
npm run build
Pop-Location

Write-Host "Building embedded backend..."
Push-Location $backend
.\mvnw.cmd clean package -DskipTests
Pop-Location

Remove-Item $inputDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $output -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $inputDir | Out-Null
New-Item -ItemType Directory -Path $output | Out-Null

$jar = Join-Path $backend "target\backend-0.0.1-SNAPSHOT.jar"
Copy-Item $jar (Join-Path $inputDir "pharmasathi.jar")

Write-Host "Creating Windows installer with bundled Java runtime..."
jpackage `
  --type exe `
  --name PharmaSathi `
  --app-version 1.0.0 `
  --vendor "PharmaSathi" `
  --description "Offline pharmacy billing and inventory software" `
  --input $inputDir `
  --main-jar pharmasathi.jar `
  --dest $output `
  --win-menu `
  --win-shortcut `
  --win-dir-chooser `
  --java-options "-Dpharmasathi.open-browser=true"

Write-Host "Installer created in $output"
