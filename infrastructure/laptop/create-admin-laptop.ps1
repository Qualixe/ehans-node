<#
  Creates (or resets) the store owner account for https://ehans.qualixe.com/admin on the laptop.

    .\infrastructure\laptop\create-admin-laptop.ps1 -Email you@example.com -Name "Your name"

  The owner's password is asked for in this terminal by the server (it is not stored in any file
  or in your PowerShell history). At least 10 characters. Running it again resets the password
  and signs that account out everywhere.
#>
param(
  [Parameter(Mandatory = $true)][string]$Email,
  [string]$Name = "Store owner",
  [string]$Server = "qualixe@192.168.0.230"
)
$ErrorActionPreference = "Stop"
if ($Email -notmatch '^[^\s@"]+@[^\s@"]+\.[^\s@"]+$') { throw "That email address doesn't look right." }
$safeName = $Name -replace '[^\p{L}\p{N} .''-]', ''

$compose = "docker compose -f docker-compose.yml -f infrastructure/laptop/compose.laptop.yaml"
ssh -t $Server "cd ~/ehans && $compose run --rm -it --no-deps -e ADMIN_EMAIL='$Email' -e ADMIN_NAME='$safeName' backend node dist/database/create-admin.js"
if ($LASTEXITCODE -ne 0) { throw "Creating the owner failed (see the output above)." }
Write-Host "==> Sign in at https://ehans.qualixe.com/admin"
