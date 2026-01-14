# New Developer Onboarding - Quick Reference

## What New Developers Need to Do

When someone clones this repository, they need to:

### 1️⃣ Get a Personal GitHub Token
- Go to https://github.com/settings/tokens
- Generate new token (classic)
- Select `read:packages` scope
- Copy the token (starts with `ghp_`)

### 2️⃣ Set Up Environment
```powershell
# Copy the example file
copy .env.example .env

# Edit .env and replace:
# NPM_TOKEN="your_github_token_here"
# with your actual token:
# NPM_TOKEN="ghp_xxxxxxxxxxxxx"
```

### 3️⃣ Install Dependencies
```powershell
# Easiest way (Windows)
.\install.ps1

# This script will:
# ✓ Check if .env exists
# ✓ Load NPM_TOKEN from .env
# ✓ Install pnpm if needed
# ✓ Run pnpm install with the token
```

### 4️⃣ Start Development
```powershell
pnpm dev
```

## For Deployment (Vercel)

When deploying to Vercel:
1. Go to Project Settings → Environment Variables
2. Add: `NPM_TOKEN` = `[your_github_token]`
3. Vercel will use this automatically during build ✅

## Files Created for Onboarding

- **`SETUP.md`** - Comprehensive setup guide
- **`.env.example`** - Template with instructions
- **`install.ps1`** - Automated setup script (Windows)
- **`README.md`** - Updated with setup reference

## Why This Approach?

✅ **Secure**: Tokens are in `.env` (gitignored)  
✅ **Simple**: One script to setup everything  
✅ **Documented**: Clear instructions in multiple places  
✅ **Vercel-Ready**: Works seamlessly on Vercel with env vars  

## Common Issues

**"ERR_PNPM_FETCH_401"**
- Token not loaded → Run `.\install.ps1`
- Token expired → Generate new one
- Wrong scope → Regenerate with `read:packages`

**"NPM_TOKEN not found"**
- Didn't copy .env.example → Run `copy .env.example .env`
- Didn't edit .env → Add your actual token

## Security Note
⚠️ The `.env` file is **gitignored** - tokens never get committed to the repository.
