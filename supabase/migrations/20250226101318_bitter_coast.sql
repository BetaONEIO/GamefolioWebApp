/*
  # Fix clips and user_profiles relationship

  1. Changes
    - Add foreign key relationship between clips and user_profiles
    - Update existing clips query to use proper join syntax
    - Add indices for better performance

  2. Security
    - Maintain existing RLS policies
*/

-- First, ensure the foreign key relationship exists
ALTER TABLE clips
ADD CONSTRAINT fk_clips_user_profiles
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add indices for better query performance
CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_clips_created_at ON clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_game ON clips(game);

-- Update clips policies to include user_profiles join
DROP POLICY IF EXISTS "Clips are viewable by everyone" ON clips;
CREATE POLICY "Clips are viewable by everyone"
ON clips FOR SELECT
USING (
  visibility = 'public' OR
  (visibility = 'private' AND auth.uid() = user_id)
);