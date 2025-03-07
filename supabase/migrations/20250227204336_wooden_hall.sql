/*
  # Fix User Profiles Policies and Add Missing Columns

  1. Changes
     - Fix policies for user_profiles table by checking existence first
     - Add missing columns to user_profiles table
     - Ensure proper access control for profile updates

  2. Security
     - Maintain proper access control
     - Fix security vulnerabilities in existing policies
*/

-- First, drop conflicting policies if they exist
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update temporary usernames" ON user_profiles;
DROP POLICY IF EXISTS "Banned users cannot update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update banned status" ON user_profiles;

-- Check if policy exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can view any profile'
  ) THEN
    CREATE POLICY "Users can view any profile"
      ON user_profiles
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Create new, properly structured policies
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND banned = true
    )
  );

CREATE POLICY "Admins can update any profile"
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

-- Add additional columns to user_profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'social_links'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'followers'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN followers integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'following'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN following integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'views'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN views integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN bio text DEFAULT '';
  END IF;
END $$;