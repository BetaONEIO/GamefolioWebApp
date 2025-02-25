-- Drop existing username-related functions if they exist
DROP FUNCTION IF EXISTS validate_username(text);
DROP FUNCTION IF EXISTS check_username_availability(text);

-- Create function to validate username format
CREATE OR REPLACE FUNCTION validate_username(username text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
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

-- Create function to check username availability
CREATE OR REPLACE FUNCTION check_username_availability(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First validate the format
  IF NOT validate_username(p_username) THEN
    RETURN false;
  END IF;

  -- Then check if username is taken
  RETURN NOT EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE LOWER(username) = LOWER(p_username)
  );
END;
$$;

-- Create trigger function to enforce username rules
CREATE OR REPLACE FUNCTION enforce_username_rules()
RETURNS trigger
LANGUAGE plpgsql
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_username_rules_trigger ON user_profiles;

-- Create trigger for username rules
CREATE TRIGGER enforce_username_rules_trigger
  BEFORE INSERT OR UPDATE OF username ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_username_rules();

-- Add RLS policy for username checks
CREATE POLICY "Allow public username checks"
  ON user_profiles
  FOR SELECT
  USING (true);