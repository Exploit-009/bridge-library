import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, ClipboardList, FileQuestion, Globe, GraduationCap, LayoutDashboard, School, UserCheck, Users } from "lucide-react";
import { SiteLayout, EmptyState } from "@/components/site/SiteChrome";
import { adminOverview } from "@/lib/admin-overview.functions";

const show = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString());
const day = (d: string) => new Date(d).toLocaleDateString();

export function AdminHubPage() {
  const load = useServerFn(adminOverview);
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => load(), retry: false });
  const d = q.data;
  const s = d?.stats;

  const sections = [
    { Icon: BookOpen, title: "Courses & Lessons", text: `${show(s?.courses)} courses · ${show(s?.lessons)} lessons`, to: "/admin" as const, cta: "Manage courses" },
    { Icon: FileQuestion, title: "Quizzes & Questions", text: `${show(s?.publishedQuestions)} of ${show(s?.questions)} questions published`, to: "/admin" as const, cta: "Manage quizzes" },
    { Icon: Award, title: "Certificates", text: `${show(s?.certificates)} certificates issued`, to: "/management" as const, cta: "View records" },
    { Icon: Users, title: "Students & Roles", text: `${show(s?.users)} accounts · ${show(s?.enrollments)} enrollments`, to: "/management" as const, cta: "Manage students" },
    { Icon: UserCheck, title: "Teacher Approvals", text: `${show(s?.teachers)} approved teachers`, to: "/teacher-approvals" as const, cta: "Review requests" },
    { Icon: School, title: "Schools & Papers", text: "Schools, past papers and scholarships", to: "/management" as const, cta: "Open management" },
    { Icon: Globe, title: "Website Content", text: "News, events, contacts, FAQs, policies", to: "/site-content" as const, cta: "Edit content" },
  ];

  return (
    <SiteLayout>
      <section className="bl-container bl-section ah-wrap">
        <header className="ah-head"><span><LayoutDashboard size={26} /></span><div><h1>Admin Dashboard</h1><p className="bl-muted">Manage courses, quizzes, certificates and students from one place.</p></div></header>
        {q.isPending ? <p>Loading dashboard…</p> : q.error ? <EmptyState title="Administrator access required" text={q.error instanceof Error ? q.error.message : "Please sign in."} action={<a href="/?auth=login" className="bl-btn bl-btn-primary">Sign in as admin</a>} /> : <>
          <div className="ah-stats">
            {([[Users, "Accounts", s?.users], [BookOpen, "Courses", s?.courses], [ClipboardList, "Quiz attempts", s?.attempts], [Award, "Certificates", s?.certificates], [GraduationCap, "Avg. recent score", s?.averageScore == null ? null : `${s.averageScore}%`]] as const).map(([I, l, v]) =>
              <div key={l}><I size={20} /><b>{typeof v === "string" ? v : show(v as number | null)}</b><small>{l}</small></div>)}
          </div>
          <div className="ah-cards">{sections.map(({ Icon, title, text, to, cta }) =>
            <article key={title}><span><Icon size={20} /></span><h3>{title}</h3><p>{text}</p><Link to={to} className="bl-link">{cta} →</Link></article>)}</div>
          <div className="ah-lists">
            <section><h2>Newest Students</h2>
              {d?.recentStudents.length ? <table className="bl-table"><thead><tr><th>Name</th><th>School</th><th>Joined</th></tr></thead><tbody>{d.recentStudents.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.school}{r.county && ` · ${r.county}`}</td><td>{day(r.joined)}</td></tr>)}</tbody></table> : <p className="bl-muted">No students yet.</p>}
              <Link to="/management" className="bl-link">All students →</Link></section>
            <section><h2>Recent Certificates</h2>
              {d?.recentCertificates == null ? <p className="bl-muted">Certificate records aren't readable for admins yet.</p> : d.recentCertificates.length ? <ul className="ah-certs">{d.recentCertificates.map((c) => <li key={c.id}><Award size={16} /><div><b>{c.learner_name}</b><small>{c.subject_name} · {day(c.issued_at)}</small></div></li>)}</ul> : <p className="bl-muted">No certificates issued yet.</p>}</section>
          </div>
        </>}
      </section>
    </SiteLayout>
  );
}
