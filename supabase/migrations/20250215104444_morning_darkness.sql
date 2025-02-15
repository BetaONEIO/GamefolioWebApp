-- First, drop the existing foreign key if it exists
ALTER TABLE clips
DROP CONSTRAINT IF EXISTS fk_clips_user_profiles;

-- Recreate the foreign key relationship with proper references
ALTER TABLE clips
ADD CONSTRAINT fk_clips_user_profiles
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add indices for better query performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_clips_created_at ON clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_game ON clips(game);

-- Recreate the trending games function with proper error handling
CREATE OR REPLACE FUNCTION get_trending_games()
RETURNS TABLE (
  game text,
  clip_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.game,
    COUNT(*) as clip_count
  FROM clips c
  WHERE c.game IS NOT NULL
  GROUP BY c.game
  ORDER BY clip_count DESC
  LIMIT 4;
END;
$$;