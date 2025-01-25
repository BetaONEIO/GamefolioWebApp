/*
  # Set up storage policies for clips bucket

  1. Storage Policies
    - Allow authenticated users to upload clips to their own folder
    - Allow everyone to read clips
    - Allow users to delete their own clips

  Note: The bucket must be created manually in the Supabase dashboard
*/

-- Create storage policies for the clips bucket
DO $$
BEGIN
  -- Allow authenticated users to upload files to their own folder
  INSERT INTO storage.policies (name, bucket_id, definition)
  SELECT 
    'Allow users to upload their own clips',
    id,
    '(bucket_id = ''clips'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)'
  FROM storage.buckets
  WHERE name = 'clips'
  ON CONFLICT (bucket_id, name) DO NOTHING;

  -- Allow public read access to all clips
  INSERT INTO storage.policies (name, bucket_id, definition)
  SELECT 
    'Allow public read access to clips',
    id,
    'bucket_id = ''clips'''
  FROM storage.buckets
  WHERE name = 'clips'
  ON CONFLICT (bucket_id, name) DO NOTHING;

  -- Allow users to delete their own clips
  INSERT INTO storage.policies (name, bucket_id, definition)
  SELECT 
    'Allow users to delete their own clips',
    id,
    '(bucket_id = ''clips'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)'
  FROM storage.buckets
  WHERE name = 'clips'
  ON CONFLICT (bucket_id, name) DO NOTHING;
END $$;