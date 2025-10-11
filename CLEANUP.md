This repository has been slimmed down via a cleanup script `scripts/cleanup_unwanted.sh`.

What the script removes (when you confirm):

- Sensitive env files: `.env`, `.env.production`
- Log files: `server.log`
- Deployment helpers: `deploy.sh`, `setup-production.js`, `deploy scripts`
- Email/setup utilities: `install-nodemailer.sh`, `setup-email-quick.js`, `check-email-config.js`
- Upload helper: `uploadFile.js`
- Various test scripts starting with `test-*.js`
- Documentation files: `README.md`, `DEPLOYMENT*.md`, `EMAIL_SETUP.md`, `AUTH_SETUP.md`, `PRODUCTION_READY.md`, `MONGODB_FIX.md`
- Optionally: `node_modules/` and `public/`

Restoring files:

- If you remove a file accidentally, you can restore it from git: `git checkout -- <path>` or `git restore <path>` or `git checkout HEAD -- <path>`.
- To recover files removed from history, you'll need to fetch them from a remote or another branch.

Safety:

- The script asks for confirmation before proceeding and will not run unless you type `YES` and then answer prompts for optional removals.

Use-case:

- Use this script to prepare the repository for deployment or sharing without secrets and extra docs.
