-- Storage policies for 'wardrobe' bucket
CREATE POLICY "Users can read their own wardrobe images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'wardrobe'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own wardrobe images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'wardrobe'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

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

CREATE POLICY "Users can delete their own wardrobe images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'wardrobe'
  AND auth.uid()::text = (storage.foldername(name))[1]
);