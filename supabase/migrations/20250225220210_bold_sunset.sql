/*
  # Fix Username Validation

  1. Changes
    - Drop existing constraints and functions in the correct order
    - Recreate validation function and constraints
    - Add proper error handling
    - Fix infinite recursion in policies
  
  2. Security
    - Maintain RLS policies
    - Add proper security definer functions
*/

-- First drop existing constraints in the correct order
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS username_format,
  DROP CONSTRAINT IF EXISTS username_not_empty;

-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS enforce_username_rules_trigger ON user_profiles;
DROP FUNCTION IF EXISTS enforce_username_rules();
DROP FUNCTION IF EXISTS validate_username(text);

-- Create improved username validation function
CREATE OR REPLACE FUNCTION validate_username(username text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Username must:
  -- 1. Be between 3 and 30 characters
  -- 2. Start with a letter
  -- 3. Only contain letters, numbers, and underscores
  -- 4. Be lowercase
  RETURN username ~ '^[a-z][a-z0-9_]{2,29}$';
END;
$$;

-- Create function to enforce username rules
CREATE OR REPLACE FUNCTION enforce_username_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Convert username to lowercase
  NEW.username := LOWER(NEW.username);
  
  -- Validate username format
  IF NOT validate_username(NEW.username) THEN
    RAISE EXCEPTION 'Invalid username format. Username must be 3-30 characters, start with a letter, and contain only lowercase letters, numbers, and underscores.';
  END IF;

  -- Check if username is taken (for new usernames or username changes)
  IF NEW.username != OLD.username OR OLD.username IS NULL THEN
    IF EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE LOWER(username) = LOWER(NEW.username)
      AND user_id != NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Username is already taken.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for username rules
CREATE TRIGGER enforce_username_rules_trigger
  BEFORE UPDATE OF username ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_username_rules();

-- Add constraints back
ALTER TABLE user_profiles
  ADD CONSTRAINT username_not_empty 
  CHECK (username IS NOT NULL AND username != '');

ALTER TABLE user_profiles
  ADD CONSTRAINT username_format
  CHECK (validate_username(username));

-- Update policies to avoid recursion
DROP POLICY IF EXISTS "Users can update their own username" ON user_profiles;

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_username_rules() TO authenticated;