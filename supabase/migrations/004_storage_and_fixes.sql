-- ============================================================
-- Storage & Fixes Migration
-- ============================================================

-- ── Bug 1: Plan Tier Column Verification ────────────────────
-- The companies table column is named "plan" (type plan_tier),
-- NOT "plan_tier". If you manually inserted/updated a company
-- and used "plan_tier" as the column name, it was silently ignored.
--
-- Run this to verify and fix:
--   SELECT id, name, plan FROM companies;
--   UPDATE companies SET plan = 'pro' WHERE id = '<your-company-id>';

-- ── Bug 2: Create logos storage bucket ──────────────────────
-- Migration 003 had this commented out. The upload code in
-- settings/page.tsx targets supabase.storage.from("logos")
-- but fails because the bucket doesn't exist.

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS policies for logos bucket ───────────────────

-- Anyone can read logos (public bucket for brand display)
CREATE POLICY "Public logo read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Contractors and super_admins can upload logos
CREATE POLICY "Contractors upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('contractor', 'super_admin')
  )
);

-- Contractors and super_admins can update their logos
CREATE POLICY "Contractors update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('contractor', 'super_admin')
  )
);

-- Contractors and super_admins can delete their logos
CREATE POLICY "Contractors delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('contractor', 'super_admin')
  )
);
