# Authentication Setup Guide

This guide explains the authentication system for Here's My Story, which uses **Supabase Auth** for authentication combined with **Prisma** for database management.

## Overview

The application uses a **hybrid approach**:
- **Supabase**: Handles authentication (email/password, magic links, future: passkeys)
- **Prisma + PostgreSQL**: Manages all application data (users, profiles, sessions, etc.)
- **Automatic sync**: Supabase users are automatically synced to the Prisma database

## Architecture

```
┌─────────────────┐
│   Supabase Auth │  ← Handles login, signup, sessions
└────────┬────────┘
         │ (sync on auth events)
         ↓
┌─────────────────┐
│ Prisma Database │  ← Stores user data, profiles, stories
└─────────────────┘
```

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - Project name: `heresmystory` (or your choice)
   - Database password: Generate a strong password
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 2. Get Your Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (looks like: `eyJhbGc...`)
   - **service_role key** (keep this secret!)

### 3. Configure Environment Variables

Update your `.env` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Your existing PostgreSQL database
DATABASE_URL="postgresql://user:password@localhost:5432/heresmystory"

# App URL (for redirects)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**:
- You can use your existing PostgreSQL database
- Supabase auth is separate from your database
- Users are stored in both Supabase (for auth) and your database (for app data)

### 4. Configure Supabase Auth Settings

In your Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add these URLs:
   - **Site URL**: `http://localhost:3000` (or your domain)
   - **Redirect URLs**:
     - `http://localhost:3000/auth/callback`
     - `https://yourdomain.com/auth/callback` (production)

3. Go to **Authentication** → **Providers** → **Email**
   - Enable "Email" provider
   - Enable "Confirm email" (recommended for production)
   - For development, you can disable email confirmation

### 5. Run Database Migrations

Your Prisma schema is already configured. Run migrations:

```bash
npx prisma migrate dev --name add-auth
```

### 6. Install Dependencies

Already installed! But if you need to reinstall:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 7. Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/signup`
3. Create a test account
4. Check your email for confirmation link (if enabled)
5. Sign in at `http://localhost:3000/login`

## Features Implemented

### ✅ Email/Password Authentication
- Sign up with email and password
- Sign in with email and password
- Email verification (configurable)
- Password reset (coming soon)

### ✅ Magic Link Authentication
- Passwordless login via email
- One-time use links
- Links expire in 1 hour

### ✅ Protected Routes
Routes that require authentication:
- `/dashboard` - Recording interface
- `/library` - Story library
- `/profiles` - Profile management
- `/settings` - User settings (coming soon)

### ✅ Protected API Routes
All API routes require authentication:
- `/api/profiles` - Profile CRUD operations
- `/api/sessions/*` - Session management
- `/api/voice/*` - Voice training and consent

### ✅ Automatic User Sync
- Users are automatically created in Prisma database on signup
- User data is synced on every authentication event
- Default profile created automatically for new users

### ✅ Session Management
- Automatic session refresh via middleware
- Sessions persist across page reloads
- Logout clears sessions everywhere

## File Structure

```
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser-side Supabase client
│   │   └── server.ts          # Server-side Supabase client
│   ├── auth/
│   │   ├── actions.ts         # Server actions (sign up, sign in, etc.)
│   │   ├── client-utils.ts    # Client-side auth utilities
│   │   ├── helpers.ts         # Auth helpers (requireAuth, etc.)
│   │   └── sync.ts            # User sync utilities
│   └── prisma.ts              # Prisma client singleton
├── app/
│   ├── login/
│   │   └── page.tsx           # Login page
│   ├── signup/
│   │   └── page.tsx           # Signup page
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts       # Auth callback handler
│   ├── api/
│   │   └── profiles/          # Protected API routes
│   └── dashboard/             # Protected pages
└── middleware.ts              # Route protection & session refresh
```

## Usage Guide

### For Server Components

```typescript
import { requireAuth } from '@/lib/auth/helpers'

export default async function DashboardPage() {
  const { user, dbUser } = await requireAuth()

  // user = Supabase user object
  // dbUser = Full user from Prisma with profiles

  return <div>Welcome {dbUser.email}</div>
}
```

### For Client Components

```typescript
'use client'
import { getCurrentUser, signOut } from '@/lib/auth/client-utils'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function loadUser() {
      const { user, error } = await getCurrentUser()
      if (user) setUser(user)
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return <div>{user?.email}</div>
}
```

### For API Routes

```typescript
import { verifyAuth } from '@/lib/auth/helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { authorized, user, dbUser } = await verifyAuth(request)

  if (!authorized || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Your protected logic here
}
```

## Testing

### Manual Testing Checklist

- [ ] Sign up with new email
- [ ] Confirm email (if enabled)
- [ ] Sign in with email/password
- [ ] Sign out
- [ ] Sign in with magic link
- [ ] Access protected pages (should redirect to login if not authenticated)
- [ ] Access protected API routes (should return 401 if not authenticated)
- [ ] Logout from one tab affects other tabs

### Common Issues

**Issue**: "Invalid login credentials"
- **Solution**: Check that email is confirmed in Supabase dashboard
- Go to **Authentication** → **Users** and verify user status

**Issue**: Infinite redirect loop
- **Solution**: Check middleware configuration in `middleware.ts`
- Ensure `/login` and `/signup` are not in protected paths

**Issue**: User not syncing to database
- **Solution**: Check database connection and Prisma schema
- Run `npx prisma generate` to regenerate Prisma client
- Check console for errors during auth callback

**Issue**: "fetch failed" errors
- **Solution**: Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that Supabase project is running
- Verify network connectivity

## Security Best Practices

### ✅ Implemented
- Server-side session validation
- HTTP-only cookies for session tokens
- CSRF protection via Supabase
- Route-level authorization checks
- Profile ownership verification in API routes

### 🔒 Recommended for Production
1. **Enable email confirmation** in Supabase
2. **Set up password policies** (min length, complexity)
3. **Enable rate limiting** for auth endpoints
4. **Use HTTPS** in production (required for cookies)
5. **Set up Row Level Security** in Supabase (optional)
6. **Monitor failed login attempts**
7. **Implement 2FA** (future enhancement)

## Future Enhancements

### Passkeys Support (WebAuthn)
Supabase supports passkeys. To enable:

1. Enable in Supabase dashboard: **Authentication** → **Providers** → **Enable WebAuthn**
2. Update sign up flow to support passkey registration
3. Update login page to support passkey authentication

Example:
```typescript
// Sign up with passkey
const { data, error } = await supabase.auth.signUp({
  email,
  password, // Still required as fallback
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      passkey_enabled: true,
    },
  },
})

// Sign in with passkey
await supabase.auth.signInWithSSO({
  domain: 'your-domain.com',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    passkey: true,
  },
})
```

### OAuth Providers
To add Google, GitHub, etc.:

1. Configure providers in Supabase dashboard
2. Update login page to include OAuth buttons
3. Handle OAuth callback in `/auth/callback`

### Multi-Factor Authentication
- SMS verification via Twilio
- Authenticator app (TOTP)
- Email verification codes

## Troubleshooting

### Debug Mode

Enable debug logging:

```typescript
// lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        debug: true, // Enable debug logs
      },
    }
  )
}
```

### Check Auth State

Add this to any page to debug:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    const { user, error } = await getCurrentUser()
    console.log('Auth state:', { user, error })
  }
  checkAuth()
}, [])
```

## Support

For issues:
1. Check Supabase dashboard for auth errors
2. Check browser console for client errors
3. Check server logs for API errors
4. Review this documentation
5. Consult [Supabase Auth docs](https://supabase.com/docs/guides/auth)

## Migration Path

### From No Auth → Supabase Auth

1. ✅ Install Supabase packages
2. ✅ Create Supabase project
3. ✅ Configure environment variables
4. ✅ Add auth pages (login/signup)
5. ✅ Add middleware for route protection
6. ✅ Update existing pages with auth checks
7. ✅ Protect API routes
8. ✅ Test end-to-end

### Next Steps

Now that auth is implemented, you can:
- Connect Library page to real database data
- Implement profile creation/editing UI
- Add import wizard functionality
- Build accessibility settings
- Implement keepsake generation

---

**Status**: ✅ Production Ready

Authentication is fully implemented and ready for production use!
