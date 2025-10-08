#!/bin/bash
# Cleanup script to remove non-essential files from online_store_api
# Run this from /.../online_store_api root: bash ./scripts/cleanup_unwanted.sh
set -e

echo "This script WILL delete files. Make sure you have committed or backed up any files you may need."
read -p "Continue? (type YES to proceed): " confirm
if [ "$confirm" != "YES" ]; then
  echo "Aborted by user."
  exit 1
fi

# Files and patterns to remove
rm_files=(
  ".env"
  ".env.production"
  "server.log"
  "deploy.sh"
  "install-nodemailer.sh"
  "setup-email-quick.js"
  "setup-production.js"
  "deploy.sh"
  "check-email-config.js"
  "uploadFile.js"
  "test-deployment.js"
  "test-email.js"
  "test-forgot-password.js"
  "test-password.js"
  "test-verification.js"
  "test-connection.js"
  "README.md"
  "DEPLOYMENT.md"
  "DEPLOYMENT_CHECKLIST.md"
  "DEPLOYMENT_SUMMARY.md"
  "DEPLOYMENT_SUMMARY.md"
  "EMAIL_SETUP.md"
  "AUTH_SETUP.md"
  "MONGODB_FIX.md"
  "PRODUCTION_READY.md"
)

echo "Removing specific files..."
for f in "${rm_files[@]}"; do
  if [ -e "$f" ]; then
    echo "Removing $f"
    rm -rf "$f"
  else
    echo "Not found: $f"
  fi
done

# Optionally remove node_modules
read -p "Remove node_modules? (y/N): " rm_nm
if [[ "$rm_nm" =~ ^[Yy]$ ]]; then
  echo "Removing node_modules/"
  rm -rf node_modules/
fi

# Optionally remove public/ if present
read -p "Remove public/ directory? (y/N): " rm_pub
if [[ "$rm_pub" =~ ^[Yy]$ ]]; then
  echo "Removing public/"
  rm -rf public/
fi

# Done

echo "Cleanup complete. Run 'git status' to review changes and commit if desired." 
