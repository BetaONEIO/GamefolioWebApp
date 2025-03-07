/*
  # Create clips table and storage

  1. New Tables
    - `clips`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `game` (text)
      - `video_url` (text)
      - `thumbnail_url` (text)
      - `likes` (integer)
      - `comments` (integer)
      - `shares` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `clips` table
    - Add policies for authenticated users to:
      - Read all clips
      - Create their own clips
      - Update their own clips
      - Delete their own clips
*/

-- Create clips table
CREATE TABLE IF NOT EXISTS clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  game text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Clips are viewable by everyone"
  ON clips
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own clips"
  ON clips
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clips"
  ON clips
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clips"
  ON clips
  FOR DELETE
  USING (auth.uid() = user_id);