# Admin Account Setup Guide

## ✅ Recommended: SQL Editor Method (Works!)

This is the **fastest and most reliable** method since Supabase has restricted manual user metadata editing.

### Step 1: Sign Up via App

First, create the account through your app's signup page:
1. Go to `http://localhost:5173/signup`
2. Email: `admin@cloudclash.local`
3. Password: `Q6bPdw?*%6RBHA_NXK-WuBx*P7#XJTj+THCDQpDMsgAdeB_`
4. Complete signup and verify email (if required)

### Step 2: Promote to Admin via SQL

1. **Open Supabase Dashboard** → SQL Editor
2. **Run this SQL query:**

```sql
-- Promote user to admin with premium access
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"ADMIN"'
  ),
  '{is_premium}',
  'true'
)
WHERE email = 'admin@cloudclash.local';
```

3. **Verify the update:**

```sql
-- Check admin user
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'is_premium' as is_premium,
  email_confirmed_at is not null as email_verified
FROM auth.users
WHERE email = 'admin@cloudclash.local';
```

### Step 3: Login

- Go to `/login`
- Use `admin@cloudclash.local` + password
- ✅ You now have full admin access!

---

## Alternative: Programmatic Seeding (Advanced)

If you need to automate admin creation across environments:

### Prerequisites
1. Get your **Service Role Key** from Supabase Dashboard → Settings → API
2. Add to `.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

### Run Seed Script
```bash
pnpm seed:admin
```

This script:
- Creates admin user if doesn't exist
- Sets role to ADMIN and premium to true
- Auto-confirms email

---

## Admin User Permissions

Once logged in as admin, you will have:

✅ **Full Access to Settings** (`/settings`)  
✅ **Admin Dashboard** (`/admin`)  
✅ **Premium Features** (no ads, exclusive content)  
✅ **Developer Tools** (`/dev`)  
✅ **All Application Features** unlocked

---

## Default Admin Credentials (Development)

For **local development only**:
```
Email: admin@cloudclash.local
Password: [Set via Supabase Dashboard]
```

> [!CAUTION]
> **Production Security**
> - Change default email in production
> - Use strong, unique password
> - Enable 2FA for admin accounts (Supabase supports this)
> - Never commit credentials to version control

---

## Promoting Existing Users to Admin

If someone already has an account and needs admin:

### Via Dashboard:
1. Authentication → Users
2. Find the user by email
3. Click on user → User Metadata → Edit
4. Add/Update:
   ```json
   {
     "role": "ADMIN",
     "is_premium": true
   }
   ```

### Via SQL:
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"ADMIN"'
  ),
  '{is_premium}',
  'true'
)
WHERE email = 'user@example.com';  -- Replace with actual email
```

---

## Role-Based Access Control

The app automatically reads roles from Supabase `user_metadata`:

```typescript
// Automatically available via AuthContext
const { isAdmin, isPremium } = useAuthContext();

if (isAdmin) {
  // Show admin-only features
}
```

### Role Values:
- `USER` - Default role (limited features)
- `ADMIN` - Full access to everything

### Premium Flag:
- `false` - Shows ads, limited features
- `true` - No ads, all premium features

---

## Troubleshooting

**Q: User can't access admin features after updating metadata**  
A: Have the user logout and login again. Supabase caches user metadata in the session.

**Q: How to reset admin password?**  
A: Use Supabase Dashboard → Authentication → Users → Find user → Send password reset email

**Q: Can I have multiple admins?**  
A: Yes! Just set `role: "ADMIN"` for any user following the steps above.

---

## Security Best Practices

1. ✅ **Use strong passwords** for admin accounts
2. ✅ **Enable email verification** (already configured in Supabase)
3. ✅ **Rotate admin passwords** regularly
4. ✅ **Monitor admin activity** via Supabase logs
5. ✅ **Use Row-Level Security (RLS)** policies in Supabase for data protection

---

## Next Steps

1. Create your admin user in Supabase Dashboard
2. Login at `/login`
3. Navigate to `/admin` to verify access
4. Check that no ads appear (premium status active)
5. Access `/settings` without restrictions
