-- Beta Program membership tracking
-- Users with active licenses can join the beta program to get early access to features.
-- Membership grants the "insider" Discord role if Discord is connected.

CREATE TABLE IF NOT EXISTS beta_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  
  -- Track if user left and when (soft delete for historical tracking)
  left_at timestamptz,
  
  -- Unique constraint ensures one active membership per user
  CONSTRAINT beta_members_user_unique UNIQUE (user_id)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS beta_members_user_id_idx ON beta_members (user_id);

-- Index for counting active members
CREATE INDEX IF NOT EXISTS beta_members_active_idx ON beta_members (joined_at) 
  WHERE left_at IS NULL;

-- RLS policies
ALTER TABLE beta_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own membership
CREATE POLICY "Users can view own beta membership"
  ON beta_members FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (via API routes)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated roles
