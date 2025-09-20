#!/bin/bash

echo "🚀 ECTRACC Deployment Script"
echo "=========================================="

# Check if required tools are installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo ""
echo "📋 Deployment Checklist:"
echo "1. ✅ Domain purchased (ectracc.com)"
echo "2. ⏳ Backend deployment to Railway..."

# Deploy backend first
echo ""
echo "🖥️  Deploying Backend to Railway..."
cd ectracc-backend

# Check if railway is initialized
if [ ! -f "railway.toml" ]; then
    echo "Initializing Railway project..."
    railway init
fi

railway up

echo "✅ Backend deployed!"
echo "📝 Note: Update environment variables in Railway dashboard"

cd ..

# Deploy frontend
echo ""
echo "🌐 Deploying Frontend to Vercel..."
cd ectracc-frontend

vercel --prod

echo "✅ Frontend deployed!"
echo "📝 Note: Configure custom domain (ectracc.com) in Vercel dashboard"

cd ..

echo ""
echo "🎉 Deployment Complete!"
echo "=========================================="
echo "Next steps:"
echo "1. Configure custom domain in Vercel dashboard"
echo "2. Set environment variables in Railway dashboard"
echo "3. Update frontend API_BASE_URL with Railway backend URL"
echo "4. Create production Supabase project"
echo "5. Test the live application"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
