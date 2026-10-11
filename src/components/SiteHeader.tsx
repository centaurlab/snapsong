import { Link } from "@tanstack/react-router";
import { Disc3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { displayName, signInWithGoogle, useUser } from "@/lib/use-session";
import { toast } from "sonner";

export function SiteHeader() {
  const { user, ready } = useUser();
  const name = displayName(user);
  const avatar = (user?.user_metadata as Record<string, string> | undefined)?.avatar_url;
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <Disc3 className="h-6 w-6 text-primary" /> Snapsong
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground">
            Make a song
          </Link>
          <Link to="/songs" activeProps={{ className: "text-foreground" }} className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground">
            Directory
          </Link>
          {ready && !user && (
            <Button size="sm" variant="secondary" className="ml-2 rounded-full" onClick={() => signInWithGoogle().catch((e) => toast.error(e.message))}>
              Sign in with Google
            </Button>
          )}
          {user && (
            <div className="ml-2 flex items-center gap-2">
              {avatar ? <img src={avatar} alt="" className="h-7 w-7 rounded-full" /> : null}
              <span className="hidden text-muted-foreground sm:inline">{name}</span>
              <Button size="icon" variant="ghost" aria-label="Sign out" onClick={() => supabase.auth.signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
