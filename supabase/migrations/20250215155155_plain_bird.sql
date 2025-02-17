/*
  # Add banned status to user profiles

  1. Changes
    - Add `banned` column to user_profiles table
    - Add RLS policy to prevent banned users from uploading clips
    - Add RLS policy to prevent banned users from updating their profiles

  2. Security
    - Only admins can update the banned status
    - Banned users cannot upload new content
    - Banned users can still view content
*/

-- Add banned column to user_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'banned'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN banned boolean DEFAULT false;
  END IF;
END $$;

-- Add policy for banned users
CREATE POLICY "Banned users cannot upload clips"
ON clips
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND banned = true
  )
);

-- Add policy to prevent banned users from updating their profiles
CREATE POLICY "Banned users cannot update profiles"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND NOT banned
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND banned = true
  )
);

-- Add policy for admins to manage banned status
CREATE POLICY "Admins can update banned status"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);