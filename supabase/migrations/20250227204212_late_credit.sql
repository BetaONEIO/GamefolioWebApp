/*
  # Fix User Roles Policy and Infinite Recursion

  1. Changes
     - Fix the infinite recursion in user_roles policies
     - Drop problematic policies and recreate them properly
     - Ensure proper access control for user roles

  2. Security
     - Maintain proper role-based access control
     - Fix security vulnerabilities in existing policies
*/

-- First, drop all existing policies on user_roles to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON user_roles;
DROP POLICY IF EXISTS "Allow admins full access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow users to view their own role" ON user_roles;

-- Drop the problematic trigger that might be causing issues
DROP TRIGGER IF EXISTS ensure_admin_exists ON user_roles;
DROP FUNCTION IF EXISTS prevent_removing_last_admin();

-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = $1
    AND role = 'admin'
  );
$$;

-- Create a function to prevent removing the last admin
CREATE OR REPLACE FUNCTION prevent_removing_last_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.role = 'admin' AND (NEW.role != 'admin' OR TG_OP = 'DELETE') THEN
    IF (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger with proper error handling
CREATE TRIGGER ensure_admin_exists
  BEFORE UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_removing_last_admin();

-- Create new, properly structured policies without recursion
CREATE POLICY "Admins can manage user roles"
  ON user_roles
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view roles"
  ON user_roles
  FOR SELECT
  USING (true);  -- Everyone can view roles

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO anon;