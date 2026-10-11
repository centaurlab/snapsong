import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//") ? (s["redirect"] as string) : "/",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — SnapSong" },
      { name: "description", content: "Sign in to SnapSong to publish your photo songs." },
      { property: "og:title", content: "Sign in — SnapSong" },
      { property: "og:description", content: "Sign in to SnapSong to publish your photo songs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        const r = z.string().trim().email().safeParse(email);
        if (!r.success) throw new Error("Enter a valid email");
        const { error } = await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("Check your inbox for a link to reset your password.");
        return;
      }
      const parsed = schema.safeParse({ email, password });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim().slice(0, 80) || undefined } },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Almost there — check your email to confirm your account.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
      }
      navigate({ to: redirect, replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-3xl font-semibold">{title}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {mode === "forgot" ? "We'll email you a reset link." : "Sign in to publish songs to the directory."}
      </p>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />}
        <Input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {mode !== "forgot" && (
          <Input type="password" placeholder="Password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
        )}
        <Button type="submit" className="w-full rounded-full" disabled={busy}>
          {busy ? "One moment…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </Button>
      </form>
      {notice && <p className="mt-4 rounded-lg border border-border bg-card p-3 text-sm">{notice}</p>}
      <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
        {mode === "signin" && (
          <>
            <button className="text-left hover:text-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>
            <button className="text-left hover:text-foreground" onClick={() => setMode("signup")}>New here? <span className="text-primary">Create an account</span></button>
          </>
        )}
        {mode !== "signin" && (
          <button className="text-left hover:text-foreground" onClick={() => setMode("signin")}>Back to sign in</button>
        )}
      </div>
    </main>
  );
}
