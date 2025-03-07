-- First drop the constraint that depends on the function
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS username_format;

-- Now drop the function and recreate it
DROP FUNCTION IF EXISTS validate_username(text);

-- Create improved username validation function that allows uppercase
CREATE OR REPLACE FUNCTION validate_username(username text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Username must:
  -- 1. Be between 3 and 30 characters
  -- 2. Start with a letter (uppercase or lowercase)
  -- 3. Only contain letters, numbers, and underscores
  RETURN username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,29}$';
END;
$$;

-- Add the constraint back using the updated function
ALTER TABLE user_profiles
  ADD CONSTRAINT username_format
  CHECK (validate_username(username));

-- Update the username rules enforcement function
DROP FUNCTION IF EXISTS enforce_username_rules() CASCADE;

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
  
  -- Validate username format
  IF NOT validate_username(NEW.username) THEN
    RAISE EXCEPTION 'Invalid username format. Username must be 3-30 characters, start with a letter, and contain only letters, numbers, and underscores.';
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

-- Recreate the trigger
CREATE TRIGGER enforce_username_rules_trigger
  BEFORE INSERT OR UPDATE OF username ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_username_rules();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_username_rules() TO authenticated;