# Email Configuration for Forgot Password

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:

   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Add to .env file**:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Alternative Email Services

### Outlook/Hotmail

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Custom SMTP

```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## Testing

Run the server and test the forgot password flow:

1. POST `/auth/forgot-password` with email
2. Check email for verification code
3. POST `/auth/verify-reset-code` with email and code
4. POST `/auth/reset-password` with email, code, and new password

## Security Notes

- Verification codes expire in 5 minutes
- Maximum 3 attempts per code
- Codes are stored in memory (use Redis in production)
- All passwords are hashed with bcrypt
