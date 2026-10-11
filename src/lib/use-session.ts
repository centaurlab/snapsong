import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export async function signInWithGoogle() {
  const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  if (res.error) throw res.error;
}

export function displayName(user: User | null) {
  const m = (user?.user_metadata ?? {}) as Record<string, string>;
  return m.full_name || m.name || user?.email?.split("@")[0] || "Someone";
}
