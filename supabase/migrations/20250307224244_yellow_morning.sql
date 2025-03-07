/*
  # Add likes table and policies

  1. Tables
    - Creates likes table with proper relations
    - Adds necessary indexes for performance

  2. Security
    - Enables RLS
    - Adds policies for viewing and managing likes
    - Ensures proper user permissions
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;
DROP POLICY IF EXISTS "Confirmed users can like" ON public.likes;

-- Create RLS policies
CREATE POLICY "Anyone can view likes"
  ON public.likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clips
      WHERE clips.id = likes.clip_id
      AND public.can_view_clip(clips.visibility, clips.user_id)
    )
  );

CREATE POLICY "Users can manage their own likes"
  ON public.likes
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Confirmed users can like"
  ON public.likes
  FOR INSERT
  WITH CHECK (
    -- Must be authenticated
    auth.uid() = user_id
    -- Must be email confirmed
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
    -- Must be able to view the clip
    AND EXISTS (
      SELECT 1 FROM public.clips
      WHERE clips.id = clip_id
      AND public.can_view_clip(clips.visibility, clips.user_id)
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_clip_id ON public.likes(clip_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

-- Create trigger function to update clips likes count
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
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clips
    SET likes = likes - 1
    WHERE id = OLD.clip_id;
    RETURN OLD;
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