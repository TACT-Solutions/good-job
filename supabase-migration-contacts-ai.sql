-- Migration: Add AI contact discovery fields and constraints
-- Run this in Supabase SQL Editor

-- Add notes column for AI-discovered contact details
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update the source CHECK constraint to include AI Discovery
ALTER TABLE contacts
DROP CONSTRAINT IF EXISTS contacts_source_check;

ALTER TABLE contacts
ADD CONSTRAINT contacts_source_check
CHECK (source IN ('user', 'public_website', 'linkedin_export', 'AI Discovery', 'LinkedIn', 'Company Website'));

-- Create a unique index for preventing duplicate contacts per job
-- This allows the same email to exist for different jobs, but not duplicates within the same job
CREATE UNIQUE INDEX IF NOT EXISTS contacts_unique_job_email
ON contacts(user_id, job_id, email)
WHERE email IS NOT NULL;

-- Also create a unique index for contacts without email (by name)
-- This prevents duplicate names within the same job when email is null
CREATE UNIQUE INDEX IF NOT EXISTS contacts_unique_job_name_no_email
ON contacts(user_id, job_id, name)
WHERE email IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN contacts.notes IS 'Additional information about the contact (e.g., AI reasoning, email suggestions)';
