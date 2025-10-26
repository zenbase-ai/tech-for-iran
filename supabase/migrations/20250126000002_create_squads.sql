-- Create squads table
CREATE TABLE squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read squads (for now, single global squad)
CREATE POLICY "Anyone can read squads"
  ON squads FOR SELECT
  TO authenticated
  USING (true);

-- Service role can do everything (for backend workflows)
CREATE POLICY "Service role full access"
  ON squads FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
