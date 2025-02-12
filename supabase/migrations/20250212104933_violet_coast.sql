/*
  # Storage policies for clips bucket

  1. Security
    - Create policies to control access to the clips storage bucket:
      - Allow authenticated users to upload clips to their own folder
      - Allow public read access to all clips
      - Allow users to delete their own clips

  2. Implementation
    - Create policies directly on storage.objects table
    - Use folder-based access control for user uploads
    - Enable public read access for all clips
*/

-- Create policies for the clips bucket
DO $$ 
BEGIN
  -- Create upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow users to upload their own clips'
  ) THEN
    CREATE POLICY "Allow users to upload their own clips"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'clips' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Create read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow public read access to clips'
  ) THEN
    CREATE POLICY "Allow public read access to clips"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'clips');
  END IF;

  -- Create delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow users to delete their own clips'
  ) THEN
    CREATE POLICY "Allow users to delete their own clips"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'clips'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;