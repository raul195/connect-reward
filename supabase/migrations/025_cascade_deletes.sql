-- Fix all foreign keys referencing profiles(id) to cascade on delete
-- This prevents errors when deleting test accounts

-- customer_imports.created_by
ALTER TABLE customer_imports
  DROP CONSTRAINT IF EXISTS customer_imports_created_by_fkey,
  ADD CONSTRAINT customer_imports_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- import_rows.profile_id
ALTER TABLE import_rows
  DROP CONSTRAINT IF EXISTS import_rows_profile_id_fkey,
  ADD CONSTRAINT import_rows_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- email_send_log.recipient_id
ALTER TABLE email_send_log
  DROP CONSTRAINT IF EXISTS email_send_log_recipient_id_fkey,
  ADD CONSTRAINT email_send_log_recipient_id_fkey
    FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- support_tickets.profile_id
ALTER TABLE support_tickets
  DROP CONSTRAINT IF EXISTS support_tickets_profile_id_fkey,
  ADD CONSTRAINT support_tickets_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
