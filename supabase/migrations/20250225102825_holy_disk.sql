/*
  # Add Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `actor_id` (uuid, references auth.users, nullable)
      - `type` (text, enum: like, comment, follow, mention, system)
      - `title` (text)
      - `message` (text)
      - `read` (boolean)
      - `data` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on notifications table
    - Add policies for user access
    - Add function for creating notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  actor_id uuid REFERENCES auth.users,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    actor_id,
    type,
    title,
    message,
    data
  )
  VALUES (
    p_user_id,
    p_actor_id,
    p_type,
    p_title,
    p_message,
    p_data
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE NOT read;

-- Add trigger for notifications cleanup (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete notifications beyond the last 100 for the user
  DELETE FROM notifications
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY user_id
               ORDER BY created_at DESC
             ) as rn
      FROM notifications
      WHERE user_id = NEW.user_id
    ) t
    WHERE t.rn > 100
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_notifications_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_notifications();