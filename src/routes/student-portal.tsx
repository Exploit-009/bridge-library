import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, ClipboardCheck } from "lucide-react";
import { SiteLayout, EmptyState } from "@/components/site/SiteChrome";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/student-portal")({
  head: () => ({
    meta: [
      { title: "Student Portal — BridgeLIB" },
      { name: "description", content: "Your enrolled courses, quiz scores and certificates in one place." },
      { property: "og:title", content: "Student Portal — BridgeLIB" },
      { property: "og:description", content: "See your BridgeLIB courses, scores and certificates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentPortal,
});

async function loadPortal(uid: string) {
  const [enr, att, certs] = await Promise.all([
    supabase.from("course_enrollments").select("id,subject_id,created_at,subjects(name)").eq("user_id", uid).order("created_at", { ascending: false }),
    supabase.from("exam_attempts").select("id,score,total_questions,submitted_at").eq("user_id", uid).order("submitted_at", { ascending: false }).limit(20),
    supabase.rpc("bridge_my_certificates"),
  ]);
  if (enr.error) throw enr.error;
  if (att.error) throw att.error;
  return { courses: (enr.data ?? []) as any[], attempts: att.data ?? [], certificates: (certs.data ?? []) as any[] };
}

function StudentPortal() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)); }, []);
  const q = useQuery({ queryKey: ["student-portal", uid], queryFn: () => loadPortal(uid!), enabled: !!uid });
  const pct = (s: number, t: number) => (t ? Math.round((s / t) * 100) : 0);
  const avg = q.data?.attempts.length ? Math.round(q.data.attempts.reduce((a, x) => a + pct(x.score, x.total_questions), 0) / q.data.attempts.length) : 0;

  return (
    <SiteLayout>
      <section className="bl-container bl-section">
        <h1 className="bl-page-title">Student Portal</h1>
        <p className="bl-muted">Your courses, quiz scores and certificates.</p>
        {uid === undefined || (uid && q.isPending) ? <p className="bl-mt">Loading…</p>
          : uid === null ? <EmptyState title="Sign in to see your portal" text="Your courses and scores appear here once you sign in." action={<a href="/?auth=login&next=/student-portal" className="bl-btn bl-btn-primary">Sign in</a>} />
          : q.error ? <EmptyState title="Portal unavailable" text={q.error instanceof Error ? q.error.message : "Please try again."} />
          : q.data && <>
            <div className="bl-mt-lg" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
              <div className="bl-card" style={{ padding: 16 }}><BookOpen size={20} /><h2 className="bl-h2">{q.data.courses.length}</h2><p className="bl-muted">Enrolled courses</p></div>
              <div className="bl-card" style={{ padding: 16 }}><ClipboardCheck size={20} /><h2 className="bl-h2">{avg}%</h2><p className="bl-muted">Average quiz score</p></div>
              <div className="bl-card" style={{ padding: 16 }}><Award size={20} /><h2 className="bl-h2">{q.data.certificates.length}</h2><p className="bl-muted">Certificates</p></div>
            </div>

            <h2 className="bl-h2 bl-mt-lg">My courses</h2>
            {!q.data.courses.length ? <p className="bl-muted">No courses yet. <Link to="/courses" className="bl-link">Browse courses</Link></p> :
              <ul style={{ display: "grid", gap: 8 }}>{q.data.courses.map((c) => <li key={c.id} className="bl-card" style={{ padding: 12 }}>
                <a href={`/courses/${c.subject_id}`} className="bl-link">{c.subjects?.name ?? `Course ${c.subject_id}`}</a>
                <span className="bl-muted"> · enrolled {new Date(c.created_at).toLocaleDateString()}</span></li>)}</ul>}

            <h2 className="bl-h2 bl-mt-lg">Quiz scores</h2>
            {!q.data.attempts.length ? <p className="bl-muted">No quizzes taken yet. <Link to="/practice" className="bl-link">Start practising</Link></p> :
              <div className="bl-table-wrap"><table className="bl-table"><thead><tr><th>Date</th><th>Score</th><th>%</th></tr></thead><tbody>
                {q.data.attempts.map((a) => <tr key={a.id}><td>{new Date(a.submitted_at).toLocaleDateString()}</td><td>{a.score} / {a.total_questions}</td><td>{pct(a.score, a.total_questions)}%</td></tr>)}
              </tbody></table></div>}

            <h2 className="bl-h2 bl-mt-lg">Certificates</h2>
            {!q.data.certificates.length ? <p className="bl-muted">Finish a course to earn your first certificate.</p> :
              <ul style={{ display: "grid", gap: 8 }}>{q.data.certificates.map((c) => <li key={c.id} className="bl-card" style={{ padding: 12 }}>
                <Award size={16} /> {c.subject_name} <span className="bl-muted">· {new Date(c.issued_at).toLocaleDateString()}</span> · <Link to="/certificates" className="bl-link">View</Link></li>)}</ul>}
          </>}
      </section>
    </SiteLayout>
  );
}
