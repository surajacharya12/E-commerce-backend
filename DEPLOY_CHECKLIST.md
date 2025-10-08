Deployment checklist for Vercel

1. Environment Variables

- MONGO_URL (required)
- NODE_ENV=production
- CORS_ORIGIN (optional)
- CLOUDINARY\_\* (if using Cloudinary)
- SMTP\_\* (if using email sending)
- STRIPE_SECRET_KEY (if using Stripe)
- ONESIGNAL\_\* (if using OneSignal)

2. Verify `vercel.json` and `api/index.js` exist at the repository root or inside this folder.

3. Verify all dependencies are in `package.json` and run `npm install` before testing locally.

4. After deploy, check:

- /health endpoint
- Vercel function logs
- Database connection status in logs

5. If using scheduled tasks, consider Vercel Cron Triggers or a separate worker service.
