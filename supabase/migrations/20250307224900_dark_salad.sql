/*
  # Fix likes table and RLS policies

  1. Tables
    - Create likes table if not exists
    - Add necessary constraints and indexes
    
  2. Security
    - Enable RLS
    - Create policies for:
      - Viewing likes (public)
      - Creating likes (authenticated users)
      - Deleting likes (own likes only)
    
  3. Triggers
    - Add trigger to maintain likes count
*/

-- Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clip_id uuid NOT NULL REFERENCES public.clips(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, clip_id)
);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;
DROP POLICY IF EXISTS "Confirmed users can like" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

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
    -- User must be authenticated and match the user_id
    auth.uid() = user_id
    -- User must have confirmed email
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email_confirmed_at IS NOT NULL
    )
    -- User must not be banned
    AND NOT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND banned = true
    )
    -- Clip must exist and be public or owned by the user
    AND EXISTS (
      SELECT 1 FROM public.clips
      WHERE id = clip_id
      AND (
        visibility = 'public'
        OR user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own likes"
  ON public.likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_clip_id ON public.likes(clip_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_clip_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clips
    SET likes = likes + 1
    WHERE id = NEW.clip_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clips
    SET likes = GREATEST(0, likes - 1)
    WHERE id = OLD.clip_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS update_clip_likes_count ON public.likes;
CREATE TRIGGER update_clip_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clip_likes_count();