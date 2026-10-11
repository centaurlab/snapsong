DROP POLICY "Song files public read" ON storage.objects;
CREATE POLICY "Song files readable when published or owned" ON storage.objects FOR SELECT TO anon, authenticated USING (
  bucket_id = 'songs' AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.songs s WHERE s.published AND (s.photo_path = storage.objects.name OR s.audio_path = storage.objects.name))
  )
);