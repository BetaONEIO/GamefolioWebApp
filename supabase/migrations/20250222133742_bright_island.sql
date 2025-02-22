-- Grant necessary permissions to pgbouncer
DO $$ 
BEGIN
  -- Grant usage on schema
  GRANT USAGE ON SCHEMA public TO supabase_storage_admin;
  
  -- Grant access to necessary tables
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO supabase_storage_admin;
  
  -- Grant access to future tables
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO supabase_storage_admin;
    
  -- Ensure pgbouncer has proper auth query permissions
  GRANT EXECUTE ON FUNCTION pgbouncer.get_auth(text) TO pgbouncer;
END $$;