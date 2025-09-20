# ECTRACC Production Deployment Guide

## 🚀 Frontend Deployment (Vercel)

### Step 1: Create Production Environment File

Create `ectracc-frontend/.env.production`:
```bash
# Production Environment Variables
REACT_APP_ENV=production

# Supabase Configuration (update with your production values)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-production-anon-key-here

# API Configuration (will be updated after backend deployment)
REACT_APP_API_BASE_URL=https://your-backend-url.railway.app/api
```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy Frontend:**
   ```bash
   cd ectracc-frontend
   vercel --prod
   ```

4. **Configure Custom Domain:**
   - In Vercel dashboard, go to your project settings
   - Add `ectracc.com` and `www.ectracc.com` as custom domains
   - Follow DNS configuration instructions

---

## 🖥️ Backend Deployment (Railway)

### Step 1: Create Production Environment File

Create `ectracc-backend/.env.production`:
```bash
# Server Configuration
NODE_ENV=production
PORT=8000
HOST=0.0.0.0

# Supabase Configuration (update with your production values)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key-here

# MongoDB (optional - can use Supabase only)
MONGODB_URI=your-production-mongodb-uri
MONGODB_DATABASE=ectracc_production

# CORS Configuration
ALLOWED_ORIGINS=https://ectracc.com,https://www.ectracc.com
```

### Step 2: Prepare for Railway Deployment

1. **Create railway.json in backend root:**
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "start": "node index.js",
       "dev": "nodemon index.js",
       "build": "echo 'No build step required'"
     }
   }
   ```

### Step 3: Deploy to Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize and Deploy:**
   ```bash
   cd ectracc-backend
   railway init
   railway up
   ```

4. **Set Environment Variables in Railway Dashboard:**
   - Go to your Railway project dashboard
   - Add all the environment variables from `.env.production`

---

## 🔧 Configuration Updates After Deployment

### Step 1: Update Frontend Environment Variables

After backend is deployed, update your Vercel environment variables:
1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Update `REACT_APP_API_BASE_URL` with your Railway backend URL

### Step 2: Update CORS in Backend

Update the backend's allowed origins to include your Vercel domain:
```javascript
// In ectracc-backend/index.js
const allowedOrigins = [
  'https://ectracc.com',
  'https://www.ectracc.com',
  'https://your-vercel-app.vercel.app'
];
```

### Step 3: Create Production Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project for production
3. Update all environment variables with production Supabase credentials
4. Create the `profiles` table in production database:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 🧪 Testing Production Deployment

### Step 1: Test Frontend
1. Visit `https://ectracc.com`
2. Test user registration/login
3. Test all pages (Dashboard, Products, History)
4. Test on mobile devices

### Step 2: Test Backend
1. Test API endpoints: `https://your-backend-url.railway.app/api/healthcheck`
2. Test CORS with frontend requests
3. Monitor Railway logs for errors

### Step 3: Test Integration
1. Test user authentication end-to-end
2. Test profile creation and updates
3. Test all mock API responses

---

## 📊 Monitoring & Analytics

### Step 1: Set up Error Monitoring
Add to `ectracc-frontend/public/index.html`:
```html
<!-- Simple error tracking -->
<script>
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
  // You can send this to a logging service later
});
</script>
```

### Step 2: Add Basic Analytics
Add Google Analytics or simple page view tracking.

---

## 🚀 Go Live Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway  
- [ ] Custom domain configured (ectracc.com)
- [ ] Production Supabase project created
- [ ] All environment variables configured
- [ ] HTTPS working on both frontend and backend
- [ ] User authentication working
- [ ] All pages loading correctly
- [ ] Mobile responsive design working
- [ ] Error monitoring in place

---

## 🔄 Future Updates

To deploy updates:

**Frontend:**
```bash
cd ectracc-frontend
vercel --prod
```

**Backend:**
```bash
cd ectracc-backend
railway up
```

---

## 💡 Cost Estimate

- **Vercel**: Free tier (sufficient for MVP)
- **Railway**: $5/month (after free trial)
- **Supabase**: $25/month (Pro tier recommended)
- **Domain**: Already purchased ✅
- **Total**: ~$30/month

Ready to start deployment? Let me know if you need help with any of these steps!
