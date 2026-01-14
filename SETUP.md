# CloudClash Setup Guide

## Prerequisites

- Node.js 18+ and npm
- pnpm (`npm install -g pnpm`)
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cloudclash
```

### 2. Set Up Environment Variables

**Copy the example file:**
```bash
copy .env.example .env
```

### 3. Get Your GitHub Personal Access Token

This project uses private packages from GitHub Packages (`@rev9dev-netizen/vidply.js`). You need a GitHub token to install them.

**Steps to create token:**

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `CloudClash Dev Access`
4. Select the following scopes:
   - ✅ `read:packages` (required)
   - ✅ `write:packages` (optional, only if publishing)
5. Click **"Generate token"**
6. **Copy the token** (starts with `ghp_...`) - you won't see it again!

**Add token to `.env`:**

Open `.env` and replace `your_github_token_here` with your actual token:

```bash
NPM_TOKEN="ghp_your_actual_token_here"
```

### 4. Install Dependencies

**Option A: Windows (Recommended)**
```powershell
.\install.ps1
```

**Option B: Manual**
```powershell
# Set the token environment variable
$env:NPM_TOKEN = (Get-Content .env | Where-Object { $_ -match '^NPM_TOKEN=' } | ForEach-Object { $_ -replace '^NPM_TOKEN=', '' -replace '"', '' })

# Install packages
pnpm install
```

**Option C: Permanent Fix (Set System Environment Variable)**
```powershell
# Run PowerShell as Administrator
[System.Environment]::SetEnvironmentVariable('NPM_TOKEN', 'your_token_here', 'User')

# Restart your terminal, then simply run:
pnpm install
```

### 5. Run Development Server

```bash
pnpm dev
```

## Deployment (Vercel)

When deploying to Vercel, add the `NPM_TOKEN` environment variable:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add variable:
   - Name: `NPM_TOKEN`
   - Value: `ghp_your_token_here`
3. Apply to: **All environments** (or as needed)

Vercel will automatically use this token during the build process.

## Troubleshooting

### `ERR_PNPM_FETCH_401: Unauthorized`

**Problem:** pnpm can't authenticate with GitHub Packages.

**Solution:**
1. Verify your token is in `.env`
2. Ensure the token has `read:packages` scope
3. Run `.\install.ps1` instead of plain `pnpm install`
4. Or set the environment variable permanently (see Option C above)

### `NPM_TOKEN not found in .env`

**Problem:** The `.env` file doesn't have the token set.

**Solution:** Follow Step 3 above to get and add your GitHub token.

### Token Expired

GitHub tokens can expire. If you get authentication errors:
1. Generate a new token (follow Step 3)
2. Update the `NPM_TOKEN` in your `.env` file
3. Update the environment variable on Vercel

## Security Notes

⚠️ **Never commit your `.env` file to git!**

The `.gitignore` file already excludes `.env`, but always double-check before committing.

## Need Help?

Contact the project maintainers or create an issue in the repository.
