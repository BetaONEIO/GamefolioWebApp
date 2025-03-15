/*
  # Fix user deletion process

  1. Changes
    - Add deleted_at column to user_profiles
    - Update user deletion function to properly handle deletion
    - Add indices for better performance

  2. Security
    - Maintain existing RLS policies
    - Ensure proper cascade deletion
*/

-- Add deleted_at column to user_profiles if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create index for deleted_at column
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at 
ON user_profiles(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_deletion(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark user as deleted in user_profiles
  UPDATE user_profiles
  SET 
    deleted_at = NOW(),
    banned = true,
    username = 'deleted_' || substr(md5(random()::text), 1, 8)
  WHERE user_id = $1;

  -- Delete user's clips
  DELETE FROM clips WHERE user_id = $1;
  
  -- Delete user's likes
  DELETE FROM likes WHERE user_id = $1;
  
  -- Delete user's comments
  DELETE FROM comments WHERE user_id = $1;
  
  -- Delete user's notifications
  DELETE FROM notifications WHERE user_id = $1;
  
  -- Delete user's role
  DELETE FROM user_roles WHERE user_id = $1;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_user_deletion(uuid) TO authenticated;