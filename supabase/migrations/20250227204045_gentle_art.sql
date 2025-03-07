/*
  # Fix Username Setup Process

  1. Changes
     - Fix the username validation function to properly handle username updates
     - Modify the enforce_username_rules trigger to work correctly for both inserts and updates
     - Add proper error handling for username validation
     - Ensure temporary usernames can be updated

  2. Security
     - Maintain all existing security policies
     - Ensure proper permissions for authenticated users
*/

-- First drop existing triggers that might be causing issues
DROP TRIGGER IF EXISTS enforce_username_rules_trigger ON user_profiles;

-- Drop existing function
DROP FUNCTION IF EXISTS enforce_username_rules();

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
  -- Skip validation for temporary usernames (starting with 'user_')
  IF NEW.username LIKE 'user_%' THEN
    RETURN NEW;
  END IF;

  -- Convert username to lowercase
  NEW.username := LOWER(NEW.username);
  
  -- Validate username format
  IF NOT validate_username(NEW.username) THEN
    RAISE EXCEPTION 'Invalid username format. Username must be 3-30 characters, start with a letter, and contain only lowercase letters, numbers, and underscores.';
  END IF;

  -- Check if username is taken (for new usernames or username changes)
  IF TG_OP = 'UPDATE' THEN
    IF NEW.username != OLD.username THEN
      IF EXISTS (
        SELECT 1 
        FROM user_profiles 
        WHERE LOWER(username) = LOWER(NEW.username)
        AND user_id != NEW.user_id
      ) THEN
        RAISE EXCEPTION 'Username is already taken.';
      END IF;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
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

-- Create trigger for username rules that works for both INSERT and UPDATE
CREATE TRIGGER enforce_username_rules_trigger
  BEFORE INSERT OR UPDATE OF username ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_username_rules();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_username_rules() TO authenticated;

-- Create a special policy for updating temporary usernames
CREATE POLICY "Users can update temporary usernames"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    username LIKE 'user_%'
  )
  WITH CHECK (
    auth.uid() = user_id
  );