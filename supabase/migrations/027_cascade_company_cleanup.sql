-- When a profile is deleted, clean up their company if they were the only business owner
-- This prevents orphaned company records when test accounts are deleted

CREATE OR REPLACE FUNCTION cleanup_orphaned_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act if the deleted profile had a company_id
  IF OLD.company_id IS NOT NULL THEN
    -- Check if any other profiles still reference this company
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE company_id = OLD.company_id
      AND id != OLD.id
    ) THEN
      -- No other profiles — delete the orphaned company and all its data
      -- (all child tables have ON DELETE CASCADE from companies)
      DELETE FROM companies WHERE id = OLD.company_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS trg_cleanup_orphaned_company ON profiles;

CREATE TRIGGER trg_cleanup_orphaned_company
  AFTER DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_company();
