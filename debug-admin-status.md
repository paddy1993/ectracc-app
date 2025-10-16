# Debug Admin Status

## Check Current Admin Status

To debug why the admin navigation isn't showing, let's check the current admin status for your user.

### Option 1: Check via Browser Console

1. Open browser developer tools (F12)
2. Go to the Console tab
3. Look for logs starting with `[ADMIN AUTH]` when you refresh the page
4. You should see something like:
   ```
   🔍 [ADMIN AUTH] Checking admin status for user: [user-id]
   ✅ [ADMIN AUTH] Admin status for user [user-id]: true
   ```

### Option 2: Manual Database Check

Go to your Supabase dashboard and run this SQL query:

```sql
-- Check if the user exists and their admin status
SELECT 
  user_id,
  email,
  full_name,
  is_admin,
  created_at
FROM profiles 
WHERE email = 'info@ectracc.com';
```

### Option 3: Set Admin Status Manually

If the user doesn't have `is_admin = true`, run this SQL command in Supabase:

```sql
-- First, find the user_id from auth.users
SELECT id, email FROM auth.users WHERE email = 'info@ectracc.com';

-- Then update the profile (replace USER_ID with the actual ID from above)
UPDATE profiles 
SET is_admin = true 
WHERE user_id = 'USER_ID_FROM_ABOVE';

-- Or if you want to do it in one command:
UPDATE profiles 
SET is_admin = true 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'info@ectracc.com'
);
```

### Option 4: Create Profile if Missing

If no profile exists for the user, create one:

```sql
-- Insert profile with admin privileges
INSERT INTO profiles (user_id, email, full_name, is_admin, created_at, updated_at)
SELECT 
  id,
  email,
  'Admin User',
  true,
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'info@ectracc.com'
ON CONFLICT (user_id) DO UPDATE SET
  is_admin = true,
  updated_at = NOW();
```

## Expected Behavior After Fix

Once the admin status is properly set:

1. Refresh the page at ectracc.com
2. You should see "Admin Dashboard" in the left sidebar
3. On mobile, you should see "Admin" in the bottom navigation
4. Clicking either should take you to `/admin`

## Troubleshooting

If it still doesn't work after setting `is_admin = true`:

1. **Clear browser cache** and refresh
2. **Sign out and sign back in** to refresh the auth context
3. **Check browser console** for any JavaScript errors
4. **Try accessing `/admin` directly** in the URL bar

Let me know what you find in the browser console or database query results!
