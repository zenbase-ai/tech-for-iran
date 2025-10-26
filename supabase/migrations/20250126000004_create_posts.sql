-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  post_url TEXT NOT NULL,
  post_urn TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  UNIQUE(post_url, squad_id) -- Prevent duplicate submissions
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can read posts from their squads
CREATE POLICY "Users can read squad posts"
  ON posts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM squad_members
    WHERE squad_members.user_id = auth.uid()
    AND squad_members.squad_id = posts.squad_id
  ));

-- Users can insert their own posts
CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_user_id);

-- Service role can do everything (for backend workflows)
CREATE POLICY "Service role full access"
  ON posts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
