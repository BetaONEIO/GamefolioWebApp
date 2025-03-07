/*
  # Fix notifications table relationships

  1. Changes
    - Add proper foreign key relationship for actor_id
    - Update RLS policies
    - Add necessary indexes
    
  2. Security
    - Enable RLS
    - Add policies for viewing notifications
*/

-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS public.notifications
  DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

-- Add proper foreign key relationship
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_actor_id_fkey 
  FOREIGN KEY (actor_id) 
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Enable RLS if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create new policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read) WHERE (NOT read);