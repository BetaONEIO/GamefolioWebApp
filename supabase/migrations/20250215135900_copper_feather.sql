/*
  # Fix authentication trigger security

  1. Changes
    - Drop existing trigger and function
    - Recreate handle_new_user function with proper security definer
    - Recreate trigger with proper permissions

  2. Security
    - Function is created with SECURITY DEFINER to retain postgres role privileges
    - Explicit grant to supabase_auth_admin role
*/

-- First drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with proper security definer
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;

-- Grant execute permission to auth admin
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();