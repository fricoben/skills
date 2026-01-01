-- Add RLS policies for AsyncAnticheat tables
-- Admins: read + write access
-- Managers: read access only

-- ═══════════════════════════════════════════════════════════════════════════
-- SERVERS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS if not already enabled
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

-- Admins can view all servers
CREATE POLICY "Admins can view all servers"
  ON servers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update servers
CREATE POLICY "Admins can update servers"
  ON servers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Managers can view all servers
CREATE POLICY "Managers can view all servers"
  ON servers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- SERVER_MODULES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS if not already enabled
ALTER TABLE server_modules ENABLE ROW LEVEL SECURITY;

-- Admins can view all server modules
CREATE POLICY "Admins can view all server modules"
  ON server_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update server modules
CREATE POLICY "Admins can update server modules"
  ON server_modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Managers can view all server modules
CREATE POLICY "Managers can view all server modules"
  ON server_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- PLAYERS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS if not already enabled
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Admins can view all players
CREATE POLICY "Admins can view all players"
  ON players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Managers can view all players
CREATE POLICY "Managers can view all players"
  ON players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- FINDINGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS if not already enabled
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

-- Admins can view all findings
CREATE POLICY "Admins can view all findings"
  ON findings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update findings
CREATE POLICY "Admins can update findings"
  ON findings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Managers can view all findings
CREATE POLICY "Managers can view all findings"
  ON findings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- BATCH_INDEX TABLE
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS if not already enabled
ALTER TABLE batch_index ENABLE ROW LEVEL SECURITY;

-- Admins can view all batch logs
CREATE POLICY "Admins can view all batch logs"
  ON batch_index FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Managers can view all batch logs
CREATE POLICY "Managers can view all batch logs"
  ON batch_index FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );
