# Admin User Setup Guide

## Step 1: Run Database Migration

First, you need to run the database migration to add the admin role functionality.

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the following SQL commands:

```sql
-- Add admin role to profiles table
-- This should be run in Supabase SQL editor

-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'product_approved', 'product_rejected'
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}', -- Additional data like product_id, submission_id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policy to create notifications for any user
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- System can create notifications (for backend services)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notifications updated_at
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

3. Click **Run** to execute the migration

## Step 2: Create Admin User Account

### Option A: Create via ECTRACC Website (Recommended)

1. Go to **https://ectracc.com**
2. Click **Register** or **Sign Up**
3. Use these credentials:
   - **Email:** `info@ectracc.com`
   - **Password:** `Consortium1!`
4. Complete the registration process
5. Fill out the profile setup questionnaire
6. Once registered, proceed to Step 3

### Option B: Create via Supabase Dashboard

If you prefer to create the user directly in Supabase:

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add User**
3. Enter:
   - **Email:** `info@ectracc.com`
   - **Password:** `Consortium1!`
   - **Auto Confirm User:** Yes
4. Click **Create User**
5. Note down the **User ID** (UUID) that gets generated

## Step 3: Grant Admin Privileges

After the user is created (via either method), you need to grant admin privileges:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query to find the user ID (if you used Option A):

```sql
SELECT id, email FROM auth.users WHERE email = 'info@ectracc.com';
```

3. Copy the user ID from the result
4. Run this query to grant admin privileges (replace `USER_ID_HERE` with the actual UUID):

```sql
-- Grant admin privileges to the user
UPDATE profiles 
SET is_admin = TRUE 
WHERE user_id = 'USER_ID_HERE';

-- If no profile exists yet, create one with admin privileges
INSERT INTO profiles (user_id, is_admin, full_name, created_at, updated_at)
VALUES (
  'USER_ID_HERE',
  TRUE,
  'ECTRACC Admin',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  is_admin = TRUE,
  updated_at = NOW();
```

## Step 4: Verify Admin Access

1. Go to **https://ectracc.com**
2. Log in with:
   - **Email:** `info@ectracc.com`
   - **Password:** `Consortium1!`
3. Once logged in, navigate to: **https://ectracc.com/admin**
4. You should see the Admin Dashboard with:
   - Statistics cards showing pending/approved/rejected counts
   - Tabs for Pending Review, Approved, and Rejected products
   - Admin-only interface elements

## Step 5: Test the Admin Functionality

To test the complete flow:

1. **Create a test submission** (using a different user account):
   - Go to Manual Entry (`/tracker`)
   - Enter a product name that doesn't exist (e.g., "Test Product 123")
   - Fill in carbon footprint details
   - Submit the entry
   - The system should detect it's a new product and show the submission form

2. **Review as admin**:
   - Log in as `info@ectracc.com`
   - Go to `/admin`
   - You should see the test submission in the Pending Review tab
   - Click on it to review and approve/reject

## Troubleshooting

### If admin page shows "Access Denied":
- Verify the `is_admin` field is set to `TRUE` in the profiles table
- Check that the user_id in profiles matches the auth.users id
- Ensure the database migration ran successfully

### If you can't log in:
- Verify the user was created in Supabase Authentication
- Check that the email is confirmed (auto-confirm should be enabled)
- Try resetting the password if needed

### If the admin page doesn't load:
- Check browser console for JavaScript errors
- Verify the frontend deployment includes the latest admin dashboard code
- Ensure the backend is deployed with the new admin routes

## Security Note

Remember to:
- Keep the admin credentials secure
- Only grant admin privileges to trusted users
- Regularly review admin user list
- Consider using a more secure password in production
