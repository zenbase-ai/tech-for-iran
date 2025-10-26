# Clerk Migration Steps

This document outlines the steps needed to complete the migration from Supabase Auth to Clerk.

## 1. Environment Variables

Add the following environment variable to your `.env` file:

```bash
# Clerk Webhook Secret
# Get this from Clerk Dashboard > Webhooks > Add Endpoint
# The webhook URL should be: https://your-domain.com/api/webhooks/clerk
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Your `.env` file should already have these Clerk variables (already present):
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## 2. Database Migration

Run the SQL migration script to update your Supabase database schema:

```bash
# Option 1: Run via Supabase CLI
supabase db execute < docs/clerk-migration.sql

# Option 2: Copy the contents of docs/clerk-migration.sql and run in Supabase Dashboard
# Navigate to: SQL Editor > New Query > Paste and Run
```

**Important:** This will recreate the `profiles` table and update foreign key constraints. Since you mentioned there are no existing users, this is safe to run.

## 3. Configure Clerk Webhook

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to **Webhooks** section
3. Click **Add Endpoint**
4. Enter your webhook URL: `https://your-domain.com/api/webhooks/clerk`
   - For local development: Use a tunnel service like ngrok
5. Subscribe to these events:
   - `user.created`
   - `user.deleted`
6. Copy the **Signing Secret** (starts with `whsec_`)
7. Add it to your `.env` file as `CLERK_WEBHOOK_SECRET`

## 4. Configure Clerk Sign-In/Sign-Up URLs

In your Clerk Dashboard, configure the following paths:

1. Navigate to **Paths** section
2. Set **Sign-in URL**: `/sign-in`
3. Set **Sign-up URL**: `/sign-up`
4. Set **After sign-in URL**: `/` (or your dashboard URL)
5. Set **After sign-up URL**: `/` (or your onboarding URL)

## 5. Install Dependencies (if needed)

The following Clerk dependencies should already be installed:
- `@clerk/nextjs`
- `svix` (for webhook signature verification)

If not, run:
```bash
bun add @clerk/nextjs svix
```

## 6. Optional: Remove Unused Supabase Auth Dependencies

You can optionally remove `@supabase/ssr` if it's no longer needed:

```bash
bun remove @supabase/ssr
```

Keep `@supabase/supabase-js` as it's still used for database operations.

## 7. Test the Migration

1. **Test Sign-Up Flow:**
   - Navigate to `/sign-up`
   - Create a new account
   - Verify webhook creates profile in Supabase
   - Check Supabase Dashboard > `profiles` table for new record

2. **Test LinkedIn Connection:**
   - Sign in to your account
   - Navigate to LinkedIn connection page
   - Complete OAuth flow
   - Verify Clerk metadata is updated (Clerk Dashboard > Users > Metadata)

3. **Test Post Submission:**
   - Submit a LinkedIn post for engagement
   - Verify post is created with correct `author_user_id` (Clerk user ID)

## 8. Production Checklist

Before deploying to production:

- [ ] Clerk webhook endpoint is configured and verified
- [ ] `CLERK_WEBHOOK_SECRET` is set in production environment
- [ ] Database migration has been run successfully
- [ ] Sign-in/sign-up flows are tested
- [ ] LinkedIn connection flow is tested
- [ ] Post submission flow is tested
- [ ] Clerk Dashboard paths are configured correctly

## Troubleshooting

### Webhook Not Working
- Verify webhook URL is publicly accessible
- Check webhook signature is being validated correctly
- Check Clerk Dashboard > Webhooks > Endpoint > Recent Events for errors

### "Authentication required" Error
- Ensure Clerk middleware is protecting the correct routes
- Verify `CLERK_SECRET_KEY` is set correctly
- Check that user is signed in (use `<UserButton />` to verify)

### Database Errors
- Verify migration SQL ran successfully
- Check that `profiles` table has `id` column as TEXT type
- Verify foreign key constraints are set up correctly

### LinkedIn Connection Not Saving
- Check Clerk Dashboard > Users > select user > Metadata
- Verify `publicMetadata.linkedin` object exists
- Check browser console and server logs for errors
