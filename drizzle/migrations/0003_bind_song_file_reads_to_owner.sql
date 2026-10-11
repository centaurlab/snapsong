DROP POLICY "Song files readable when published or owned" ON storage.objects;
CREATE POLICY "Song files readable when published or owned" ON storage.objects FOR SELECT TO anon, authenticated USING (
  bucket_id = 'songs' AND (
    owner_id = (SELECT auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM public.songs s
      WHERE s.published
        AND s.user_id::text = (storage.foldername(storage.objects.name))[1]
        AND (s.photo_path = storage.objects.name OR s.audio_path = storage.objects.name)
    )
  )
);