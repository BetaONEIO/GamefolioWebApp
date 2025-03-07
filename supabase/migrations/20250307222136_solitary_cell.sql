/*
  # Create clips_with_profiles view

  1. New View
    - Creates a view that joins clips with user profiles for easier querying
    - Includes all clip data plus user profile information
    - Handles visibility rules

  2. Security
    - Enables RLS on the view
    - Adds policy for public access to public clips
    - Adds policy for authenticated users to see their own private clips
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS clips_with_profiles;

-- Create the view
CREATE VIEW clips_with_profiles AS
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
  up.username,
  up.avatar_url
FROM clips c
JOIN user_profiles up ON c.user_id = up.user_id
WHERE NOT up.banned;

-- Enable RLS
ALTER VIEW clips_with_profiles SET (security_invoker = true);

-- Create policies
CREATE POLICY "Anyone can view public clips" ON clips_with_profiles
  FOR SELECT
  TO public
  USING (visibility = 'public');

CREATE POLICY "Users can view their own clips" ON clips_with_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR visibility = 'public'
  );