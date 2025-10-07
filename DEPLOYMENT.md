# Backend Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy from the backend directory**

   ```bash
   cd online_store_api
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard**
   - Go to your project in Vercel Dashboard
   - Navigate to Settings > Environment Variables
   - Add all variables from `.env.production`

### Option 2: Railway

1. **Install Railway CLI**

   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

### Option 3: Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables from `.env.production`

## 📋 Pre-Deployment Checklist

### ✅ Environment Variables Required:

- `NODE_ENV=production`
- `MONGO_URL` (MongoDB Atlas connection string)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `FRONTEND_URL` (Your deployed frontend URL)
- `STRIPE_PBLK_KET_TST` (if using Stripe)
- `STRIPE_SKRT_KET_TST` (if using Stripe)
- `ONE_SIGNAL_APP_ID` (if using push notifications)
- `ONE_SIGNAL_REST_API_KEY` (if using push notifications)

### ✅ Database Setup:

- MongoDB Atlas cluster is configured
- Database connection string is correct
- Network access is set to allow all IPs (0.0.0.0/0) for serverless deployment

### ✅ File Storage:

- Cloudinary account is set up
- API keys are configured
- Upload folders are configured

### ✅ Email Service:

- Gmail app password is generated
- Email service is configured for forgot password functionality

## 🔧 Post-Deployment Steps

1. **Update Frontend API URL**

   - Update the API URL in your frontend to point to the deployed backend
   - Usually in `cecom_dashboard/app/http/page.js` and `e_commerce/app/http/page.js`

2. **Test API Endpoints**

   ```bash
   curl https://your-api-domain.vercel.app/
   ```

3. **Test Database Connection**

   - Check logs to ensure MongoDB connection is successful

4. **Test File Uploads**

   - Test product image uploads
   - Test category image uploads

5. **Test Email Functionality**
   - Test forgot password email sending

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"

**Solution:** Ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0)

### Issue: "Cloudinary upload fails"

**Solution:** Verify Cloudinary credentials and folder permissions

### Issue: "CORS errors"

**Solution:** Update CORS configuration in `index.js` to include your frontend domain

### Issue: "Email not sending"

**Solution:** Verify Gmail app password and email configuration

## 📊 Monitoring

- Check Vercel/Railway/Render logs for errors
- Monitor MongoDB Atlas for connection issues
- Set up alerts for API downtime

## 🔄 CI/CD (Optional)

Create `.github/workflows/deploy.yml` for automatic deployment:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
    paths: ["online_store_api/**"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./online_store_api
```

## 🎯 Performance Optimization

1. **Enable compression**
2. **Set up caching headers**
3. **Optimize database queries**
4. **Use connection pooling**
5. **Implement rate limiting**

Your backend is now ready for production deployment! 🚀
