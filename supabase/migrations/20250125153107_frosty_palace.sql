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
  INSERT INTO storage.buckets (id, name)
  VALUES ('clips', 'clips')
  ON CONFLICT (id) DO NOTHING;

  -- Set up upload policy
  CREATE POLICY "Allow users to upload their own clips"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clips' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Set up read policy
  CREATE POLICY "Allow public read access to clips"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'clips');

  -- Set up delete policy
  CREATE POLICY "Allow users to delete their own clips"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'clips'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
END $$;