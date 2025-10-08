Vercel deployment instructions for the online_store_api

Summary

- This project exposes an Express app located at the repository root (`index.js`).
- For Vercel, a serverless wrapper is provided at `api/index.js` which wraps the Express app using `serverless-http`.

Environment variables (required)

- MONGO_URL: MongoDB connection string (use a managed MongoDB like Atlas)
- NODE_ENV: production
- CORS_ORIGIN: Allowed origin for CORS (optional)
- CLOUDINARY*URL or CLOUDINARY*\*: if using Cloudinary
- SMTP\_\*: If using email features (see your project's email config files)
- STRIPE_SECRET_KEY: If using Stripe payments
- ONESIGNAL\_\*: If using OneSignal

How to deploy

1. Install dependencies locally and commit changes (optional):
   npm install
2. Push to a git branch connected to Vercel or import the repository in the Vercel dashboard.
3. In the Vercel project settings, set the environment variables listed above.
4. Deploy. Vercel will run the serverless function at `api/index.js`.

Notes and limitations

- Serverless functions have execution time limits. Long-running background schedulers may not work as expected. The code attempts to enable schedulers only when MONGO is connected and in production, but serverless function instances are ephemeral. Consider moving cron jobs to background workers or Vercel Cron Triggers.
- If you need a persistent server, consider deploying to a platform that supports long-running processes (e.g., DigitalOcean, Heroku, Render).

Testing after deploy

- Open the Vercel deployment URL and call `/health` to confirm the app can connect to MongoDB and is healthy.
- Monitor logs in the Vercel dashboard.

Troubleshooting

- If you see DB connection errors: verify `MONGO_URL` and network access (IP whitelist) for the DB.
- For long-running tasks: remove or migrate schedulers to a separate service.
