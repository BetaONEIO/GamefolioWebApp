-- Grant necessary permissions to storage admin
DO $$ 
BEGIN
  -- Grant usage on schema
  GRANT USAGE ON SCHEMA auth TO supabase_storage_admin;
  GRANT USAGE ON SCHEMA storage TO supabase_storage_admin;
  
  -- Grant access to necessary tables
  GRANT SELECT ON ALL TABLES IN SCHEMA auth TO supabase_storage_admin;
  GRANT SELECT ON ALL TABLES IN SCHEMA storage TO supabase_storage_admin;
  
  -- Grant access to future tables
  ALTER DEFAULT PRIVILEGES IN SCHEMA auth
    GRANT SELECT ON TABLES TO supabase_storage_admin;
  
  ALTER DEFAULT PRIVILEGES IN SCHEMA storage
    GRANT SELECT ON TABLES TO supabase_storage_admin;
    
  -- Ensure storage admin has proper auth permissions
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO supabase_storage_admin;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA storage TO supabase_storage_admin;
END $$;