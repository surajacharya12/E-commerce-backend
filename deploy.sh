#!/bin/bash

# Backend Deployment Script
echo "🚀 Starting backend deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Check if required files exist
echo "🔍 Checking required files..."
required_files=("index.js" "vercel.json" "package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Required file $file not found."
        exit 1
    fi
done

# Create public directories if they don't exist
echo "📁 Ensuring public directories exist..."
mkdir -p public/products public/category public/posters

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Check for environment variables
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: No environment file found. Make sure to set environment variables in your deployment platform."
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    echo "🔑 Logging in to Vercel..."
    vercel login
    
    echo "🚀 Starting deployment..."
    vercel --prod --confirm
    
    echo "✅ Deployment completed!"
    echo "🔗 Your API is now live!"
else
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
    
    if command -v vercel &> /dev/null; then
        echo "✅ Vercel CLI installed successfully!"
        vercel login
        vercel --prod --confirm
    else
        echo "❌ Failed to install Vercel CLI. Please install manually:"
        echo "📋 Manual deployment steps:"
        echo "1. Install Vercel CLI: npm install -g vercel"
        echo "2. Login: vercel login"
        echo "3. Deploy: vercel --prod"
        exit 1
    fi
fi

echo ""
echo "🎉 Backend deployment successful!"
echo ""
echo "📝 Next steps:"
echo "   ✅ Set environment variables in Vercel dashboard"
echo "   ✅ Update frontend API URLs to point to your new backend"
echo "   ✅ Test all endpoints: curl https://your-api-domain.vercel.app/health"
echo "   ✅ Monitor logs in Vercel dashboard"
echo ""
echo "🔗 Useful links:"
echo "   - Vercel Dashboard: https://vercel.com/dashboard"
echo "   - Environment Variables: https://vercel.com/docs/environment-variables"