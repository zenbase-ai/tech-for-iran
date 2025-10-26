-- Migration: Supabase Auth → Clerk
-- This SQL script updates the Supabase database schema to work with Clerk authentication

-- Step 1: Drop foreign key constraint to Supabase auth.users (if exists)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Update profiles table to store Clerk user IDs
-- Backup existing data first if you have any users!
-- Since user said there are no existing users, we can safely recreate the table

-- Drop existing profiles table and recreate with new schema
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id TEXT PRIMARY KEY, -- Clerk user ID (e.g., user_xxx)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role has full access" ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 3: Remove RPC functions that filter by LinkedIn connection
-- (These are no longer needed since LinkedIn data is in Clerk metadata)
DROP FUNCTION IF EXISTS get_available_squad_members(TEXT, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_random_available_members(TEXT, INTEGER, TEXT, TIMESTAMPTZ);

-- Step 4: Update other tables to use TEXT for user_id references
-- (Assuming you have posts, engagements_log, squad_members tables)

-- Update posts table
ALTER TABLE posts
  ALTER COLUMN author_user_id TYPE TEXT;

-- Update engagements_log table
ALTER TABLE engagements_log
  ALTER COLUMN reactor_user_id TYPE TEXT;

-- Update squad_members table
ALTER TABLE squad_members
  ALTER COLUMN user_id TYPE TEXT;

-- Step 5: Recreate foreign key constraints to profiles table
ALTER TABLE posts
  ADD CONSTRAINT posts_author_user_id_fkey
  FOREIGN KEY (author_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE engagements_log
  ADD CONSTRAINT engagements_log_reactor_user_id_fkey
  FOREIGN KEY (reactor_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE squad_members
  ADD CONSTRAINT squad_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_author_user_id ON posts(author_user_id);
CREATE INDEX IF NOT EXISTS idx_engagements_log_reactor_user_id ON engagements_log(reactor_user_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON squad_members(user_id);

-- Done! Your database is now ready for Clerk authentication.
