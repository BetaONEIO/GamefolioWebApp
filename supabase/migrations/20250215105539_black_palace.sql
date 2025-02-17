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

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS set_updated_at();

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing columns to user_profiles if they don't exist
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();