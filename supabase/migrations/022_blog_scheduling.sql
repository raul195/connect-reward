-- Add scheduled_at column for blog post scheduling
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled ON blog_posts (scheduled_at) WHERE scheduled_at IS NOT NULL AND published = false;
