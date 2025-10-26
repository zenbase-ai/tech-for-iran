-- Create RPC functions for efficient squad member queries

-- Function to get available squad members (not at daily limit)
CREATE OR REPLACE FUNCTION get_available_squad_members(
  p_squad_id UUID,
  p_exclude_user_id UUID DEFAULT NULL,
  p_start_of_today TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  user_id UUID,
  joined_at TIMESTAMPTZ,
  profile_id UUID,
  email TEXT,
  unipile_account_id TEXT,
  linkedin_connected BOOLEAN,
  daily_max_engagements INTEGER,
  today_engagement_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.user_id,
    sm.joined_at,
    p.id AS profile_id,
    p.email,
    p.unipile_account_id,
    p.linkedin_connected,
    p.daily_max_engagements,
    COALESCE(COUNT(el.id), 0) AS today_engagement_count
  FROM squad_members sm
  INNER JOIN profiles p ON p.id = sm.user_id
  LEFT JOIN engagements_log el ON el.reactor_user_id = sm.user_id
    AND el.created_at >= p_start_of_today
  WHERE sm.squad_id = p_squad_id
    AND p.linkedin_connected = TRUE
    AND p.unipile_account_id IS NOT NULL
    AND (p_exclude_user_id IS NULL OR sm.user_id != p_exclude_user_id)
  GROUP BY sm.user_id, sm.joined_at, p.id, p.email, p.unipile_account_id, p.linkedin_connected, p.daily_max_engagements
  HAVING COALESCE(COUNT(el.id), 0) < p.daily_max_engagements;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get random available squad members
CREATE OR REPLACE FUNCTION get_random_available_members(
  p_squad_id UUID,
  p_count INTEGER,
  p_exclude_user_id UUID DEFAULT NULL,
  p_start_of_today TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  user_id UUID,
  joined_at TIMESTAMPTZ,
  profile_id UUID,
  email TEXT,
  unipile_account_id TEXT,
  linkedin_connected BOOLEAN,
  daily_max_engagements INTEGER,
  today_engagement_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.user_id,
    sm.joined_at,
    p.id AS profile_id,
    p.email,
    p.unipile_account_id,
    p.linkedin_connected,
    p.daily_max_engagements,
    COALESCE(COUNT(el.id), 0) AS today_engagement_count
  FROM squad_members sm
  INNER JOIN profiles p ON p.id = sm.user_id
  LEFT JOIN engagements_log el ON el.reactor_user_id = sm.user_id
    AND el.created_at >= p_start_of_today
  WHERE sm.squad_id = p_squad_id
    AND p.linkedin_connected = TRUE
    AND p.unipile_account_id IS NOT NULL
    AND (p_exclude_user_id IS NULL OR sm.user_id != p_exclude_user_id)
  GROUP BY sm.user_id, sm.joined_at, p.id, p.email, p.unipile_account_id, p.linkedin_connected, p.daily_max_engagements
  HAVING COALESCE(COUNT(el.id), 0) < p.daily_max_engagements
  ORDER BY random()
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_available_squad_members TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_random_available_members TO authenticated, service_role;
