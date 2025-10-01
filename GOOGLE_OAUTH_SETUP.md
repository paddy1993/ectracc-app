# 🔐 Google OAuth Setup Guide for ECTRACC

## 🎯 **Quick Setup Checklist**

### **✅ Step 1: Create Supabase Project**
1. Go to https://supabase.com and create a new project
2. Wait for project to initialize (2-3 minutes)
3. Go to **Settings → API**
4. Copy:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **✅ Step 2: Configure Environment Variables**
Create `ectracc-frontend/.env.local`:
```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_ENV=production
REACT_APP_API_BASE_URL=https://ectracc-backend.onrender.com
```

### **✅ Step 3: Set up Google Cloud Console**
1. Go to https://console.cloud.google.com
2. Create a new project or select existing one
3. **APIs & Services → Library** → Enable "Google+ API"
4. **APIs & Services → Credentials** → Create OAuth 2.0 Client ID
5. **Application type**: Web application
6. **Name**: ECTRACC Production
7. **Authorized JavaScript origins**:
   - `https://ectracc.com`
   - `https://your-project-id.supabase.co`
8. **Authorized redirect URIs**:
   - `https://your-project-id.supabase.co/auth/v1/callback`
9. **Save and copy Client ID & Client Secret**

### **✅ Step 4: Configure Supabase Authentication**
1. In Supabase Dashboard → **Authentication → Providers**
2. **Enable Google provider**
3. **Paste Google OAuth credentials**:
   - Client ID: `your-google-client-id`
   - Client Secret: `your-google-client-secret`
4. **Site URL**: `https://ectracc.com`
5. **Redirect URLs**: `https://ectracc.com/auth/callback`
6. **Save configuration**

### **✅ Step 5: Test the Integration**
1. **Deploy your frontend** with the new environment variables
2. **Visit**: https://ectracc.com/login
3. **Click "Continue with Google"**
4. **Should redirect to Google OAuth**
5. **After authentication, should redirect back to your app**

## 🔧 **Current Status**

**✅ Code Changes Applied**:
- OAuth redirect URL fixed to use `ectracc.com`
- AuthCallbackPage ready to handle OAuth returns
- Google sign-in button properly configured

**⚠️ Still Needed**:
- Supabase project setup
- Environment variables configuration
- Google Cloud Console OAuth setup
- Frontend deployment with new env vars

## 🚨 **Common Issues & Solutions**

### **Issue**: "Invalid redirect URI"
**Solution**: Make sure all URLs match exactly:
- Google Console authorized URIs
- Supabase redirect URLs
- Your actual domain (ectracc.com)

### **Issue**: "Supabase client not configured"
**Solution**: Check environment variables are loaded:
```bash
# In your frontend directory
echo $REACT_APP_SUPABASE_URL
echo $REACT_APP_SUPABASE_ANON_KEY
```

### **Issue**: OAuth works but user not created
**Solution**: Check Supabase Authentication → Users to see if accounts are being created

## 📋 **Testing Checklist**

After setup, test these flows:

**✅ Google OAuth Flow**:
1. Visit `/login`
2. Click "Continue with Google"
3. Complete Google authentication
4. Should redirect to `/auth/callback`
5. Should then redirect to `/dashboard` or `/profile-setup`

**✅ User Creation**:
1. Check Supabase → Authentication → Users
2. New user should appear after OAuth
3. Profile should be created in your database

**✅ Session Persistence**:
1. After OAuth login, refresh the page
2. Should remain logged in
3. Should not redirect back to login

## 🔗 **Useful Links**

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth Setup**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com

## 🆘 **Need Help?**

If you run into issues:
1. Check browser developer tools for errors
2. Check Supabase logs in dashboard
3. Verify all URLs match exactly
4. Test with incognito/private browsing

**Once completed, your Google OAuth will be fully functional on https://ectracc.com/login!** 🎉
