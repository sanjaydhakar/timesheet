-- Add allocation tracking fields
-- This script adds created_by and created_at fields to track who created allocations

-- Add created_by field to track who created the allocation
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL;

-- Add created_at field if it doesn't exist (it should already exist, but just in case)
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_allocations_created_by ON allocations(created_by);

-- Update existing allocations to have created_by set to a default user if needed
-- This is a safety measure - in practice, you might want to handle this differently
UPDATE allocations 
SET created_by = (
  SELECT id FROM users 
  WHERE email = 'test@mapi.com' 
  LIMIT 1
)
WHERE created_by IS NULL;

-- Add comment to the table
COMMENT ON COLUMN allocations.created_by IS 'User who created this allocation';
COMMENT ON COLUMN allocations.created_at IS 'When this allocation was created';
