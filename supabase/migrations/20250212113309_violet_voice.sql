/*
  # User Onboarding Setup

  1. New Tables
    - `user_profiles`
      - `user_id` (uuid, references auth.users)
      - `username` (text, unique)
      - `onboarding_completed` (boolean)
      - `favorite_games` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on user_profiles table
    - Add policies for user access
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  onboarding_completed boolean DEFAULT false,
  favorite_games text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view any profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();