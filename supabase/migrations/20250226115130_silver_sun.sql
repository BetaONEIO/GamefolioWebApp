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
  c.*,
  p.username,
  p.avatar_url
FROM clips c
JOIN user_profiles p ON c.user_id = p.user_id;

-- Grant access to the view
GRANT SELECT ON clips_with_profiles TO authenticated;
GRANT SELECT ON clips_with_profiles TO anon;