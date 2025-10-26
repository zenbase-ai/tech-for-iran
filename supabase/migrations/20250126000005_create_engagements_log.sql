-- Create engagements_log table
CREATE TABLE engagements_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reactor_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- 'LIKE', 'CELEBRATE', 'SUPPORT', 'LOVE', 'INSIGHTFUL', 'FUNNY'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, reactor_user_id) -- One reaction per user per post
);

-- Enable RLS
ALTER TABLE engagements_log ENABLE ROW LEVEL SECURITY;

-- Users can read engagements on posts from their squads
CREATE POLICY "Users can read squad engagements"
  ON engagements_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM posts
    JOIN squad_members ON posts.squad_id = squad_members.squad_id
    WHERE posts.id = engagements_log.post_id
    AND squad_members.user_id = auth.uid()
  ));

-- Service role can do everything (for backend workflows)
CREATE POLICY "Service role full access"
  ON engagements_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
