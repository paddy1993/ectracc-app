# Environment Variables Documentation

This document outlines all environment variables used in the ECTRACC application.

## 🔒 Security Notice

**NEVER commit actual credentials to version control.** All sensitive values should be set through your deployment platform's environment variable configuration.

## Frontend Environment Variables

### Required Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `REACT_APP_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` | Required for authentication and database |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public key, safe for client-side |

### Optional Variables

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `REACT_APP_ENV` | Environment name | `development` | Used for environment-specific behavior |
| `REACT_APP_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api` | Auto-detected in development |

### Development Setup

Create `.env.local` in the frontend root:

```bash
# Frontend Environment Variables (.env.local)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

### Production Setup (Vercel)

Set these in your Vercel dashboard under Project Settings → Environment Variables:

```bash
REACT_APP_ENV=production
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-production-anon-key
REACT_APP_API_BASE_URL=https://your-backend.onrender.com/api
```

## Backend Environment Variables

### Required Variables

| Variable | Description | Example | Security Level |
|----------|-------------|---------|----------------|
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` | ⚠️ Sensitive |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | 🔴 Highly Sensitive |
| `NODE_ENV` | Node environment | `production` | ✅ Safe |

### Optional Variables

| Variable | Description | Default | Security Level |
|----------|-------------|---------|----------------|
| `PORT` | Server port | `10000` | ✅ Safe |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` | 🔴 Highly Sensitive |
| `MONGODB_DATABASE` | MongoDB database name | `ectracc` | ✅ Safe |
| `ALLOWED_ORIGINS` | Additional CORS origins | `https://example.com` | ✅ Safe |

### Development Setup

Create `.env` in the backend root:

```bash
# Backend Environment Variables (.env)
NODE_ENV=development
PORT=5000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# MongoDB Configuration (Optional)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=ectracc_dev

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Production Setup (Render/Railway)

Set these in your deployment platform's environment variables:

```bash
NODE_ENV=production
PORT=10000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# MongoDB Configuration
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ectracc
MONGODB_DATABASE=ectracc_production

# CORS Configuration
ALLOWED_ORIGINS=https://ectracc.com,https://www.ectracc.com
```

## Security Best Practices

### 1. Environment Variable Security Levels

- 🔴 **Highly Sensitive**: Never log, never expose, rotate regularly
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `MONGODB_URI` (contains credentials)

- ⚠️ **Sensitive**: Don't expose to client, log carefully
  - `SUPABASE_URL`

- ✅ **Safe**: Can be logged and exposed
  - `NODE_ENV`
  - `PORT`
  - `MONGODB_DATABASE`

### 2. Key Rotation Schedule

| Key Type | Rotation Frequency | Notes |
|----------|-------------------|-------|
| Supabase Service Role Key | Every 90 days | High privilege key |
| Supabase Anon Key | Every 180 days | Public key, less critical |
| MongoDB Credentials | Every 90 days | Database access |

### 3. Environment Validation

The application validates required environment variables on startup:

```javascript
// Backend validates these on startup
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NODE_ENV'
];
```

### 4. Logging Security

- ✅ **Safe to log**: Variable names, validation status
- ❌ **Never log**: Actual credential values, tokens
- ⚠️ **Log carefully**: URLs (may contain sensitive info)

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Check that all required variables are set
   - Verify variable names match exactly (case-sensitive)

2. **"SUPABASE_URL must be a valid HTTPS URL"**
   - Ensure URL starts with `https://`
   - Check for typos in the URL

3. **"Authentication failed"**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Check that the key hasn't expired
   - Ensure the key has proper permissions

4. **CORS errors**
   - Add your domain to `ALLOWED_ORIGINS`
   - Check that frontend and backend URLs match

### Environment Variable Checklist

Before deployment, verify:

- [ ] All required variables are set
- [ ] No hardcoded credentials in source code
- [ ] URLs use HTTPS in production
- [ ] CORS origins include your domain
- [ ] Service role key has proper permissions
- [ ] MongoDB connection string is valid

## Getting Credentials

### Supabase Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing
3. Go to Settings → API
4. Copy `URL` and `anon public` key for frontend
5. Copy `service_role` key for backend (keep secret!)

### MongoDB Setup (Optional)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create database user with read/write permissions
4. Get connection string from "Connect" → "Connect your application"
5. Replace `<password>` with your database user password

## Support

If you encounter issues with environment variables:

1. Check this documentation
2. Verify all variables are set correctly
3. Check application logs for specific error messages
4. Ensure credentials haven't expired
5. Test with a minimal configuration first
