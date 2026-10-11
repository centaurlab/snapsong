import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { listSongs } from "@/lib/songs-db";

export const Route = createFileRoute("/songs/")({
  head: () => ({
    meta: [
      { title: "Song Directory — Snapsong" },
      { name: "description", content: "Listen to songs people made from their photos on Snapsong." },
      { property: "og:title", content: "Song Directory — Snapsong" },
      { property: "og:description", content: "Listen to songs people made from their photos on Snapsong." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: Directory,
});

function Directory() {
  const q = useQuery({ queryKey: ["songs"], queryFn: listSongs });
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-4xl font-extrabold md:text-5xl">
        The <span className="text-sunset italic">directory</span>
      </h1>
      <p className="mt-2 text-muted-foreground">Songs people have published from their photos.</p>
      {q.isLoading && <Loader2 className="mt-10 h-6 w-6 animate-spin text-primary" />}
      {q.error && <p className="mt-10 text-sm text-destructive">Couldn't load songs.</p>}
      {q.data && !q.data.length && (
        <p className="mt-10 text-muted-foreground">
          No songs yet. <Link to="/" className="text-primary underline">Make the first one</Link>.
        </p>
      )}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((s) => (
          <Link key={s.id} to="/songs/$id" params={{ id: s.id }} className="group overflow-hidden rounded-3xl border border-border bg-card transition hover:border-primary hover:shadow-glow">
            <img src={s.photoUrl} alt={s.title} className="aspect-square w-full object-cover transition group-hover:scale-[1.02]" />
            <div className="space-y-1 p-4">
              <h2 className="font-display text-xl font-bold">{s.title}</h2>
              <p className="text-sm text-muted-foreground">by {s.author_name ?? "Someone"} · {new Date(s.created_at).toLocaleDateString()}</p>
              {s.location_name && (
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /> {s.location_name}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
