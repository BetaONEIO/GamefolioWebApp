/*
  # Add likes and comments tables

  1. New Tables
    - `likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `clip_id` (uuid, references clips)
      - `created_at` (timestamp)
    - `comments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `clip_id` (uuid, references clips)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for email confirmation requirement
    - Add policies for banned users
    - Add policies for CRUD operations
*/

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  clip_id uuid REFERENCES clips NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, clip_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  clip_id uuid REFERENCES clips NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Confirmed users can like"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email_confirmed_at IS NOT NULL
    )
    AND NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND banned = true
    )
  );

CREATE POLICY "Users can unlike their own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Confirmed users can comment"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email_confirmed_at IS NOT NULL
    )
    AND NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND banned = true
    )
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND banned = true
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for updating comments.updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_clip_id ON likes(clip_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_clip_id ON comments(clip_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);