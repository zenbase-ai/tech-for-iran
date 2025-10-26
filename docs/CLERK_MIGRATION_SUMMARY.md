# Clerk Migration Summary

## ✅ Completed Changes

The migration from Supabase Auth to Clerk has been completed. Here's what was changed:

### 1. **New Files Created**

#### Authentication & Metadata
- `src/middleware.ts` - Clerk route protection middleware
- `src/lib/clerk/auth.ts` - Clerk authentication helpers (getCurrentUser, requireUser)
- `src/lib/clerk/metadata.ts` - Clerk metadata management for LinkedIn data and user settings

#### Webhooks
- `src/app/api/webhooks/clerk/route.ts` - Webhook handler for syncing Clerk users to Supabase

#### UI Components
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Sign-in page with Clerk UI
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Sign-up page with Clerk UI
- `src/components/ui/user-button.tsx` - User profile button component

#### Documentation & Migration
- `docs/clerk-migration.sql` - SQL script to update Supabase schema
- `docs/MIGRATION_STEPS.md` - Step-by-step migration instructions
- `docs/CLERK_MIGRATION_SUMMARY.md` - This file

### 2. **Modified Files**

#### API Routes
- `src/app/api/auth/linkedin/connect/route.ts` - Updated to use Clerk auth
- `src/app/api/unipile/callback/route.ts` - Updates Clerk metadata instead of Supabase profiles
- `src/app/api/engagements/route.ts` - Updated to use Clerk auth

#### Database Queries
- `src/lib/supabase/queries.ts` - Completely rewritten to integrate with Clerk metadata
  - Removed profile CRUD functions (now handled by Clerk)
  - Updated member filtering to check Clerk metadata for LinkedIn connections
  - Updated daily limit checks to use Clerk metadata

#### Configuration
- `src/lib/env.mjs` - Added Clerk environment variables
- `CLAUDE.md` - Updated documentation to reflect Clerk architecture

### 3. **Deleted Files**
- `src/lib/supabase/auth.ts` - Removed (replaced by Clerk auth helpers)

### 4. **Unchanged Files (Database Only)**
- `src/lib/supabase/server.ts` - Kept for database operations
- `src/lib/supabase/client.ts` - Kept for client-side database queries

---

## 🏗️ Architecture Changes

### Before (Supabase Auth)
```
User Authentication → Supabase Auth
User Data → Supabase profiles table (email, linkedin_connected, unipile_account_id, daily_max)
Database → Supabase PostgreSQL
```

### After (Clerk)
```
User Authentication → Clerk
User Data → Clerk publicMetadata (linkedin, daily_max_engagements)
Minimal Profile → Supabase profiles table (id only, for FK relationships)
Database → Supabase PostgreSQL (relational data only)
```

### Key Architectural Decisions

1. **Single Source of Truth**: Clerk stores all user data including LinkedIn connections
2. **Webhook Sync**: Clerk webhooks create/delete minimal profiles in Supabase for FK integrity
3. **Metadata-First**: All user settings and LinkedIn data stored in Clerk metadata
4. **Application-Layer Filtering**: Squad member filtering happens in application code by checking Clerk metadata

---

## 🔧 Next Steps (Required Before Testing)

### 1. Add Webhook Secret to Environment

Add this to your `.env` file:
```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Get the webhook secret from Clerk Dashboard after setting up the webhook endpoint.

### 2. Run Database Migration

Execute the SQL migration:
```bash
# Option 1: Via Supabase CLI
supabase db execute < docs/clerk-migration.sql

# Option 2: Via Supabase Dashboard
# Copy contents of docs/clerk-migration.sql
# Run in SQL Editor
```

### 3. Configure Clerk Webhook

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to: `user.created`, `user.deleted`
4. Copy the signing secret to `.env`

### 4. Configure Clerk Paths

In Clerk Dashboard → Paths:
- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in: `/` (or your dashboard)
- After sign-up: `/` (or your onboarding)

---

## 📊 Data Flow Examples

### User Sign-Up
1. User signs up via `/sign-up` (Clerk UI)
2. Clerk creates user account
3. Clerk webhook fires → `POST /api/webhooks/clerk`
4. Webhook creates minimal profile in Supabase with Clerk user ID
5. User can now join squads and submit posts

### LinkedIn Connection
1. User requests LinkedIn connection → `POST /api/auth/linkedin/connect`
2. Returns Unipile hosted auth URL
3. User connects LinkedIn via Unipile
4. Unipile webhook → `POST /api/unipile/callback`
5. Updates Clerk metadata: `publicMetadata.linkedin = { unipile_account_id, linkedin_connected: true }`

### Post Submission & Engagement
1. User submits post → `POST /api/engagements`
2. Creates post record in Supabase with Clerk user ID
3. Workflow starts (future implementation)
4. Fetches squad members from Supabase
5. Checks each member's LinkedIn status via Clerk metadata
6. Filters by daily limit (from Clerk metadata)
7. Schedules reactions

---

## 🔍 Testing Checklist

- [ ] Sign up new user at `/sign-up`
- [ ] Verify Clerk webhook creates profile in Supabase
- [ ] Sign in at `/sign-in`
- [ ] Connect LinkedIn account
- [ ] Verify LinkedIn data in Clerk Dashboard → Users → Metadata
- [ ] Submit a post for engagement
- [ ] Verify post created with correct Clerk user ID

---

## 🐛 Troubleshooting

### Webhook Not Creating Profiles
- Check Clerk Dashboard → Webhooks → Recent Events for errors
- Verify `CLERK_WEBHOOK_SECRET` matches the signing secret
- Check server logs for webhook handler errors

### LinkedIn Connection Not Saving
- Check Clerk Dashboard → Users → Metadata tab
- Verify `publicMetadata.linkedin` object exists
- Check Unipile webhook logs

### Authentication Errors
- Verify `CLERK_SECRET_KEY` is set correctly
- Check middleware is protecting the correct routes
- Ensure user is signed in (check `<UserButton />` in UI)

---

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Webhooks Guide](https://clerk.com/docs/integrations/webhooks)
- [Clerk Metadata Guide](https://clerk.com/docs/users/metadata)
- Migration Steps: `docs/MIGRATION_STEPS.md`
- Database Schema: `docs/clerk-migration.sql`
