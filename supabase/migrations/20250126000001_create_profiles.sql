-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  unipile_account_id TEXT UNIQUE,
  linkedin_connected BOOLEAN DEFAULT FALSE,
  daily_max_engagements INTEGER DEFAULT 40 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do everything (for backend workflows)
CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
