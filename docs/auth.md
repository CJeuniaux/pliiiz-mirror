# Authentication Flow

## Environment Variables

Add the following to your `.env` file:

```env
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

This variable is used for authentication redirects.

## Authentication Callback

The app handles authentication callbacks at `/auth/callback`. This page:

1. Reads the URL fragment (`#access_token`, `#refresh_token`)
2. Sets the session using `supabase.auth.setSession()`
3. Redirects to the main page

## Supabase Auth Configuration

In your Supabase dashboard, configure:

- **Site URL**: `https://your-domain.com`
- **Additional Redirect URLs**: `https://your-domain.com/auth/callback`

## Testing

1. Sign up with a new email
2. Check your email for the confirmation link
3. Click the link - you should be redirected and logged in
4. Session should persist on page refresh