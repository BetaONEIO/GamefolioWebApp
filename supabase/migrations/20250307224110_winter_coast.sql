/*
  # Create clips with profiles view and comments system

  1. Views
    - Creates a view joining clips with user profiles
    - Includes security function for visibility checks
  
  2. Tables
    - Creates comments table with proper relations
    - Adds necessary indexes for performance

  3. Security
    - Updates RLS policies for clips
    - Adds RLS policies for comments
    - Sets proper permissions for the view
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.clips_with_profiles;

-- Create function to check if user can view clips
CREATE OR REPLACE FUNCTION public.can_view_clip(clip_visibility text, clip_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    CASE
      WHEN clip_visibility = 'public' THEN true
      WHEN auth.uid() = clip_user_id THEN true
      ELSE false
    END;
$$;

-- Create the view
CREATE OR REPLACE VIEW public.clips_with_profiles AS
SELECT 
  c.id,
  c.user_id,
  c.title,
  c.game,
  c.video_url,
  c.thumbnail_url,
  c.likes,
  c.comments,
  c.shares,
  c.visibility,
  c.created_at,
  c.updated_at,
  up.username,
  up.avatar_url
FROM public.clips c
JOIN public.user_profiles up ON c.user_id = up.user_id
WHERE NOT up.banned;

-- Grant permissions
GRANT SELECT ON public.clips_with_profiles TO authenticated;
GRANT SELECT ON public.clips_with_profiles TO anon;

-- Enable RLS
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for public clips" ON public.clips;
DROP POLICY IF EXISTS "Users can update their own clips" ON public.clips;
DROP POLICY IF EXISTS "Users can delete their own clips" ON public.clips;
DROP POLICY IF EXISTS "Users can insert clips" ON public.clips;

-- Create RLS policies for the base clips table
CREATE POLICY "Enable read access for public clips"
  ON public.clips
  FOR SELECT
  USING (
    public.can_view_clip(visibility, user_id)
  );

CREATE POLICY "Users can update their own clips"
  ON public.clips
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clips"
  ON public.clips
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert clips"
  ON public.clips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES public.clips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view comments on public clips" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Create RLS policies for comments
CREATE POLICY "Anyone can view comments on public clips"
  ON public.comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clips
      WHERE clips.id = comments.clip_id
      AND public.can_view_clip(clips.visibility, clips.user_id)
    )
  );

CREATE POLICY "Users can create comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.clips
      WHERE clips.id = clip_id
      AND public.can_view_clip(clips.visibility, clips.user_id)
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_clip_id ON public.comments(clip_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);