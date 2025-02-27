/*
  # Update clips table relationships and indices

  1. Changes
    - Ensure proper foreign key relationship exists
    - Add performance indices
    - Update visibility policy

  2. Security
    - Maintain existing RLS policies
    - Update visibility policy for public/private clips
*/

-- First check if the constraint exists and drop it if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_clips_user_profiles'
    AND table_name = 'clips'
  ) THEN
    ALTER TABLE clips DROP CONSTRAINT fk_clips_user_profiles;
  END IF;
END $$;

-- Add the foreign key constraint
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