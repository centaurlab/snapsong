CREATE TABLE public.songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  author_name text,
  author_avatar text,
  title text NOT NULL,
  styles text[] NOT NULL DEFAULT '{}',
  sections jsonb NOT NULL DEFAULT '[]',
  summary text,
  photo_path text NOT NULL,
  audio_path text NOT NULL,
  analysis_model text NOT NULL,
  lyrics_model text NOT NULL,
  music_model text NOT NULL DEFAULT 'elevenlabs/music_v1',
  latitude double precision,
  longitude double precision,
  location_name text,
  taken_at timestamptz,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.songs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.songs TO authenticated;
GRANT ALL ON public.songs TO service_role;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published songs are public" ON public.songs FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY "Owners read own songs" ON public.songs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own songs" ON public.songs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own songs" ON public.songs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete own songs" ON public.songs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX songs_created_idx ON public.songs (created_at DESC);

CREATE POLICY "Song files public read" ON storage.objects FOR SELECT USING (bucket_id = 'songs');
CREATE POLICY "Users upload own song files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'songs' AND (storage.foldername(name))[1] = auth.uid()::text);