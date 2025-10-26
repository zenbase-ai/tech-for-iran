-- Seed initial squad
INSERT INTO squads (name, invite_code)
VALUES ('YC Alumni', 'yc-alumni')
ON CONFLICT (invite_code) DO NOTHING;
