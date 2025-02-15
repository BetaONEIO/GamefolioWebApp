/*
  # Username validation and constraints

  1. Changes
    - Add check constraint to ensure username is not empty
    - Add function to validate username format
    - Add trigger to enforce username format on insert/update
    - Add RLS policy for username updates

  2. Security
    - Only allow users to update their own username
    - Enforce username format rules
*/

-- Add check constraint for non-empty username
ALTER TABLE user_profiles
ADD CONSTRAINT username_not_empty 
CHECK (username IS NOT NULL AND username != '');

-- Create function to validate username format
CREATE OR REPLACE FUNCTION validate_username(username text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Username must:
  -- 1. Be between 3 and 30 characters
  -- 2. Only contain letters, numbers, and underscores
  -- 3. Start with a letter
  RETURN username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,29}$';
END;
$$;

-- Add check constraint for username format
ALTER TABLE user_profiles
ADD CONSTRAINT username_format
CHECK (validate_username(username));

-- Create trigger function to enforce username rules
CREATE OR REPLACE FUNCTION enforce_username_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convert username to lowercase
  NEW.username = lower(NEW.username);
  
  -- Validate username format
  IF NOT validate_username(NEW.username) THEN
    RAISE EXCEPTION 'Invalid username format. Username must be 3-30 characters, start with a letter, and contain only letters, numbers, and underscores.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for username rules
CREATE TRIGGER enforce_username_rules_trigger
BEFORE INSERT OR UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_username_rules();

-- Create policy for username updates
CREATE POLICY "Users can update their own username"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);