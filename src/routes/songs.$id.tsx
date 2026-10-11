import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { SongPlayer } from "@/components/SongPlayer";
import { getSong } from "@/lib/songs-db";

export const Route = createFileRoute("/songs/$id")({
  head: () => ({
    meta: [
      { title: "Listen — Snapsong" },
      { name: "description", content: "An original song made from a photo on Snapsong." },
      { property: "og:title", content: "Listen — Snapsong" },
      { property: "og:description", content: "An original song made from a photo on Snapsong." },
      { property: "og:type", content: "music.song" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: SongPage,
});

function SongPage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["song", id], queryFn: () => getSong(id) });
  if (q.isLoading) return <Loader2 className="mx-auto mt-24 h-6 w-6 animate-spin text-primary" />;
  if (!q.data)
    return (
      <p className="mt-24 text-center text-muted-foreground">
        Song not found. <Link to="/songs" className="text-primary underline">Back to the directory</Link>
      </p>
    );
  const s = q.data;
  return (
    <>
      <SongPlayer image={s.photoUrl} audioUrl={s.audioUrl} title={s.title} styles={s.styles} sections={s.sections} />
      <p className="mx-auto -mt-6 flex max-w-6xl flex-wrap items-center gap-x-3 px-6 pb-6 text-xs text-muted-foreground">
        <span>by {s.author_name ?? "Someone"}</span>·<span>{new Date(s.created_at).toLocaleString()}</span>
        {s.location_name && <>·<span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location_name}</span></>}
        ·<span>{s.analysis_model} + {s.music_model}</span>
      </p>
    </>
  );
}
