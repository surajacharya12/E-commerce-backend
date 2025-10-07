#!/bin/bash

# Backend Deployment Script
echo "🚀 Starting backend deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests (if any)
echo "🧪 Running tests..."
npm test

# Check for environment variables
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: No environment file found. Make sure to set environment variables in your deployment platform."
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod
    echo "✅ Deployment completed!"
    echo "🔗 Your API is now live!"
else
    echo "❌ Vercel CLI not found. Please install it with: npm install -g vercel"
    echo "📋 Manual deployment steps:"
    echo "1. Install Vercel CLI: npm install -g vercel"
    echo "2. Login: vercel login"
    echo "3. Deploy: vercel --prod"
    exit 1
fi

echo "🎉 Backend deployment successful!"
echo "📝 Don't forget to:"
echo "   - Update frontend API URLs"
echo "   - Set environment variables in Vercel dashboard"
echo "   - Test all endpoints"