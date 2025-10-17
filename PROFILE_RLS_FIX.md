# Profile Name Update Fix - Setup Guide

## Problem

Users are unable to update their display name on the Profile page. When clicking "Save Changes", the update appears to work but the name doesn't actually change.

## Root Cause

The Supabase `profiles` table is missing Row Level Security (RLS) policies for UPDATE operations. Without these policies, Supabase blocks all update attempts for security reasons.

## Solution

Apply the database migration to add the necessary RLS policies.

---

## Step-by-Step Instructions

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Sign in to your account
3. Select your ECTRACC project

### Step 2: Open SQL Editor

1. In the left sidebar, click on **SQL Editor** (icon looks like `</>`)
2. Click **New Query** to create a new SQL script

### Step 3: Execute the Migration

1. Open the file `database-migrations/003-add-profiles-rls-policies.sql`
2. Copy the entire contents
3. Paste into the SQL Editor in Supabase
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

The migration will:
- Enable Row Level Security on the profiles table
- Drop any existing policies to avoid conflicts
- Create three new policies:
  - `Users can view own profile` - Allows SELECT on own profile
  - `Users can update own profile` - Allows UPDATE on own profile
  - `Users can insert own profile` - Allows INSERT of own profile

### Step 4: Verify Policies Were Created

After running the migration, you should see a result table showing the policies:

| tablename | policyname | cmd | roles |
|-----------|------------|-----|-------|
| profiles | Users can view own profile | SELECT | public |
| profiles | Users can update own profile | UPDATE | public |
| profiles | Users can insert own profile | INSERT | public |

If you see these three policies, the migration was successful!

### Step 5: Test Profile Update

1. Open your ECTRACC app in a browser
2. Navigate to the **Profile** page
3. Click the **Edit** button
4. Change your display name
5. Click **Save Changes**
6. Verify the name updates immediately
7. Refresh the page to confirm the change persisted

---

## What These Policies Do

### SELECT Policy
```sql
USING (auth.uid() = user_id)
```
Allows users to view their own profile. The `auth.uid()` function returns the currently authenticated user's ID.

### UPDATE Policy
```sql
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```
Allows users to update their own profile. The `USING` clause checks that the user owns the profile, and the `WITH CHECK` clause ensures they can't change the `user_id` to someone else's.

### INSERT Policy
```sql
WITH CHECK (auth.uid() = user_id)
```
Allows users to create their own profile during registration. The `WITH CHECK` clause ensures they can only create a profile for themselves.

---

## Troubleshooting

### Issue: Migration fails with "policy already exists"

**Solution**: The migration includes `DROP POLICY IF EXISTS` statements, so this shouldn't happen. If it does, manually drop the policies first:

```sql
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
```

Then run the migration again.

### Issue: Profile update still doesn't work after applying fix

**Possible causes**:

1. **Browser cache**: Hard refresh the page (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. **Not authenticated**: Sign out and sign back in
3. **Wrong user_id**: Check that your profile's `user_id` matches `auth.uid()`

**To verify**:

Run this query in Supabase SQL Editor:

```sql
SELECT 
  p.user_id,
  p.full_name,
  auth.uid() AS current_user_id,
  (auth.uid() = p.user_id) AS ids_match
FROM profiles p
WHERE p.user_id = auth.uid();
```

If `ids_match` is `false`, there's a data inconsistency that needs to be fixed.

### Issue: Can see other users' profiles

**Cause**: The SELECT policy is missing or incorrect.

**Solution**: Verify the SELECT policy exists:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'SELECT';
```

It should show `USING (auth.uid() = user_id)`.

---

## Security Note

These RLS policies ensure that:
- Users can ONLY view their own profile
- Users can ONLY update their own profile  
- Users can ONLY create a profile for themselves
- No user can modify another user's data

This is a critical security feature that protects user data in a multi-tenant application.

---

## Need Help?

If you encounter any issues or have questions:

1. Check the browser console for error messages
2. Check the Supabase logs in Dashboard → Logs
3. Verify your authentication is working properly
4. Contact support with the error details

---

## Migration Details

- **File**: `database-migrations/003-add-profiles-rls-policies.sql`
- **Applied**: [Date you applied it]
- **Purpose**: Enable users to update their own profiles
- **Breaking Changes**: None - this only adds missing functionality

