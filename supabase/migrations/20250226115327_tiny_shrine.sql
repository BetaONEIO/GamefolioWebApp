-- Add avatar_url column to user_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Drop existing foreign key if it exists
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

-- Create a view to join clips with user profiles
CREATE OR REPLACE VIEW clips_with_profiles AS
SELECT 
  c.id,
  c.user_id,
  c.title,
  c.game,
  c.video_url,
  c.thumbnail_url,
  c.likes,
  c.comments,
  c.shares,
  c.visibility,
  c.created_at,
  c.updated_at,
  p.username,
  COALESCE(p.avatar_url, 'https://api.dicebear.com/7.x/initials/svg?seed=' || p.username || '&backgroundColor=9FE64F&textColor=000000') as avatar_url
FROM clips c
JOIN user_profiles p ON c.user_id = p.user_id;

-- Grant access to the view
GRANT SELECT ON clips_with_profiles TO authenticated;
GRANT SELECT ON clips_with_profiles TO anon;