# Profile Update Debugging Guide

Since you've applied the RLS migration but the profile update is still not working, let's systematically debug the issue.

## Step 1: Check Browser Console Logs

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Clear the console
4. Try to update your profile name
5. Look for error messages

### What to Look For:

**Expected logs from our changes:**
```
🔄 [PROFILE PAGE] Submitting profile update: { display_name: "Your Name" }
🔄 [AUTH SERVICE] Updating profile for user: [user-id]
📝 [AUTH SERVICE] Updates: { full_name: "Your Name" }
```

**If it fails, you'll see:**
```
❌ [AUTH SERVICE] Update error: { message: "...", code: "...", details: "...", hint: "..." }
❌ [PROFILE PAGE] Profile update failed: [error message]
```

**Copy the exact error message and error code** - this will tell us exactly what's wrong.

## Step 2: Verify RLS Policies in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your ECTRACC project
3. Click **SQL Editor**
4. Run this query:

```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
```

**Expected Result:**

You should see **3 policies**:
- "Users can view own profile" (cmd: SELECT)
- "Users can update own profile" (cmd: UPDATE)
- "Users can insert own profile" (cmd: INSERT)

**If you see 0 policies**: The migration didn't run or failed silently.

**If you see only 1 or 2 policies**: The migration partially ran. Run the DROP commands and try again.

## Step 3: Check Your User ID Matches Profile

Run this in Supabase SQL Editor:

```sql
-- Check if your profile exists and user_id matches
SELECT 
  p.user_id,
  p.full_name,
  auth.uid() AS current_user_id,
  (auth.uid() = p.user_id) AS ids_match
FROM profiles p
WHERE p.user_id = auth.uid();
```

**Expected Result:**
- `user_id`: Your user UUID
- `full_name`: Your current name (or NULL)
- `current_user_id`: Same UUID as user_id
- `ids_match`: **TRUE** ← This must be TRUE

**If `ids_match` is FALSE**: There's a data inconsistency. Your authentication user ID doesn't match the profile's user_id.

**If you get 0 rows**: Your profile doesn't exist. The system should create it on first update, but let's check.

## Step 4: Test Direct Update in SQL Editor

Try updating directly in Supabase to verify the policy works:

```sql
-- Try to update your profile
UPDATE profiles
SET full_name = 'Test Name'
WHERE user_id = auth.uid();

-- Check if it worked
SELECT user_id, full_name FROM profiles WHERE user_id = auth.uid();
```

**If this works**: The RLS policy is correct, and the issue is in the frontend API call.

**If this fails with "insufficient_privilege"**: The RLS policy isn't working. You may need to check:
- Is RLS actually enabled? Run: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'profiles';`
- The `relrowsecurity` column should be `t` (true)

## Step 5: Check Authentication Status

In the browser console, check your current authentication:

```javascript
// Run this in the browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

**Expected**: You should see your user object with an `id` field.

**If user is null**: You're not authenticated. Sign out and sign in again.

## Step 6: Network Tab Inspection

1. Open Developer Tools → **Network** tab
2. Filter by "Fetch/XHR"
3. Try updating your profile
4. Look for the request to `/profiles` or similar
5. Click on it to see:
   - **Request payload**: What data is being sent?
   - **Response**: What error is the server returning?

## Common Issues and Solutions

### Issue 1: Error Code 42501 (insufficient_privilege)

**Cause**: RLS policy is blocking the update.

**Solution**:
```sql
-- Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'profiles';

-- If not enabled, run:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Re-create the UPDATE policy:
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Issue 2: Error "JWT expired" or "Invalid token"

**Cause**: Your session expired.

**Solution**: Sign out and sign in again.

### Issue 3: Error "new row violates row-level security policy"

**Cause**: The `WITH CHECK` clause is failing. This happens if you're trying to change the `user_id`.

**Solution**: Make sure you're not sending `user_id` in the update payload. Check the network request.

### Issue 4: Profile doesn't exist (PGRST116)

**Cause**: Your profile row was never created during registration.

**Solution**: The code should auto-create it. If not, manually create it:

```sql
INSERT INTO profiles (user_id, full_name, created_at, updated_at)
VALUES (auth.uid(), 'Your Name', NOW(), NOW());
```

### Issue 5: No error but name doesn't update

**Cause**: Frontend state isn't refreshing.

**Solution**: Check the AuthContext is properly reloading the profile after update. In `src/contexts/AuthContext.tsx` line 184, it should call `setProfile(result.profile)`.

## Step 7: Enable Detailed Logging

Temporarily add this to see ALL Supabase operations:

In `src/services/supabase.ts`, add:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: true  // ADD THIS LINE
  }
});
```

This will log all auth operations to the console.

## Step 8: Check Database Schema

Verify the profiles table has the expected structure:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**Required columns:**
- `id` (uuid)
- `user_id` (uuid) - Must reference auth.users
- `full_name` (text) - This is what we're updating
- `avatar_url` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Next Steps

After going through these steps, please provide:

1. **The exact error message** from the console (Step 1)
2. **Number of RLS policies** found (Step 2)
3. **Whether `ids_match` is TRUE** (Step 3)
4. **Whether direct SQL update works** (Step 4)

With this information, I can provide a specific fix for your exact issue.

## Quick Fix Checklist

Try these in order:

- [ ] Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Clear browser cache and cookies
- [ ] Sign out and sign in again
- [ ] Verify you ran the ENTIRE migration SQL (all 34 lines)
- [ ] Check that RLS is enabled: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`
- [ ] Verify you're signed in as the same user whose profile you're trying to edit
- [ ] Try in an incognito/private browser window
- [ ] Check for ad blockers or extensions blocking the API call

## Emergency Workaround

If nothing works and you need immediate access, temporarily disable RLS:

```sql
-- TEMPORARY - Only for debugging, remove after finding the issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING**: This removes all security protection. Only use for testing, never in production!

After testing, re-enable:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

