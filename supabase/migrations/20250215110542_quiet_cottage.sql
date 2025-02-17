/*
  # Add clip visibility options

  1. Changes
    - Add visibility column to clips table
    - Add default value of 'public'
    - Add check constraint to ensure valid values
*/

-- Add visibility column to clips table
ALTER TABLE clips
ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
CHECK (visibility IN ('public', 'private'));

-- Update existing clips to have public visibility
UPDATE clips SET visibility = 'public' WHERE visibility IS NULL;