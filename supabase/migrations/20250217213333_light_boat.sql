/*
  # Fix authentication triggers with security definer

  1. Changes
    - Drop existing triggers and functions
    - Recreate handle_new_user function with security definer
    - Recreate trigger with proper permissions
    - Grant necessary permissions to auth admin

  2. Security
    - Function runs with creator's privileges (security definer)
    - Explicit search path to prevent search path attacks
    - Proper error handling for robustness
*/

-- First drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with proper security definer
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_suffix TEXT;
BEGIN
  -- Generate a unique username suffix
  username_suffix := substr(md5(new.id::text), 1, 8);
  
  -- Insert new profile with proper error handling
  BEGIN
    INSERT INTO public.user_profiles (
      user_id,
      username,
      onboarding_completed
    )
    VALUES (
      new.id,
      'user_' || username_suffix,
      false
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- If username is taken, try again with a different suffix
      username_suffix := substr(md5(new.id::text || clock_timestamp()::text), 1, 8);
      INSERT INTO public.user_profiles (
        user_id,
        username,
        onboarding_completed
      )
      VALUES (
        new.id,
        'user_' || username_suffix,
        false
      );
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user: %', SQLERRM;
      RETURN new;
  END;
  
  RETURN new;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();