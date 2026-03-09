CREATE TABLE custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('friendly', 'professional', 'motivational')),
  variation_index INTEGER NOT NULL CHECK (variation_index >= 0 AND variation_index <= 2),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, trigger_type, tone, variation_index)
);

-- RLS
ALTER TABLE custom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their custom templates"
  ON custom_templates
  FOR ALL
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));
