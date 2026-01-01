-- Add RLS policies for admin and manager access to beta_members and report tables
-- Admins and Managers can view and update all records

-- Beta members: Allow admins to view all members
CREATE POLICY "Admins can view all beta members"
  ON beta_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Beta members: Allow admins to update (reactivate/remove)
CREATE POLICY "Admins can update beta members"
  ON beta_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Beta members: Allow managers to view all members
CREATE POLICY "Managers can view all beta members"
  ON beta_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Beta members: Allow managers to update
CREATE POLICY "Managers can update beta members"
  ON beta_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- False positive reports: Allow admins to view all
CREATE POLICY "Admins can view all false positive reports"
  ON false_positive_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- False positive reports: Allow admins to update status
CREATE POLICY "Admins can update false positive reports"
  ON false_positive_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- False positive reports: Allow managers to view all
CREATE POLICY "Managers can view all false positive reports"
  ON false_positive_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- False positive reports: Allow managers to update status
CREATE POLICY "Managers can update false positive reports"
  ON false_positive_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Undetected cheat reports: Allow admins to view all
CREATE POLICY "Admins can view all undetected cheat reports"
  ON undetected_cheat_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Undetected cheat reports: Allow admins to update status
CREATE POLICY "Admins can update undetected cheat reports"
  ON undetected_cheat_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Undetected cheat reports: Allow managers to view all
CREATE POLICY "Managers can view all undetected cheat reports"
  ON undetected_cheat_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Undetected cheat reports: Allow managers to update status
CREATE POLICY "Managers can update undetected cheat reports"
  ON undetected_cheat_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );
