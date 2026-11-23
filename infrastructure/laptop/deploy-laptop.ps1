<#
  Deploys ehans to the Ubuntu laptop (the same server as eDealer, clothy and glowy),
  live at https://ehans.qualixe.com through the Cloudflare tunnel.

    .\infrastructure\laptop\deploy-laptop.ps1

  What it does:
    1. Builds nothing here: packs the working tree (without node_modules, .git, build output,
       .env files or the design template).
    2. Copies it to the laptop over SSH.
    3. On the laptop (infrastructure/laptop/remote-deploy.sh): backs up the database, swaps in the new
       code, builds the images, migrates, loads the demo catalog on the first install only, restarts
       and checks health on 127.0.0.1:8086. The previous version is kept in ~/ehans-prev.
       The first deploy writes the laptop's .env itself (random database password); later deploys keep it.

  You are asked for the laptop password twice (copy + deploy) unless you set up an SSH key.
#>
param(
  [string]$Server = "qualixe@192.168.0.230"
)
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$work = Join-Path $env:TEMP "ehans-deploy"
# GNU tar from Git for Windows: Windows' own tar.exe crashes on the Bangla (UTF-8) image file names.
$tar = @(
  (Join-Path $env:ProgramFiles "Git\usr\bin\tar.exe"),
  (Join-Path $env:LOCALAPPDATA "Programs\Git\usr\bin\tar.exe")
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $tar) { throw "GNU tar not found: install Git for Windows (it ships usr\bin\tar.exe)." }
# tar runs gzip from the same folder for -z; make it findable from PowerShell
$env:PATH = "$(Split-Path -Parent $tar);$env:PATH"
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory $work | Out-Null

$version = (git -C $root rev-parse --short HEAD 2>$null)
if (-not $version) { $version = "laptop" }
if (git -C $root status --porcelain 2>$null) { $version = "$version-dirty" }

Write-Host "==> Packing $root ($version)"
# Top-level items are picked by name; the excludes below apply at any depth.
$skipTop = @(".git", ".idea", ".vscode", ".claude", ".cursor", "design", "backups", "node_modules", "coverage")
$items = Get-ChildItem -Force $root | Where-Object { $skipTop -notcontains $_.Name } | ForEach-Object { $_.Name }
# Run from the repo root with relative paths, and write the archive there first: GNU tar reads
# "C:\..." as a remote host:path, so it gets no Windows paths at all.
Push-Location $root
try {
  & $tar -czf "ehans-deploy.tgz" `
    --exclude=node_modules --exclude=.next --exclude=dist --exclude=coverage --exclude=*.tsbuildinfo `
    --exclude=apps/backend/src/generated --exclude=ehans-deploy.tgz `
    --exclude=.env --exclude=.env.local --exclude=.env.development.local --exclude=.env.production `
    --exclude=.env.production.local --exclude=.env.test `
    @items
  $packed = $LASTEXITCODE
} finally { Pop-Location }
if ($packed -ne 0) { Remove-Item (Join-Path $root "ehans-deploy.tgz") -ErrorAction SilentlyContinue; throw "Packing failed." }
Move-Item (Join-Path $root "ehans-deploy.tgz") (Join-Path $work "ehans-deploy.tgz")
Get-ChildItem $work | ForEach-Object { Write-Host ("    {0}  {1:N0} KB" -f $_.Name, ($_.Length / 1KB)) }

# Server-side steps, with Unix line endings (bash chokes on CR characters).
$script = Join-Path $work "ehans-remote-deploy.sh"
$text = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "remote-deploy.sh")) -replace "`r", ""
[IO.File]::WriteAllText($script, $text, (New-Object System.Text.UTF8Encoding $false))

Write-Host "==> Copying to $Server"
$files = Get-ChildItem $work | ForEach-Object { $_.FullName }
scp -q @files "${Server}:/tmp/"
if ($LASTEXITCODE -ne 0) { throw "Copy failed." }

Write-Host "==> Deploying on the laptop"
# Docker writes progress to stderr; don't let PowerShell treat that as a failure.
$ErrorActionPreference = "Continue"
ssh $Server "APP_VERSION=$version bash /tmp/ehans-remote-deploy.sh 2>&1; s=`$?; rm -f /tmp/ehans-remote-deploy.sh /tmp/ehans-deploy.tgz; exit `$s"
if ($LASTEXITCODE -ne 0) { throw "Deploy failed (see the output above)." }

Remove-Item $work -Recurse -Force
Write-Host "==> Done: https://ehans.qualixe.com"
