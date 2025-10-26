-- Create indexes for better query performance

-- Index for looking up users by Unipile account ID
CREATE INDEX idx_profiles_unipile_account_id ON profiles(unipile_account_id);

-- Index for engagements_log queries (daily limit checks)
CREATE INDEX idx_engagements_log_reactor_created ON engagements_log(reactor_user_id, created_at);

-- Index for post lookups
CREATE INDEX idx_posts_author_squad ON posts(author_user_id, squad_id);
CREATE INDEX idx_posts_url ON posts(post_url);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_squad_id ON posts(squad_id);
