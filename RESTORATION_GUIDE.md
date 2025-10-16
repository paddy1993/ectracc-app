# ECTRACC Restoration Guide

This guide provides step-by-step instructions for restoring ECTRACC from the backup branch `backup/ectracc-full-20251016-091322`.

## Prerequisites

Before starting the restoration process, ensure you have the following installed:

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: Latest version
- **Code Editor**: VS Code, WebStorm, or similar

### Required Accounts and Services
- **GitHub Account**: Access to the ECTRACC repository
- **Vercel Account**: For frontend deployment
- **Render Account**: For backend deployment
- **Supabase Account**: For user authentication and profiles
- **MongoDB Atlas Account**: For product database
- **Mixpanel Account**: For analytics (optional)

## Step 1: Repository Setup

### 1.1 Clone or Access Repository

If starting fresh:
```bash
git clone https://github.com/your-username/ectracc-fresh.git
cd ectracc-fresh
```

If repository already exists locally:
```bash
cd ectracc-fresh
git fetch origin
```

### 1.2 Switch to Backup Branch

```bash
git checkout backup/ectracc-full-20251016-091322
```

### 1.3 Verify Backup Contents

```bash
# Check that all key directories exist
ls -la
# Should show: src/, ectracc-backend/, ectracc-mobile/, public/, etc.

# Verify backup documentation
ls -la BACKUP_*.md
# Should show: BACKUP_MANIFEST.md, RESTORATION_GUIDE.md, BACKUP_NOTES.md
```

## Step 2: Environment Configuration

### 2.1 Frontend Environment Variables

Create `.env` file in the root directory:

```bash
# Create frontend environment file
touch .env
```

Add the following variables to `.env`:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
REACT_APP_MIXPANEL_TOKEN=your_mixpanel_token
```

### 2.2 Backend Environment Variables

Create `.env` file in the backend directory:

```bash
# Create backend environment file
touch ectracc-backend/.env
```

Add the following variables to `ectracc-backend/.env`:
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=ectracc
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Step 3: Database Setup

### 3.1 Supabase Configuration

1. **Create Supabase Project** (if not exists):
   - Go to https://supabase.com
   - Create new project
   - Note the URL and keys

2. **Configure Authentication**:
   - Enable Google OAuth in Supabase dashboard
   - Set redirect URLs:
     - `https://ectracc.com/auth/callback`
     - `http://localhost:3000/auth/callback` (for development)

3. **Set up Database Tables**:
   - Supabase automatically creates `auth.users` table
   - Create `profiles` table if needed:
   ```sql
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT,
     name TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### 3.2 MongoDB Configuration

1. **Create MongoDB Atlas Cluster** (if not exists):
   - Go to https://cloud.mongodb.com
   - Create new cluster
   - Create database user
   - Whitelist IP addresses

2. **Database Structure**:
   - Database name: `ectracc`
   - Collections: `products`, `footprints`, `categories`

## Step 4: Dependency Installation

### 4.1 Install Frontend Dependencies

```bash
# Install main frontend dependencies
npm install

# Verify installation
npm list --depth=0
```

### 4.2 Install Backend Dependencies

```bash
# Navigate to backend directory
cd ectracc-backend

# Install backend dependencies
npm install

# Return to root directory
cd ..
```

### 4.3 Install Mobile Dependencies (if needed)

```bash
# Navigate to mobile directory
cd ectracc-mobile

# Install mobile dependencies
npm install

# Return to root directory
cd ..
```

## Step 5: Local Development Setup

### 5.1 Start Backend Server

```bash
# In one terminal window
cd ectracc-backend
npm run dev

# Backend should start on http://localhost:3001
# Look for "Server running on port 3001" message
```

### 5.2 Start Frontend Development Server

```bash
# In another terminal window (from root directory)
npm run dev

# Frontend should start on http://localhost:3000
# Browser should automatically open
```

### 5.3 Verify Local Setup

1. **Check Frontend**: Navigate to http://localhost:3000
   - Should see ECTRACC homepage
   - No console errors in browser dev tools

2. **Check Backend**: Navigate to http://localhost:3001/api/health
   - Should return JSON with status "OK"

3. **Check Database Connections**:
   - Backend logs should show successful MongoDB connection
   - Backend logs should show successful Supabase connection

## Step 6: Production Deployment

### 6.1 Deploy Backend to Render

1. **Connect Repository to Render**:
   - Go to https://render.com
   - Create new Web Service
   - Connect to GitHub repository
   - Select `ectracc-backend` as root directory

2. **Configure Build Settings**:
   - Build Command: `npm install`
   - Start Command: `npm run start:prod`
   - Environment: Node.js

3. **Set Environment Variables** in Render dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DATABASE=ectracc
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   ```

4. **Deploy**: Click "Create Web Service"

### 6.2 Deploy Frontend to Vercel

1. **Connect Repository to Vercel**:
   - Go to https://vercel.com
   - Import project from GitHub
   - Select the repository

2. **Configure Build Settings**:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Set Environment Variables** in Vercel dashboard:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
   REACT_APP_MIXPANEL_TOKEN=your_mixpanel_token
   ```

4. **Deploy**: Click "Deploy"

### 6.3 Configure Custom Domain

1. **In Vercel Dashboard**:
   - Go to project settings
   - Navigate to "Domains"
   - Add custom domain: `ectracc.com`
   - Follow DNS configuration instructions

2. **Update DNS Records**:
   - Add CNAME record pointing `ectracc.com` to Vercel
   - Wait for DNS propagation (up to 24 hours)

## Step 7: Post-Deployment Verification

### 7.1 Test Production Environment

1. **Frontend Testing**:
   - Visit https://ectracc.com
   - Test user registration/login
   - Test barcode scanning
   - Test footprint tracking
   - Test mobile responsiveness

2. **Backend Testing**:
   - Check API health endpoint
   - Test user authentication flow
   - Verify database connections
   - Check API response times

3. **Integration Testing**:
   - Complete user registration flow
   - Test Google OAuth login
   - Add footprint entries
   - View dashboard analytics

### 7.2 Monitor Application Health

1. **Check Logs**:
   - Render: View application logs for errors
   - Vercel: Check function logs and build logs
   - Browser: Monitor console for client-side errors

2. **Performance Monitoring**:
   - Use browser dev tools to check load times
   - Monitor API response times
   - Check mobile performance

## Step 8: Troubleshooting Common Issues

### 8.1 Build Failures

**Problem**: Frontend build fails with TypeScript errors
```bash
# Solution: Check TypeScript configuration
npm run build

# If errors persist, check:
# - tsconfig.json configuration
# - Missing type declarations
# - Import/export syntax
```

**Problem**: Backend fails to start
```bash
# Solution: Check environment variables and dependencies
cd ectracc-backend
npm install
npm run start

# Check logs for specific error messages
```

### 8.2 Database Connection Issues

**Problem**: MongoDB connection fails
```bash
# Check connection string format
# Verify IP whitelist in MongoDB Atlas
# Confirm database user credentials
```

**Problem**: Supabase authentication fails
```bash
# Verify Supabase URL and keys
# Check redirect URL configuration
# Confirm OAuth provider settings
```

### 8.3 Deployment Issues

**Problem**: Vercel deployment fails
```bash
# Check build logs in Vercel dashboard
# Verify environment variables
# Ensure all dependencies are in package.json
```

**Problem**: Render deployment fails
```bash
# Check build logs in Render dashboard
# Verify start command and build command
# Check environment variable configuration
```

### 8.4 Runtime Issues

**Problem**: Google OAuth not working
```bash
# Verify redirect URLs in Supabase dashboard
# Check OAuth provider configuration
# Ensure HTTPS is used in production
```

**Problem**: API requests failing
```bash
# Check CORS configuration in backend
# Verify API base URL in frontend environment
# Check network requests in browser dev tools
```

## Step 9: Maintenance and Updates

### 9.1 Regular Maintenance Tasks

1. **Weekly**:
   - Check application logs for errors
   - Monitor database performance
   - Review user feedback

2. **Monthly**:
   - Update dependencies (security patches)
   - Review analytics data
   - Backup database

3. **Quarterly**:
   - Performance optimization review
   - Security audit
   - Feature usage analysis

### 9.2 Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update packages (be cautious with major version changes)
npm update

# Test thoroughly after updates
npm test
npm run build
```

### 9.3 Database Maintenance

```bash
# MongoDB: Regular index optimization
# Supabase: Monitor query performance
# Regular backups of critical data
```

## Step 10: Emergency Recovery

### 10.1 Quick Recovery Steps

If the application goes down:

1. **Check Service Status**:
   - Vercel status page
   - Render status page
   - MongoDB Atlas status

2. **Rollback if Necessary**:
   ```bash
   # Revert to previous deployment
   git checkout backup/ectracc-full-20251016-091322
   # Redeploy to Vercel and Render
   ```

3. **Contact Support**:
   - Vercel support for frontend issues
   - Render support for backend issues
   - MongoDB support for database issues

### 10.2 Data Recovery

```bash
# If data loss occurs:
# 1. Check database backups
# 2. Contact MongoDB Atlas support
# 3. Use Supabase backup features
# 4. Implement from this backup branch
```

## Success Criteria

After completing this restoration guide, you should have:

- ✅ Fully functional ECTRACC application
- ✅ Frontend deployed to Vercel at ectracc.com
- ✅ Backend deployed to Render
- ✅ Database connections working properly
- ✅ User authentication functioning
- ✅ All features working as expected
- ✅ Mobile responsiveness verified
- ✅ Performance optimized

## Support and Documentation

- **Technical Documentation**: See `BACKUP_MANIFEST.md` for detailed component information
- **Implementation Guide**: See `IMPLEMENTATION_GUIDE.md` for UI/UX enhancement details
- **Recent Changes**: See `BACKUP_NOTES.md` for latest updates and fixes

For additional support, refer to the individual service documentation:
- [React Documentation](https://reactjs.org/docs)
- [Node.js Documentation](https://nodejs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
