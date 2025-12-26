# Quick Admin Setup

## TL;DR - 3 Steps to Admin Access

### 1. **Supabase Dashboard → Add User**
   - Authentication → Users → **Add user**
   - Email: `admin@cloudclash.local`
   - Password: `[your-password]`
   - ✅ **Auto Confirm User** (important!)

### 2. **Set Admin Role**
   - Click on the newly created user
   - Scroll to **User Metadata** → Edit
   - Add:
   ```json
   {
     "role": "ADMIN",
     "is_premium": true
   }
   ```
   - Save

### 3. **Login**
   - Go to `/login`
   - Use `admin@cloudclash.local` + your password
   - ✅ You now have full admin access!

---

## What Admin Users Get

✅ **No Ads** (premium status)  
✅ **Settings Access** (`/settings`)  
✅ **Admin Dashboard** (`/admin`)  
✅ **Developer Tools** (`/dev`)  
✅ **All Features** unlocked

---

## Quick SQL Method (Alternative)

If you prefer SQL:

```sql
-- Replace 'admin@cloudclash.local' with your email
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

**Full documentation:** See `ADMIN_SETUP.md` for detailed instructions and troubleshooting.
