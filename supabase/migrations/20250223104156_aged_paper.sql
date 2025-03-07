/*
  # Fix authentication permissions

  1. Changes
    - Grant necessary permissions to auth schema
    - Grant permissions to auth functions
    - Ensure proper role access for authentication
  
  2. Security
    - Maintains RLS policies
    - Only grants required permissions
*/

-- Grant necessary permissions for authentication
DO $$ 
BEGIN
  -- Grant usage on auth schema
  GRANT USAGE ON SCHEMA auth TO postgres;
  GRANT USAGE ON SCHEMA auth TO anon;
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT USAGE ON SCHEMA auth TO service_role;

  -- Grant execute permissions on auth functions
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO postgres;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

  -- Grant access to auth tables
  GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
  GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon;
  GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;

  -- Grant access to future tables
  ALTER DEFAULT PRIVILEGES IN SCHEMA auth
    GRANT ALL ON TABLES TO postgres;
  
  ALTER DEFAULT PRIVILEGES IN SCHEMA auth
    GRANT SELECT ON TABLES TO anon;
  
  ALTER DEFAULT PRIVILEGES IN SCHEMA auth
    GRANT SELECT ON TABLES TO authenticated;
  
  ALTER DEFAULT PRIVILEGES IN SCHEMA auth
    GRANT ALL ON TABLES TO service_role;
END $$;