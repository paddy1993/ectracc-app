# 🚀 ECTRACC Render Deployment Guide

## Backend Deployment (Render - Free Tier)

### Step 1: Push Code to GitHub

1. **Create GitHub repository** (if not already done):
   ```bash
   cd /Users/patrickahern/ectracc-fresh
   git init
   git add .
   git commit -m "Initial ECTRACC deployment"
   ```

2. **Create repository on GitHub.com:**
   - Go to github.com → New Repository
   - Name: `ectracc-app`
   - Make it public (required for free tier)

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ectracc-app.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy Backend on Render

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `ectracc-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd ectracc-backend && npm install`
   - **Start Command**: `cd ectracc-backend && npm start`
   - **Plan**: Free

5. **Set Environment Variables:**
   ```
   NODE_ENV=production
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Step 3: Deploy Frontend on Vercel

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy frontend:**
   ```bash
   cd ectracc-frontend
   vercel --prod
   ```

3. **Configure environment variables in Vercel dashboard:**
   ```
   REACT_APP_ENV=production
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   REACT_APP_API_BASE_URL=https://your-render-backend.onrender.com/api
   ```

### Step 4: Configure Custom Domain

1. **In Vercel dashboard:** Add `ectracc.com` as custom domain
2. **Update DNS:** Point your domain to Vercel

## 💰 Cost Breakdown

- **Render Backend**: FREE (750 hours/month)
- **Vercel Frontend**: FREE (100GB bandwidth/month)
- **Supabase**: $25/month (Pro plan recommended)
- **Domain**: Already purchased ✅

**Total: ~$25/month**

## 🚀 Quick Start Commands

```bash
# 1. Initialize git and push to GitHub
git init && git add . && git commit -m "Deploy ECTRACC"

# 2. Deploy frontend to Vercel
cd ectracc-frontend && vercel --prod

# 3. Configure backend on Render.com (manual step)
# 4. Update environment variables
# 5. Test live application
```
