-- Create squad_members table (join table)
CREATE TABLE squad_members (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, squad_id)
);

-- Enable RLS
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;

-- Members can read their own memberships
CREATE POLICY "Users can read own memberships"
  ON squad_members FOR SELECT
  USING (auth.uid() = user_id);

-- Users can join squads (insert their own membership)
CREATE POLICY "Users can join squads"
  ON squad_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for backend workflows)
CREATE POLICY "Service role full access"
  ON squad_members FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
