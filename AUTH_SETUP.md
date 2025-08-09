# Apple & Google OAuth Setup Guide

## Overview

This implementation provides Apple and Google OAuth authentication for your e-commerce API.

## Setup Instructions

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
6. Copy Client ID and Client Secret to your `.env` file

### 2. Apple OAuth Setup

1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create an App ID with Sign In with Apple capability
3. Create a Services ID for web authentication
4. Generate a private key for Sign In with Apple
5. Configure your domain and redirect URLs:
   - `http://localhost:3001/auth/apple/callback` (development)
   - `https://yourdomain.com/auth/apple/callback` (production)
6. Add the credentials to your `.env` file

### 3. Environment Variables

Update your `.env` file with the following:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_APPLE_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----
```

## API Endpoints

### Authentication Routes

#### Google OAuth

- **GET** `/auth/google` - Initiate Google OAuth
- **GET** `/auth/google/callback` - Google OAuth callback

#### Apple OAuth

- **GET** `/auth/apple` - Initiate Apple OAuth
- **POST** `/auth/apple/callback` - Apple OAuth callback

#### Token Management

- **POST** `/auth/verify-token` - Verify JWT token
- **GET** `/auth/profile` - Get user profile (requires Bearer token)

## Usage Examples

### Frontend Integration

#### Google Login Button

```html
<a href="http://localhost:3001/auth/google">
  <button>Sign in with Google</button>
</a>
```

#### Apple Login Button

```html
<a href="http://localhost:3001/auth/apple">
  <button>Sign in with Apple</button>
</a>
```

### Token Verification

```javascript
// Verify token
fetch("/auth/verify-token", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ token: "your-jwt-token" }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Protected Route Access

```javascript
// Access protected route
fetch("/auth/profile", {
  headers: {
    Authorization: "Bearer your-jwt-token",
  },
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## User Model Updates

The user model now supports:

- `googleId` - Google user identifier
- `appleId` - Apple user identifier
- `provider` - Authentication provider ('local', 'google', 'apple')
- Optional `password` and `phone` fields for social logins

## Security Notes

1. Always use HTTPS in production
2. Keep your JWT secret secure and rotate it regularly
3. Set appropriate CORS origins instead of '\*'
4. Implement rate limiting for authentication endpoints
5. Consider implementing refresh tokens for better security

## Error Handling

The system handles:

- Existing users linking social accounts
- New user creation via social login
- Token validation and expiration
- Missing or invalid credentials

## Testing

1. Start your server: `npm start`
2. Navigate to `http://localhost:3001/auth/google` to test Google login
3. Navigate to `http://localhost:3001/auth/apple` to test Apple login
4. Check the redirect URLs match your frontend application
