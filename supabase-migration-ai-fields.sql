-- Migration: Add AI enrichment tracking fields to jobs table
-- Run this in Supabase SQL Editor after deployment

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS ai_enriched_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2); -- 0.00 to 1.00

-- Create index for querying enriched jobs
CREATE INDEX IF NOT EXISTS jobs_ai_enriched_idx ON jobs(ai_enriched_at);

-- Backfill: Mark existing jobs with extracted_description as enriched
UPDATE jobs
SET ai_enriched_at = updated_at
WHERE extracted_description IS NOT NULL
  AND ai_enriched_at IS NULL;

-- Comments for documentation
COMMENT ON COLUMN jobs.ai_enriched_at IS 'Timestamp when AI enrichment was last performed';
COMMENT ON COLUMN jobs.ai_confidence IS 'AI confidence score (0.00-1.00) for enrichment quality';
