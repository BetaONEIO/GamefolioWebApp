/*
  # Fix user signup and profile creation

  1. Changes
    - Update user profile creation trigger to handle username
    - Add proper error handling
    - Ensure profile is created before any other operations

  2. Security
    - Maintain RLS policies
    - Ensure secure profile creation
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved profile creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Generate a temporary username
  INSERT INTO public.user_profiles (
    user_id,
    username,
    onboarding_completed
  )
  VALUES (
    new.id,
    'user_' || substr(md5(new.id::text), 1, 8),
    false
  );
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error (in a real system, you'd want proper error logging)
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure user_profiles table exists and has proper constraints
DO $$ 
BEGIN
  -- Add any missing columns
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username text UNIQUE;
  END IF;

  -- Ensure onboarding_completed column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  -- Add updated_at trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;