import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, EmptyState } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { adminAction } from "@/lib/learning.functions";
import { adminCertificates, adminCourseAction, adminCourses, adminQuizAction, adminQuizzes, adminSchools, adminStudents } from "@/lib/admin-pages.functions";

const day = (d?: string) => (d ? new Date(d).toLocaleDateString() : "");
const NAV = [["/admin-dashboard/courses", "Courses & Lessons"], ["/admin-dashboard/quizzes", "Quizzes & Questions"], ["/admin-dashboard/certificates", "Certificates"], ["/admin-dashboard/students", "Students & Roles"], ["/admin-dashboard/schools", "Schools & Papers"]] as const;

function Shell({ title, text, q, children }: { title: string; text: string; q: { isPending: boolean; error: unknown }; children: ReactNode }) {
  return <SiteLayout><section className="bl-container bl-section ah-wrap">
    <Link to="/admin-dashboard" className="bl-link">← Admin dashboard</Link>
    <nav className="ap-nav">{NAV.map(([to, l]) => <Link key={to} to={to} activeProps={{ className: "on" }}>{l}</Link>)}</nav>
    <header><h1 className="bl-page-title">{title}</h1><p className="bl-muted">{text}</p></header>
    {q.isPending ? <p>Loading…</p> : q.error ? <EmptyState title="Administrator access required" text={q.error instanceof Error ? q.error.message : "Please sign in."} action={<a href="/?auth=login" className="bl-btn bl-btn-primary">Sign in as admin</a>} /> : children}
  </section></SiteLayout>;
}
function useRun(refetch: () => unknown) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const run = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); setMsg(""); try { await fn(); await refetch(); setMsg(ok); } catch (e) { setMsg(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(false); } };
  return { busy, msg, run, Msg: () => (msg ? <p role="status" className="bl-notice">{msg}</p> : null) };
}
const Stats = ({ items }: { items: [string, ReactNode][] }) => <div className="ah-stats">{items.map(([l, v]) => <div key={l}><b>{v}</b><small>{l}</small></div>)}</div>;
const Search = ({ value, set, ph }: { value: string; set: (v: string) => void; ph: string }) => <input className="ap-search" value={value} onChange={(e) => set(e.target.value)} placeholder={ph} aria-label={ph} />;

export function AdminCoursesPage() {
  const load = useServerFn(adminCourses); const act = useServerFn(adminCourseAction);
  const q = useQuery({ queryKey: ["admin-courses"], queryFn: () => load(), retry: false });
  const { busy, run, Msg } = useRun(q.refetch);
  const [edit, setEdit] = useState<{ id: number | null; name: string; description: string } | null>(null);
  const [subject, setSubject] = useState<number | "">("");
  const d = q.data;
  const lessons = (d?.lessons ?? []).filter((l) => subject === "" || l.subject_id === subject);
  return <Shell title="Courses & Lessons" text="Add courses, publish or hide lessons. Write lesson content in the content editor." q={q}>
    <Stats items={[["Courses", d?.subjects.length ?? 0], ["Lessons", d?.lessons.length ?? 0], ["Published lessons", d?.lessons.filter((l) => l.is_published).length ?? 0], ["Enrollments", d?.subjects.reduce((s, x) => s + x.enrollments, 0) ?? 0]]} />
    <Msg />
    <div className="ap-bar"><Button onClick={() => setEdit({ id: null, name: "", description: "" })}>Add course</Button><Link to="/admin" className="bl-btn bl-btn-outline">Open lesson & question editor</Link></div>
    {edit && <form className="ap-form" onSubmit={(e) => { e.preventDefault(); void run(() => act({ data: { kind: "save_subject", ...edit } }), "Course saved.").then(() => setEdit(null)); }}>
      <input required minLength={2} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Course name" aria-label="Course name" />
      <input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="Short description" aria-label="Description" />
      <Button disabled={busy}>Save</Button><Button type="button" variant="outline" onClick={() => setEdit(null)}>Cancel</Button></form>}
    <div className="bl-table-wrap"><table className="bl-table"><thead><tr><th>Course</th><th>Lessons</th><th>Published</th><th>Enrolled</th><th>Actions</th></tr></thead><tbody>
      {d?.subjects.map((s) => <tr key={s.id}><td><b>{s.name}</b><br /><small className="bl-muted">{s.description}</small></td><td>{s.lessons}</td><td>{s.published}</td><td>{s.enrollments}</td>
        <td className="ap-act"><Button variant="outline" onClick={() => setEdit({ id: s.id, name: s.name, description: s.description ?? "" })}>Edit</Button>
          <Button variant="outline" disabled={busy} onClick={() => { if (window.confirm(`Delete ${s.name}? This can't be undone.`)) void run(() => act({ data: { kind: "delete_subject", id: s.id } }), "Course deleted."); }}>Delete</Button></td></tr>)}
    </tbody></table></div>
    <h2 className="bl-h2 bl-mt-lg">Lessons</h2>
    <select className="ap-search" value={subject} onChange={(e) => setSubject(e.target.value ? Number(e.target.value) : "")} aria-label="Filter by course"><option value="">All courses</option>{d?.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
    <div className="bl-table-wrap"><table className="bl-table"><thead><tr><th>Lesson</th><th>Course</th><th>Updated</th><th>Status</th></tr></thead><tbody>
      {lessons.map((l) => <tr key={l.id}><td>{l.title}</td><td>{d?.subjects.find((s) => s.id === l.subject_id)?.name}</td><td>{day(l.updated_at)}</td>
        <td><Button variant="outline" disabled={busy} onClick={() => void run(() => act({ data: { kind: "publish_lesson", id: l.id, is_published: !l.is_published } }), l.is_published ? "Lesson hidden." : "Lesson published.")}>{l.is_published ? "Published · Hide" : "Draft · Publish"}</Button></td></tr>)}
    </tbody></table>{!lessons.length && <p className="bl-muted">No lessons.</p>}</div>
  </Shell>;
}

export function AdminQuizzesPage() {
  const load = useServerFn(adminQuizzes); const act = useServerFn(adminQuizAction);
  const q = useQuery({ queryKey: ["admin-quizzes"], queryFn: () => load(), retry: false });
  const { busy, run, Msg } = useRun(q.refetch);
  const [subject, setSubject] = useState<number | "">(""); const [search, setSearch] = useState("");
  const d = q.data;
  const list = (d?.questions ?? []).filter((x) => (subject === "" || x.subject_id === subject) && x.prompt.toLowerCase().includes(search.toLowerCase()));
  return <Shell title="Quizzes & Questions" text="Publish, hide or delete practice questions. Add new questions in the editor." q={q}>
    <Stats items={[["Questions", d?.questions.length ?? 0], ["Published", d?.questions.filter((x) => x.is_published).length ?? 0], ["Quiz attempts", d?.attempts ?? 0], ["Average score", d?.averageScore == null ? "—" : `${d.averageScore}%`]]} />
    <Msg />
    <div className="ap-bar"><Search value={search} set={setSearch} ph="Search questions" /><select className="ap-search" value={subject} onChange={(e) => setSubject(e.target.value ? Number(e.target.value) : "")} aria-label="Filter by course"><option value="">All courses</option>{d?.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><Link to="/admin" className="bl-btn bl-btn-outline">Add questions</Link></div>
    <div className="bl-table-wrap"><table className="bl-table"><thead><tr><th>Question</th><th>Course</th><th>Exam</th><th>Actions</th></tr></thead><tbody>
      {list.map((x) => <tr key={x.id}><td>{x.prompt.slice(0, 140)}</td><td>{d?.subjects.find((s) => s.id === x.subject_id)?.name}</td><td>{x.exam_type}</td>
        <td className="ap-act"><Button variant="outline" disabled={busy} onClick={() => void run(() => act({ data: { kind: "publish", id: String(x.id), is_published: !x.is_published } }), "Question updated.")}>{x.is_published ? "Hide" : "Publish"}</Button>
          <Button variant="outline" disabled={busy} onClick={() => { if (window.confirm("Delete this question?")) void run(() => act({ data: { kind: "delete", id: String(x.id) } }), "Question deleted."); }}>Delete</Button></td></tr>)}
    </tbody></table>{!list.length && <p className="bl-muted">No questions match.</p>}</div>
  </Shell>;
}

export function AdminCertificatesPage() {
  const load = useServerFn(adminCertificates);
  const q = useQuery({ queryKey: ["admin-certs"], queryFn: () => load(), retry: false });
  const [search, setSearch] = useState("");
  const list = (q.data ?? []).filter((c) => `${c.learner_name} ${c.subject_name}`.toLowerCase().includes(search.toLowerCase()));
  const month = new Date().toISOString().slice(0, 7);
  return <Shell title="Certificates" text="Every certificate issued to learners when they complete a course." q={q}>
    <Stats items={[["Issued", q.data?.length ?? 0], ["This month", q.data?.filter((c) => c.issued_at.startsWith(month)).length ?? 0], ["Learners", new Set(q.data?.map((c) => c.user_id)).size], ["Courses", new Set(q.data?.map((c) => c.subject_name)).size]]} />
    <Search value={search} set={setSearch} ph="Search learner or course" />
    <div className="bl-table-wrap"><table className="bl-table"><thead><tr><th>Learner</th><th>Course</th><th>Issued</th><th>Certificate ID</th></tr></thead><tbody>
      {list.map((c) => <tr key={c.id}><td>{c.learner_name}</td><td>{c.subject_name}</td><td>{day(c.issued_at)}</td><td><code>{String(c.id).slice(0, 8)}</code></td></tr>)}
    </tbody></table>{!list.length && <p className="bl-muted">No certificates found.</p>}</div>
  </Shell>;
}

export function AdminStudentsPage() {
  const load = useServerFn(adminStudents); const act = useServerFn(adminAction);
  const q = useQuery({ queryKey: ["admin-students"], queryFn: () => load(), retry: false });
  const { busy, run, Msg } = useRun(q.refetch);
  const [search, setSearch] = useState(""); const [role, setRole] = useState("");
  const list = (q.data ?? []).filter((s) => (!role || s.role === role) && `${s.name} ${s.school} ${s.county}`.toLowerCase().includes(search.toLowerCase()));
  return <Shell title="Students & Roles" text="See every account's progress and change roles." q={q}>
    <Stats items={[["Accounts", q.data?.length ?? 0], ["Students", q.data?.filter((s) => s.role === "student").length ?? 0], ["Teachers", q.data?.filter((s) => s.role === "teacher").length ?? 0], ["Admins", q.data?.filter((s) => s.role === "admin").length ?? 0]]} />
    <Msg />
    <div className="ap-bar"><Search value={search} set={setSearch} ph="Search name, school or county" /><select className="ap-search" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role"><option value="">All roles</option>{["student", "teacher", "school_admin", "admin"].map((r) => <option key={r}>{r}</option>)}</select></div>
    <div className="bl-table-wrap"><table className="bl-table"><thead><tr><th>Name</th><th>School</th><th>Courses</th><th>Quizzes</th><th>Certificates</th><th>Joined</th><th>Role</th></tr></thead><tbody>
      {list.map((s) => <tr key={s.id}><td>{s.name}<br /><small className="bl-muted">{s.grade}</small></td><td>{s.school}{s.county && ` · ${s.county}`}</td><td>{s.enrollments}</td><td>{s.attempts}</td><td>{s.certificates}</td><td>{day(s.joined)}</td>
        <td><select aria-label={`Role for ${s.name}`} disabled={busy} value={s.role} onChange={(e) => { const r = e.target.value as "student"; if (window.confirm(`Change ${s.name} to ${r}?`)) void run(() => act({ data: { kind: "role", user_id: s.id, role: r } }), "Role updated."); }}>{["student", "teacher", "school_admin", "admin"].map((r) => <option key={r}>{r}</option>)}</select></td></tr>)}
    </tbody></table>{!list.length && <p className="bl-muted">No accounts match.</p>}</div>
  </Shell>;
}

export function AdminSchoolsPage() {
  const load = useServerFn(adminSchools); const act = useServerFn(adminAction);
  const q = useQuery({ queryKey: ["admin-schools"], queryFn: () => load(), retry: false });
  const { busy, run, Msg } = useRun(q.refetch);
  const d = q.data;
  return <Shell title="Schools & Papers" text="Verify schools and publish WASSCE past papers." q={q}>
    <Stats items={[["Schools", d?.schools.length ?? 0], ["Verified", d?.schools.filter((s) => s.status === "verified").length ?? 0], ["Pending", d?.schools.filter((s) => s.status === "pending").length ?? 0], ["Past papers", d?.papers.length ?? 0]]} />
    <Msg />
    <h2 className="bl-h2">Schools</h2>
    <div className="bl-table-wrap"><table className="bl-table"><thead><tr><th>School</th><th>Location</th><th>Added</th><th>Status</th></tr></thead><tbody>
      {d?.schools.map((s) => <tr key={s.id}><td>{s.name}</td><td>{[s.county, s.city, s.address].filter(Boolean).join(" · ")}</td><td>{day(s.created_at)}</td>
        <td><select aria-label={`Status for ${s.name}`} disabled={busy} value={s.status} onChange={(e) => void run(() => act({ data: { kind: "school", id: s.id, status: e.target.value as "verified" } }), "School updated.")}>{["pending", "verified", "rejected"].map((x) => <option key={x}>{x}</option>)}</select></td></tr>)}
    </tbody></table>{!d?.schools.length && <p className="bl-muted">No schools yet.</p>}</div>
    <h2 className="bl-h2 bl-mt-lg">Past Papers</h2>
    <div className="ap-bar"><Link to="/management" className="bl-btn bl-btn-outline">Add or edit papers</Link></div>
    <div className="bl-table-wrap"><table className="bl-table"><thead><tr><th>Paper</th><th>Course</th><th>Exam</th><th>Status</th></tr></thead><tbody>
      {d?.papers.map((p) => <tr key={p.id}><td>{p.title}</td><td>{d.subjects.find((s) => s.id === p.subject_id)?.name}</td><td>{p.examination} {p.exam_year}</td>
        <td><Button variant="outline" disabled={busy} onClick={() => void run(() => act({ data: { kind: "paper", id: p.id, title: p.title, examination: p.examination, exam_year: p.exam_year, subject_id: p.subject_id, file_path: p.file_path, is_published: !p.is_published } }), "Paper updated.")}>{p.is_published ? "Published · Hide" : "Draft · Publish"}</Button></td></tr>)}
    </tbody></table>{!d?.papers.length && <p className="bl-muted">No past papers yet.</p>}</div>
  </Shell>;
}
