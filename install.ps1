# CloudClash Installation Script
# This script loads NPM_TOKEN from .env and runs pnpm install

Write-Host "`n=== CloudClash Setup ===" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "`nPlease follow these steps:" -ForegroundColor Yellow
    Write-Host "1. Copy .env.example to .env:" -ForegroundColor White
    Write-Host "   copy .env.example .env" -ForegroundColor Gray
    Write-Host "`n2. Get your GitHub Personal Access Token:" -ForegroundColor White
    Write-Host "   https://github.com/settings/tokens" -ForegroundColor Blue
    Write-Host "`n3. Add the token to .env file:" -ForegroundColor White
    Write-Host "   NPM_TOKEN=`"ghp_your_token_here`"" -ForegroundColor Gray
    Write-Host "`nSee SETUP.md for detailed instructions.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "Loading NPM_TOKEN from .env..." -ForegroundColor Cyan

# Read .env and extract NPM_TOKEN
$npmToken = Get-Content .env -ErrorAction SilentlyContinue | 
    Where-Object { $_ -match '^NPM_TOKEN=' } | 
    ForEach-Object { $_ -replace '^NPM_TOKEN=', '' -replace '"', '' }

# Validate token
if (-not $npmToken) {
    Write-Host "ERROR: NPM_TOKEN not found in .env file" -ForegroundColor Red
    Write-Host "`nPlease add your GitHub token to .env:" -ForegroundColor Yellow
    Write-Host "NPM_TOKEN=`"ghp_your_token_here`"`n" -ForegroundColor Gray
    Write-Host "See SETUP.md for instructions on generating a token.`n" -ForegroundColor Yellow
    exit 1
}

if ($npmToken -eq "your_github_token_here") {
    Write-Host "ERROR: Please replace 'your_github_token_here' with your actual GitHub token" -ForegroundColor Red
    Write-Host "`nGet your token at: https://github.com/settings/tokens" -ForegroundColor Yellow
    Write-Host "Then update NPM_TOKEN in .env file`n" -ForegroundColor Yellow
    exit 1
}

# Set environment variable
$env:NPM_TOKEN = $npmToken
Write-Host "✓ NPM_TOKEN loaded successfully" -ForegroundColor Green

# Check if pnpm is installed
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "WARNING: pnpm not found. Installing pnpm globally..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Run pnpm install
Write-Host "`nRunning pnpm install..." -ForegroundColor Cyan
pnpm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Installation complete!" -ForegroundColor Green
    Write-Host "Run 'pnpm dev' to start the development server`n" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Installation failed. Check errors above.`n" -ForegroundColor Red
    exit 1
}
