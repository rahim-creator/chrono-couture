-- Create storage.objects policies for 'wardrobe' bucket if they don't exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read their own wardrobe images'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can read their own wardrobe images"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'wardrobe'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own wardrobe images'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can upload their own wardrobe images"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'wardrobe'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own wardrobe images'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can update their own wardrobe images"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'wardrobe'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'wardrobe'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own wardrobe images'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Users can delete their own wardrobe images"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'wardrobe'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $$;
  END IF;
END $$;