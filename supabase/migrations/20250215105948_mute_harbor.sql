/*
  # Ensure username setup

  1. Changes
    - Make username required in user_profiles
    - Add constraint to ensure username is not null
    - Add function to check if username is set
*/

-- Make username required
ALTER TABLE user_profiles
  ALTER COLUMN username SET NOT NULL;

-- Create function to check if username is set
CREATE OR REPLACE FUNCTION check_username_set(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  username_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_id = $1
    AND username IS NOT NULL
    AND username != ''
  ) INTO username_exists;
  
  RETURN username_exists;
END;
$$;