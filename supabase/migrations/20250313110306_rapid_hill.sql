/*
  # Fix likes table RLS policies

  1. Changes
    - Drop existing policies
    - Create new, properly structured policies for likes table
    - Fix permission issues with likes table
    
  2. Security
    - Allow authenticated users to create likes
    - Allow users to delete their own likes
    - Allow public viewing of likes
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;
DROP POLICY IF EXISTS "Confirmed users can like" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.likes;

-- Create new policies
CREATE POLICY "Anyone can view likes"
  ON public.likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create likes"
  ON public.likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete own likes"
  ON public.likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Make sure RLS is enabled
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;