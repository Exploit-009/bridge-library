import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, ExternalLink, GraduationCap, MapPin, Newspaper } from "lucide-react";
import { LearnerShell } from "@/components/learning/LearnerPages";
import { EmptyState } from "@/components/site/SiteChrome";
import { referencePhotos } from "@/lib/reference-photos";
import { parseBlocks, parseEvents, safeUrl, useSiteContent, type SiteEvent } from "@/lib/site-content";
import { supabase } from "@/lib/supabase";

function useScholarships() {
  return useQuery({
    queryKey: ["public-scholarships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("scholarships").select("id,title,organization,description,application_url,deadline").eq("is_published", true).order("deadline").limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}
const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toISOString().slice(0, 10);

function EventCard({ e }: { e: SiteEvent }) {
  const d = e.date ? new Date(`${e.date}T12:00:00`) : null;
  return <article className="ne-event">
    <div className="ne-date">{d ? <><b>{d.getDate()}</b><span>{d.toLocaleString(undefined, { month: "short" })}</span></> : <span>TBA</span>}</div>
    <div><h3>{e.title}</h3>{e.place && <small><MapPin size={13} /> {e.place}</small>}{e.details && <p>{e.details}</p>}</div>
  </article>;
}

export function NewsPage() {
  const c = useSiteContent();
  const s = useScholarships();
  const news = parseBlocks(c.data?.news);
  const events = parseEvents(c.data?.events).filter((e) => !e.date || e.date >= today()).slice(0, 3);
  return <LearnerShell active="news">
    <section className="bl-news-banner"><img src={referencePhotos.news} alt="Liberian students outside their school" /><div><h1>Education<br />News & Updates</h1><p>Education announcements and opportunities for the BridgeLIB community.</p></div></section>
    <div className="bl-news-layout">
      <section className="bl-news-section">
        <h2><Newspaper size={20} /> Latest Education News</h2>
        {c.isPending ? <p>Loading news…</p> : news.length ? <div className="ne-list">{news.map(([h, t], i) => <article key={i} className="ne-news"><h3>{h}</h3>{t && <p>{t}</p>}</article>)}</div>
          : <EmptyState title="No published announcements yet" text="BridgeLIB admins can post news from Website content." action={<Link to="/wassce" className="bl-btn bl-btn-primary">WASSCE Preparation <ArrowRight size={15} /></Link>} />}
        <h2 className="bl-mt-lg"><GraduationCap size={20} /> Scholarships & Opportunities</h2>
        {s.isPending ? <p>Loading…</p> : s.data?.length ? <div className="ne-list">{s.data.map((x) => { const href = safeUrl(x.application_url ?? undefined); return <article key={x.id} className="ne-news"><h3>{x.title}</h3><small>{x.organization}{x.deadline && ` · Deadline ${fmt(x.deadline)}`}</small>{x.description && <p>{x.description}</p>}{href && <a href={href} target="_blank" rel="noopener noreferrer" className="bl-link">Apply <ExternalLink size={13} /></a>}</article>; })}</div> : <p className="bl-muted">No scholarships are open right now.</p>}
      </section>
      <aside><section className="bl-news-section"><h2><CalendarDays size={20} /> Upcoming Events</h2>
        {events.length ? events.map((e, i) => <EventCard key={i} e={e} />) : <p>No confirmed events have been posted.</p>}
        <Link to="/events" className="bl-link">View all events <ArrowRight size={14} /></Link></section></aside>
    </div>
  </LearnerShell>;
}

export function EventsPage() {
  const c = useSiteContent();
  const all = parseEvents(c.data?.events);
  const upcoming = all.filter((e) => !e.date || e.date >= today());
  const past = all.filter((e) => e.date && e.date < today()).reverse();
  return <LearnerShell active="events">
    <section className="bl-news-banner"><img src={referencePhotos.news} alt="Students at school" /><div><h1>Education Events</h1><p>Learning opportunities and community dates.</p></div></section>
    <h2 className="bl-h2"><CalendarDays size={20} /> Upcoming Events</h2>
    {c.isPending ? <p>Loading events…</p> : upcoming.length ? <div className="ne-grid">{upcoming.map((e, i) => <EventCard key={i} e={e} />)}</div>
      : <EmptyState title="No confirmed events yet" text="BridgeLIB admins can post events from Website content." action={<Link to="/news" className="bl-btn bl-btn-primary">News & Updates <ArrowRight size={15} /></Link>} />}
    {past.length > 0 && <><h2 className="bl-h2 bl-mt-lg">Past Events</h2><div className="ne-grid ne-past">{past.map((e, i) => <EventCard key={i} e={e} />)}</div></>}
  </LearnerShell>;
}
