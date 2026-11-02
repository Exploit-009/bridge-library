import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Newspaper, Plus, Send, LogOut, Pencil, Trash2 } from "lucide-react";
import { SiteLayout, EmptyState } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { adminNews, publishNews } from "@/lib/admin-news.functions";
import { announcementSchema, type Announcement } from "@/lib/announcements";
import { siteContentQueryKey } from "@/lib/site-content";
import { supabase } from "@/lib/supabase";

export function AdminNewsPage() {
  const load = useServerFn(adminNews);
  const publish = useServerFn(publishNews);
  const cache = useQueryClient();
  const navigate = useNavigate();
  const news = useQuery({ queryKey: ["admin-news"], queryFn: () => load(), retry: false });
  const [editor, setEditor] = useState<Announcement | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function newArticle() {
    setEditor({ slug: `update-${crypto.randomUUID()}`, title: "", content: "", date: new Date().toISOString().slice(0, 10) });
    setPreview(false); setError(""); setMessage("");
  }
  async function save(action: { kind: "publish"; article: Announcement } | { kind: "remove"; slug: string }) {
    if (!news.data) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await publish({ data: { revision: news.data.revision, action } });
      cache.setQueryData(["admin-news"], result);
      await cache.invalidateQueries({ queryKey: siteContentQueryKey });
      setEditor(null); setPreview(false);
      setMessage(action.kind === "publish" ? "Published. Your announcement is live on the News portal." : "Announcement removed from the News portal.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save announcement."); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = announcementSchema.safeParse(editor);
    if (!parsed.success) { setError("Enter a title, a valid date and an announcement of at least 10 characters."); return; }
    void save({ kind: "publish", article: parsed.data });
  }
  async function signOut() {
    await cache.cancelQueries(); cache.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/admin-login", search: { next: "news" }, replace: true });
  }

  return <SiteLayout><section className="bl-container bl-section ah-wrap">
    <Link to="/admin-dashboard" className="bl-link">← Admin dashboard</Link>
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3"><Newspaper className="text-primary" size={30} /><div><h1 className="bl-page-title">News dashboard</h1><p className="bl-muted">BridgeLIB announcements</p></div></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link to="/news"><Eye size={16} />View portal</Link></Button>{news.data && <Button variant="outline" onClick={() => void signOut()}><LogOut size={16} />Sign out</Button>}</div>
    </header>
    {news.isPending ? <p role="status">Loading announcements…</p> : news.error ? <EmptyState title="Administrator access required" text={news.error.message} action={<div className="flex flex-wrap gap-2"><Button asChild><Link to="/admin-login" search={{ next: "news" }}>Sign in as admin</Link></Button><Button variant="outline" onClick={() => void news.refetch()}>Retry</Button></div>} /> : <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4"><b>{news.data?.articles.length ?? 0} published announcements</b><Button disabled={busy} onClick={newArticle}><Plus size={16} />New announcement</Button></div>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {message && <p role="status" className="bl-notice">{message}</p>}
      {editor && <form onSubmit={submit} className="grid max-w-3xl gap-4 py-4">
        <h2 className="text-xl font-bold">{news.data?.articles.some((article) => article.slug === editor.slug) ? "Edit announcement" : "New announcement"}</h2>
        <label className="grid gap-1 font-semibold">Title<input className="rounded-md border border-input bg-card px-3 py-2 font-normal" required minLength={3} maxLength={180} value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} /></label>
        <label className="grid gap-1 font-semibold">Publication date<input className="w-full max-w-xs rounded-md border border-input bg-card px-3 py-2 font-normal" type="date" required value={editor.date} onChange={(e) => setEditor({ ...editor, date: e.target.value })} /></label>
        <label className="grid gap-1 font-semibold">Announcement<textarea className="rounded-md border border-input bg-card px-3 py-2 font-normal" rows={10} required minLength={10} maxLength={20000} value={editor.content} onChange={(e) => setEditor({ ...editor, content: e.target.value })} /></label>
        <div className="flex flex-wrap gap-2"><Button disabled={busy}><Send size={16} />{busy ? "Publishing…" : "Publish announcement"}</Button><Button type="button" variant="outline" onClick={() => setPreview(!preview)}><Eye size={16} />{preview ? "Hide preview" : "Preview"}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => { setEditor(null); setPreview(false); }}>Cancel</Button></div>
        {preview && <section className="grid gap-3 border-t border-border py-5"><small className="text-muted-foreground">Preview · not published</small><h2 className="break-words text-2xl font-bold">{editor.title}</h2><time>{editor.date}</time><p className="whitespace-pre-wrap break-words">{editor.content}</p></section>}
      </form>}
      <div className="grid gap-4">{news.data?.articles.map((article) => <article key={article.slug} className="grid gap-3 rounded-lg border border-border bg-card p-5">
        <div><small className="text-muted-foreground">Published{article.date ? ` · ${article.date}` : ""}</small><h2 className="break-words text-xl font-bold">{article.title}</h2><p className="break-words text-muted-foreground">{article.content.slice(0, 180)}</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => { setEditor(article); setPreview(false); setError(""); }}><Pencil size={16} />Edit</Button><Button variant="outline" asChild><Link to="/news/$slug" params={{ slug: article.slug }}><Eye size={16} />Read</Link></Button><Button variant="outline" disabled={busy} onClick={() => { if (window.confirm(`Remove “${article.title}” from the public News portal?`)) void save({ kind: "remove", slug: article.slug }); }}><Trash2 size={16} />Remove</Button></div>
      </article>)}</div>
      {!news.data?.articles.length && !editor && <p className="bl-muted">No announcements published yet.</p>}
    </>}
  </section></SiteLayout>;
}