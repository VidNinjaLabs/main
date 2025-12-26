# User Migration Guide

## Overview
This application has migrated from custom Prisma-based authentication to Supabase Auth.

## For Existing Users

### Option 1: Re-register (Recommended)
The simplest approach is to have existing users create new accounts:

1. Visit `/signup`
2. Create account with the same email
3. Verify email from Supabase
4. Login with new credentials

###Option 2: Password Reset
If you want to keep existing accounts, you'll need to:

1. Ensure your Supabase Auth table is properly configured
2. Manually migrate user emails to Supabase Auth
3. Users will need to use "Forgot Password" to set new passwords

## For Developers

### Supabase Dashboard Setup Required

1. **Enable Email Auth**
   - Go to: Authentication → Providers
   - Ensure "Email" is enabled
   - Configure email templates

2. **Set Redirect URLs**
   - Go to: Authentication → URL Configuration
   - Add your app domain to allowed redirect URLs:
     - `http://localhost:5173/**` (development)
     - `https://yourdomain.com/**` (production)

3. **Email Templates** (Optional)
   - Go to: Authentication → Email Templates
   - Customize "Confirm signup" and "Reset password" emails

### Environment Variables

Ensure `.env` contains:
```env
VITE_SUPABASE_URL="https://xxxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
TURNSTILE_SITE_KEY="your-turnstile-site-key"
```

### No Migration Script Needed

Supabase Auth manages its own `auth.users` table. Existing user data in your old `users` table is **not automatically migrated**. Users must re-register or follow password reset flow.

## Testing Checklist

- [ ] Signup creates user in Supabase Auth `auth.users`
- [ ] Email verification email is sent
- [ ] User can verify email and login
- [ ] Password reset sends email
- [ ] Password can be updated via reset link
- [ ] Sessions persist across page refreshes
- [ ] Logout clears session

## Benefits

✅ No IPv4 dedicated connection needed (saves $4/month)
✅ No custom Express server to maintain
✅ Built-in email verification
✅ Built-in password reset
✅ Automatic session refresh tokens
✅ Row-Level Security (RLS) for data protection
