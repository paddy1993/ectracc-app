# 📧 ECTRACC Supabase Email Configuration Guide

## 🎯 Issues to Fix
1. **Redirect URL**: Currently redirects to localhost instead of ectracc.com
2. **Email Branding**: Generic Supabase branding instead of ECTRACC branding

## 🔧 Step-by-Step Fix

### 1. **Fix Redirect URLs in Supabase Dashboard**

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **ECTRACC project**
3. Navigate to **Authentication → URL Configuration**
4. Update the following settings:

**Site URL:**
```
https://ectracc.com
```

**Redirect URLs** (add all of these):
```
https://ectracc.com/auth/callback
https://www.ectracc.com/auth/callback
https://ectracc.com/**
https://www.ectracc.com/**
```

### 2. **Update Email Templates**

1. In Supabase Dashboard, go to **Authentication → Email Templates**
2. Click on **"Confirm signup"** template
3. Update the **Subject** to:
```
Welcome to ECTRACC - Confirm Your Email
```

4. Replace the **HTML template** with the ECTRACC-branded version (see `ECTRACC_EMAIL_TEMPLATE.html`)

### 3. **Verify Environment Variables**

The following environment variables should be set in your Vercel deployment:

- ✅ `REACT_APP_ENV=production` (already added)
- ✅ `REACT_APP_API_BASE_URL` (already set)
- ❓ `REACT_APP_SUPABASE_URL` (you may need to add this)
- ❓ `REACT_APP_SUPABASE_ANON_KEY` (you may need to add this)

### 4. **Test the Configuration**

After making these changes:

1. **Deploy a fresh version** (if needed)
2. **Try registering a new account** with a test email
3. **Check the confirmation email** for:
   - ✅ ECTRACC branding and styling
   - ✅ Correct redirect URL (ectracc.com, not localhost)
   - ✅ Professional messaging about carbon footprint tracking

### 5. **Additional Email Templates to Update**

Consider updating these other email templates with ECTRACC branding:

- **Reset Password**: For password reset emails
- **Magic Link**: For passwordless login
- **Email Change**: For email address changes
- **Invite User**: For team invitations (if applicable)

## 🎨 Email Template Features

The new ECTRACC email template includes:

- 🌱 **ECTRACC branding** with green color scheme
- 📱 **Mobile-responsive design**
- 🎯 **Clear call-to-action** button
- 📋 **Feature highlights** (search, scan, track, goals)
- 🌍 **Sustainability messaging**
- 💚 **Professional footer** with help information

## 🔍 Troubleshooting

**If emails still redirect to localhost:**
1. Check that `REACT_APP_ENV=production` is set in Vercel
2. Verify the Site URL in Supabase is `https://ectracc.com`
3. Clear browser cache and try again

**If emails still show Supabase branding:**
1. Make sure you saved the new email template in Supabase
2. Check that you're editing the correct project
3. Try sending a test email from Supabase dashboard

**If confirmation links don't work:**
1. Verify all redirect URLs are added to Supabase
2. Check that your auth callback route exists at `/auth/callback`
3. Test with different email providers (Gmail, Outlook, etc.)

## ✅ Success Criteria

After completing this setup, new user registration emails should:

- ✅ Have ECTRACC branding and green color scheme
- ✅ Redirect to `https://ectracc.com/auth/callback`
- ✅ Include sustainability-focused messaging
- ✅ Have a professional, mobile-friendly design
- ✅ Work consistently across email providers
