/*
  # Fix user deletion functionality

  1. Changes
    - Drop existing function
    - Create improved user deletion function
    - Add proper cascading deletes
    - Handle storage cleanup
  
  2. Security
    - Maintain RLS policies
    - Ensure proper permissions
*/

-- Drop existing function
DROP FUNCTION IF EXISTS handle_user_deletion(uuid);

-- Create improved user deletion function
CREATE OR REPLACE FUNCTION handle_user_deletion(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  storage_path text;
BEGIN
  -- Start transaction
  BEGIN
    -- Delete user's clips (this will cascade to likes and comments)
    DELETE FROM clips WHERE user_id = $1;
    
    -- Delete user's notifications
    DELETE FROM notifications WHERE user_id = $1 OR actor_id = $1;
    
    -- Delete user's role
    DELETE FROM user_roles WHERE user_id = $1;
    
    -- Delete user's profile
    DELETE FROM user_profiles WHERE user_id = $1;

    -- Delete user's storage objects
    storage_path := $1::text || '/';
    DELETE FROM storage.objects 
    WHERE bucket_id = 'clips' 
    AND position(storage_path in name) = 1;

    -- Success
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE LOG 'Error in handle_user_deletion: %', SQLERRM;
    RAISE;
  END;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_user_deletion(uuid) TO authenticated;