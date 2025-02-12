/*
  # Fix database relationships

  1. Changes
    - Add foreign key relationship between clips and user_profiles
    - Update clips table to reference user_profiles
    - Add missing indices for performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add foreign key relationship between clips and user_profiles
ALTER TABLE clips
ADD CONSTRAINT fk_clips_user_profiles
FOREIGN KEY (user_id)
REFERENCES user_profiles(user_id)
ON DELETE CASCADE;

-- Add indices for better query performance
CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_clips_created_at ON clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_game ON clips(game);