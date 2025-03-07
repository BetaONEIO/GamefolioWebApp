/*
  # Fix likes table RLS policies

  1. Changes
    - Enable RLS on likes table
    - Add policies for:
      - Viewing likes
      - Creating likes
      - Deleting likes
    - Add foreign key constraints
    - Add indexes for performance

  2. Security
    - Users can only like public clips or their own clips
    - Users can only delete their own likes
    - Anyone can view likes on public clips
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

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;

-- Create new policies
CREATE POLICY "Anyone can view likes"
  ON public.likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clips
      WHERE clips.id = likes.clip_id
      AND (
        clips.visibility = 'public'
        OR clips.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Confirmed users can like"
  ON public.likes
  FOR INSERT
  WITH CHECK (
    -- Must be authenticated
    auth.uid() = user_id
    -- Must have confirmed email
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.email_confirmed_at IS NOT NULL
    )
    -- Must not be banned
    AND NOT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.banned = true
    )
    -- Can only like public clips or own clips
    AND EXISTS (
      SELECT 1 FROM public.clips
      WHERE clips.id = clip_id
      AND (
        clips.visibility = 'public'
        OR clips.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can unlike their own likes"
  ON public.likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_clip_id ON public.likes(clip_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

-- Update clips table to maintain likes count
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

-- Create or replace the trigger
DROP TRIGGER IF EXISTS update_clip_likes_count ON public.likes;
CREATE TRIGGER update_clip_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clip_likes_count();