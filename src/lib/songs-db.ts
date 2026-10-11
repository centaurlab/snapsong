// Browser-side helpers for saving and reading published songs.
import { supabase } from "@/integrations/supabase/client";
import type { PlannedSection } from "./song-plan";

export type PublishInput = {
  userId: string;
  authorName: string;
  authorAvatar?: string | undefined;
  title: string;
  styles: string[];
  sections: PlannedSection[];
  summary: string;
  photoDataUrl: string;
  audioUrl: string;
  analysisModel: string;
  lyricsModel: string;
  musicModel: string;
  location: { lat: number; lng: number; name: string | null } | null;
  takenAt: string | null;
};

export async function publishSong(p: PublishInput) {
  const id = crypto.randomUUID();
  const photo = await (await fetch(p.photoDataUrl)).blob();
  const audio = await (await fetch(p.audioUrl)).blob();
  const photoPath = `${p.userId}/${id}.jpg`;
  const audioPath = `${p.userId}/${id}.mp3`;
  const up1 = await supabase.storage.from("songs").upload(photoPath, photo, { contentType: "image/jpeg" });
  if (up1.error) throw up1.error;
  const up2 = await supabase.storage.from("songs").upload(audioPath, audio, { contentType: "audio/mpeg" });
  if (up2.error) throw up2.error;
  const { error } = await supabase.from("songs").insert({
    id,
    user_id: p.userId,
    author_name: p.authorName,
    author_avatar: p.authorAvatar ?? null,
    title: p.title,
    styles: p.styles,
    sections: p.sections as never,
    summary: p.summary,
    photo_path: photoPath,
    audio_path: audioPath,
    analysis_model: p.analysisModel,
    lyrics_model: p.lyricsModel,
    music_model: p.musicModel,
    latitude: p.location?.lat ?? null,
    longitude: p.location?.lng ?? null,
    location_name: p.location?.name ?? null,
    taken_at: p.takenAt,
  });
  if (error) throw error;
  return id;
}

async function sign(paths: string[]) {
  if (!paths.length) return new Map<string, string>();
  const { data } = await supabase.storage.from("songs").createSignedUrls(paths, 60 * 60 * 6);
  return new Map((data ?? []).filter((d) => d.signedUrl).map((d) => [d.path!, d.signedUrl]));
}

export async function listSongs() {
  const { data, error } = await supabase
    .from("songs")
    .select("id,title,styles,author_name,author_avatar,photo_path,location_name,created_at,analysis_model")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  const urls = await sign(data.map((s) => s.photo_path));
  return data.map((s) => ({ ...s, photoUrl: urls.get(s.photo_path) ?? "" }));
}

export async function getSong(id: string) {
  const { data, error } = await supabase.from("songs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const urls = await sign([data.photo_path, data.audio_path]);
  return {
    ...data,
    sections: data.sections as unknown as PlannedSection[],
    photoUrl: urls.get(data.photo_path) ?? "",
    audioUrl: urls.get(data.audio_path) ?? "",
  };
}
