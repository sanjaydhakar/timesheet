-- Migration: Add devs_needed column to projects table
-- This migration adds an optional field to track how many developers are needed for a project

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS devs_needed INTEGER CHECK (devs_needed > 0);

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN projects.devs_needed IS 'Optional field indicating how many developers are needed for this project';

