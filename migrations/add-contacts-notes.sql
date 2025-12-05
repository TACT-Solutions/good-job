-- Add notes column to contacts table
-- Run this in Supabase SQL editor

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update source constraint to allow AI-generated sources
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_source_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_source_check
  CHECK (source IN ('user', 'public_website', 'linkedin_export', 'AI Discovery', 'Job Posting'));

-- Optional: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_job_id ON contacts(job_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;