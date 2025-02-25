-- First, drop existing policies on user_roles
DROP POLICY IF EXISTS "Allow admins full access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow users to view their own role" ON user_roles;

-- Create new, properly structured policies
CREATE POLICY "Admins can manage user roles"
  ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.user_id != user_roles.user_id  -- Prevent admin from modifying their own role
    )
  );

CREATE POLICY "Users can view roles"
  ON user_roles
  FOR SELECT
  USING (true);  -- Everyone can view roles

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Add trigger to prevent removing the last admin
CREATE OR REPLACE FUNCTION prevent_removing_last_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    IF (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_admin_exists
  BEFORE UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_removing_last_admin();