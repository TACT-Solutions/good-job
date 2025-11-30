-- Migration: Add extension fields to jobs table
-- Run this in your Supabase SQL Editor

-- Add new columns to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS salary_range TEXT,
ADD COLUMN IF NOT EXISTS job_type TEXT CHECK (job_type IN ('remote', 'hybrid', 'onsite', 'unknown')),
ADD COLUMN IF NOT EXISTS seniority_level TEXT,
ADD COLUMN IF NOT EXISTS posted_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS source TEXT; -- Which job board it came from

-- Add index for location and job_type for filtering
CREATE INDEX IF NOT EXISTS jobs_location_idx ON jobs(location);
CREATE INDEX IF NOT EXISTS jobs_job_type_idx ON jobs(job_type);
CREATE INDEX IF NOT EXISTS jobs_posted_date_idx ON jobs(posted_date);
CREATE INDEX IF NOT EXISTS jobs_source_idx ON jobs(source);

-- Add comment
COMMENT ON COLUMN jobs.location IS 'Job location (city, state, country)';
COMMENT ON COLUMN jobs.salary_range IS 'Salary range as text (e.g., "$80k-$120k")';
COMMENT ON COLUMN jobs.job_type IS 'Remote, Hybrid, Onsite, or Unknown';
COMMENT ON COLUMN jobs.seniority_level IS 'Junior, Mid, Senior, Lead, etc.';
COMMENT ON COLUMN jobs.posted_date IS 'When the job was originally posted';
COMMENT ON COLUMN jobs.source IS 'Source job board (LinkedIn, Indeed, etc.)';
