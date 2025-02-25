/*
  # Add Initial Admin User
  
  1. Changes
    - Add admin role for tom@gamefolio.com
  
  2. Security
    - Only adds admin role if user exists
    - Uses secure function to handle the update
*/

DO $$ 
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'tom@gamefolio.com';

  -- If user exists, add admin role
  IF v_user_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin';
  END IF;
END $$;