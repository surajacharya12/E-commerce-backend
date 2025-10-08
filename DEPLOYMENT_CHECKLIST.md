# 🚀 Deployment Checklist

## ✅ Pre-Deployment Checklist

### 📁 **File Structure**

- [x] `index.js` - Main server file
- [x] `package.json` - Dependencies and scripts
- [x] `vercel.json` - Vercel configuration
- [x] `public/` directories created
- [x] `.vercelignore` - Exclude unnecessary files

### 🔧 **Configuration**

- [ ] Environment variables set in deployment platform
- [ ] MongoDB Atlas connection string configured
- [ ] Cloudinary credentials configured
- [ ] Email service credentials configured
- [ ] CORS origins updated for production

### 🗄️ **Database Setup**

- [ ] MongoDB Atlas cluster created
- [ ] Network access configured (0.0.0.0/0 for serverless)
- [ ] Database user created with proper permissions
- [ ] Connection string tested

## 🚀 Deployment Steps

### **Option 1: Automated Deployment**

```bash
cd online_store_api
npm run deploy
```

### **Option 2: Manual Deployment**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod
```

### **Option 3: GitHub Integration**

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

## 🔍 Post-Deployment Verification

### **1. Health Check**

```bash
curl https://your-api-domain.vercel.app/health
```

Expected response:

```json
{
  "uptime": 123.456,
  "message": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "production"
}
```

### **2. API Status**

```bash
curl https://your-api-domain.vercel.app/
```

Expected response:

```json
{
  "success": true,
  "message": "API working successfully",
  "environment": "production",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": null
}
```

### **3. Test Key Endpoints**

```bash
# Test categories
curl https://your-api-domain.vercel.app/categories

# Test products
curl https://your-api-domain.vercel.app/products

# Test health endpoint
curl https://your-api-domain.vercel.app/health
```

### **4. Test Database Connection**

```bash
npm run test-connection
```

### **5. Automated Testing**

```bash
npm run test-deployment https://your-api-domain.vercel.app
```

## 🔧 Environment Variables Setup

### **Required Variables:**

```
NODE_ENV=production
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### **File Upload (Cloudinary):**

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### **Email Service:**

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=gmail
```

### **Optional (Payment & Notifications):**

```
STRIPE_PBLK_KET_TST=your-stripe-key
STRIPE_SKRT_KET_TST=your-stripe-secret
ONE_SIGNAL_APP_ID=your-onesignal-id
ONE_SIGNAL_REST_API_KEY=your-onesignal-key
```

## ⚠️ Remove secrets from repo

If you accidentally committed `.env.production` with real secrets, remove it from the repository and purge history:

1. Remove file from git but keep locally:

```bash
git rm --cached .env.production
git commit -m "chore: remove .env.production from repo"
```

2. (Optional/Advanced) Purge secrets from git history using `git filter-repo` or BFG. Example with BFG:

```bash
# Install BFG, then:
bfg --delete-files .env.production
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

3. Add secrets to your deployment platform (Vercel/Heroku) instead of committing them.

## 🔄 Update Frontend URLs

### **Dashboard API URL**

Update `cecom_dashboard/app/http/page.js`:

```javascript
const url = "https://your-api-domain.vercel.app/";
export default url;
```

### **E-commerce API URL**

Update `e_commerce/app/http/page.js`:

```javascript
const url = "https://your-api-domain.vercel.app/";
export default url;
```

## 🐛 Troubleshooting

### **Common Issues:**

#### **1. "Cannot connect to MongoDB"**

- ✅ Check MongoDB Atlas network access (allow 0.0.0.0/0)
- ✅ Verify connection string format
- ✅ Check database user permissions

#### **2. "CORS Error"**

- ✅ Update FRONTEND_URL environment variable
- ✅ Add your frontend domain to CORS origins

#### **3. "File upload fails"**

- ✅ Verify Cloudinary credentials
- ✅ Check Cloudinary upload presets

#### **4. "Email not sending"**

- ✅ Verify Gmail app password
- ✅ Check email service configuration

#### **5. "Function timeout"**

- ✅ Optimize database queries
- ✅ Check MongoDB connection pooling
- ✅ Increase function timeout in vercel.json

### **Debugging Steps:**

1. Check Vercel function logs
2. Test endpoints individually
3. Verify environment variables
4. Check database connection
5. Monitor performance metrics

## 📊 Monitoring

### **Set up monitoring for:**

- [ ] API uptime
- [ ] Response times
- [ ] Error rates
- [ ] Database performance
- [ ] File upload success rates

### **Useful Tools:**

- Vercel Analytics
- MongoDB Atlas monitoring
- Cloudinary usage dashboard
- Custom health check monitoring

## ✅ Deployment Complete!

Once all items are checked:

- ✅ API is deployed and accessible
- ✅ Database is connected
- ✅ File uploads work
- ✅ Email service works
- ✅ Frontend is updated with new API URL
- ✅ All endpoints tested
- ✅ Monitoring set up

Your backend is now live and ready for production! 🎉
