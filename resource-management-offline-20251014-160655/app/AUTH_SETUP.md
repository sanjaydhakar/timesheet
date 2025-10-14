# Authentication Setup Guide

This document explains the authentication system implementation in the Resource Management Tool.

## 🔐 Overview

The application now includes a complete authentication system with:
- User registration and login
- JWT-based authentication
- User-isolated data (each user sees only their own data)
- Protected API routes
- Logout functionality

## 📦 What Was Added

### Backend Changes

#### 1. Database Schema
- **New `users` table**: Stores user credentials and profile information
  - `id`: UUID primary key
  - `email`: Unique email address
  - `password_hash`: Bcrypt hashed password
  - `name`: User's full name
  - `created_at`, `updated_at`: Timestamps

- **Added `user_id` columns** to all existing tables:
  - `developers` table
  - `projects` table
  - `allocations` table
  - All records now belong to a specific user

#### 2. Authentication Routes (`/api/auth`)
- **POST /api/auth/register**: Create new user account
  - Validates email uniqueness
  - Hashes password with bcrypt
  - Returns JWT token and user info

- **POST /api/auth/login**: Authenticate existing user
  - Validates credentials
  - Returns JWT token and user info

- **GET /api/auth/me**: Get current user info
  - Requires authentication
  - Returns user profile

#### 3. Authentication Middleware
- **`authenticateToken`**: Middleware that validates JWT tokens
  - Extracts token from `Authorization: Bearer <token>` header
  - Verifies token signature
  - Attaches `userId` to request object
  - Returns 401/403 for invalid/missing tokens

#### 4. Protected API Routes
All existing API routes now:
- Require authentication (JWT token)
- Filter data by `user_id`
- Automatically add `user_id` when creating records

### Frontend Changes

#### 1. Authentication Context (`src/contexts/AuthContext.tsx`)
- Manages authentication state
- Handles login/register/logout
- Stores token and user in localStorage
- Provides hooks for authentication state

#### 2. Login Component (`src/components/Login.tsx`)
- Beautiful login form with gradient design
- Email and password validation
- Error handling
- Switch to register view

#### 3. Register Component (`src/components/Register.tsx`)
- Registration form with name, email, password fields
- Password confirmation
- Password strength validation (min 6 characters)
- Error handling
- Switch to login view

#### 4. Updated API Client (`src/services/api.ts`)
- Added `getAuthHeaders()` function
- Automatically includes `Authorization` header in all requests
- Reads token from localStorage

#### 5. Updated App Component (`src/App.tsx`)
- Wraps app with `AuthProvider`
- Shows login/register when not authenticated
- Shows main app when authenticated
- Added logout button in header
- Displays user name and email

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
cd server
npm run build
psql -d resource_management -f src/database/add_authentication.sql
```

This creates the `users` table and adds `user_id` columns to all existing tables.

### 2. Set JWT Secret

Create or update `server/.env`:

```env
JWT_SECRET=your-secure-random-secret-key-at-least-32-chars
PORT=3001
# ... other database config
```

**Important**: Use a strong, random secret in production!

### 3. Start the Server

```bash
cd server
npm run dev
```

### 4. Start the Frontend

```bash
npm run dev
```

## 📝 Usage

### First Time Setup

1. Navigate to `http://localhost:5173`
2. Click "Don't have an account? Sign up"
3. Fill in your name, email, and password
4. Click "Sign up"
5. You'll be automatically logged in

### Logging In

1. Navigate to `http://localhost:5173`
2. Enter your email and password
3. Click "Sign in"

### Logging Out

1. Click the logout button (🚪) in the top-right corner
2. You'll be redirected to the login page

## 🔒 Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds
- Plain passwords are never stored in the database
- Password must be at least 6 characters

### Token Security
- JWT tokens expire after 7 days
- Tokens are stored in localStorage
- Tokens are automatically included in all API requests
- Invalid tokens result in 401/403 errors

### Data Isolation
- Each user can only see their own data
- All database queries filter by `user_id`
- User cannot access another user's:
  - Developers
  - Projects
  - Allocations

## 🎯 API Changes

### Authentication Required
All existing API endpoints now require authentication:

```javascript
// Before (no auth needed)
fetch('http://localhost:3001/api/developers')

// After (auth token required)
fetch('http://localhost:3001/api/developers', {
  headers: {
    'Authorization': 'Bearer <token>'
  }
})
```

### New Authentication Endpoints

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}

Response: {
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepass123"
}

Response: {
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: {
  "id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

## 🛠️ Technical Details

### JWT Token Structure
```json
{
  "userId": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Database Constraints
- Email must be unique across all users
- All `user_id` foreign keys cascade on delete
- Deleting a user automatically deletes all their data

### Frontend State Management
- Authentication state managed by `AuthContext`
- User and token cached in localStorage
- Automatic rehydration on page reload
- Logout clears all authentication data

## 🐛 Troubleshooting

### "Invalid or expired token" Error
- Token has expired (7 days)
- Token was tampered with
- JWT secret changed on server
- **Solution**: Logout and login again

### "Access token required" Error
- No token in request
- Token not stored correctly
- **Solution**: Check localStorage for `auth_token`

### Can't Login with Existing Data
- Old data doesn't have `user_id`
- **Solution**: Run migration to add `user_id` columns

### Server Error After Migration
- Server not rebuilt after code changes
- **Solution**: Run `npm run build` in server directory

## 📚 Code References

### Backend Files
- `server/src/database/add_authentication.sql` - Migration
- `server/src/middleware/auth.ts` - Auth middleware
- `server/src/routes/auth.ts` - Auth endpoints
- `server/src/routes/developers.ts` - Updated for auth
- `server/src/routes/projects.ts` - Updated for auth
- `server/src/routes/allocations.ts` - Updated for auth

### Frontend Files
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/components/Login.tsx` - Login UI
- `src/components/Register.tsx` - Register UI
- `src/services/api.ts` - API client with auth headers
- `src/App.tsx` - Auth-protected app shell

## 🎨 UI/UX Features

- Beautiful gradient backgrounds
- Smooth transitions and animations
- Responsive design for mobile and desktop
- Loading states during authentication
- Clear error messages
- User info display in header
- Easy access logout button

## 🚦 Next Steps

### Recommended Enhancements
1. **Email Verification**: Send verification emails after registration
2. **Password Reset**: Add forgot password functionality
3. **Session Management**: Add ability to view/revoke active sessions
4. **Two-Factor Authentication**: Add 2FA for extra security
5. **OAuth Integration**: Add Google/GitHub login
6. **Password Strength Meter**: Visual password strength indicator
7. **Remember Me**: Longer session duration option
8. **Account Settings**: Change password, email, name
9. **Admin Roles**: Add role-based access control
10. **Audit Logs**: Track login history and user actions

---

**Last Updated**: October 14, 2025
**Version**: 1.0.0

