import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — BridgeLIB" },
      { name: "description", content: "Sign in to the BridgeLIB admin dashboard." },
      { property: "og:title", content: "Admin Sign In — BridgeLIB" },
      { property: "og:description", content: "Administrator access to BridgeLIB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(f.get("email") ?? "").trim(),
        password: String(f.get("password") ?? ""),
      });
      if (error) throw error;
      const r = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" } as never);
      if (!r.data) {
        await supabase.auth.signOut();
        throw new Error("This account doesn't have administrator access.");
      }
      await navigate({ to: "/admin-dashboard" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign in failed.");
    } finally { setBusy(false); }
  }

  return (
    <SiteLayout>
      <section className="bl-container bl-section" style={{ maxWidth: 420 }}>
        <div className="bl-card" style={{ padding: 28 }}>
          <ShieldCheck size={32} className="text-primary" />
          <h1 className="bl-page-title bl-mt">Admin sign in</h1>
          <p className="bl-muted">Use your administrator email and password.</p>
          <form onSubmit={submit} className="bl-mt" style={{ display: "grid", gap: 12 }}>
            <label>Email<input name="email" type="email" required autoComplete="email" className="bl-input" style={{ width: "100%" }} /></label>
            <label>Password<input name="password" type="password" required autoComplete="current-password" className="bl-input" style={{ width: "100%" }} /></label>
            {err && <p role="alert" className="text-destructive">{err}</p>}
            <Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
            <a href="/?auth=login" className="bl-link">Forgot password? Use the main sign-in</a>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
