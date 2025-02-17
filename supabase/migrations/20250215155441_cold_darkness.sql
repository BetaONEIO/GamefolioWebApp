/*
  # Add email confirmation requirements

  1. Changes
    - Add policy to prevent unconfirmed users from uploading clips
    - Update RLS policies for protected actions
    - Ensure email confirmation before allowing uploads

  2. Security
    - Unconfirmed users cannot upload clips
    - Unconfirmed users can still view content
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Only confirmed users can upload clips" ON clips;

-- Add policy for unconfirmed users
CREATE POLICY "Only confirmed users can upload clips"
ON clips
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email_confirmed_at IS NOT NULL
  )
);

-- Create function to check if user is confirmed
CREATE OR REPLACE FUNCTION auth.is_email_confirmed()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email_confirmed_at IS NOT NULL
  );
$$;