import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, UserCheck, UserX } from "lucide-react";
import { SiteLayout, EmptyState } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { approveTeacher, rejectTeacher, teacherRequests } from "@/lib/teacher-approval.functions";

export function TeacherApprovalsPage() {
  const list = useServerFn(teacherRequests);
  const approve = useServerFn(approveTeacher);
  const reject = useServerFn(rejectTeacher);
  const q = useQuery({ queryKey: ["teacher-requests"], queryFn: () => list(), retry: false });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const pending = (q.data ?? []).filter((r) => !r.approved);
  const done = (q.data ?? []).filter((r) => r.approved);

  async function unlock(id: string, name: string) {
    if (!window.confirm(`Unlock teacher tools for ${name}?`)) return;
    setBusy(id); setMsg("");
    try { await approve({ data: { user_id: id } }); await q.refetch(); setMsg(`${name} is now a teacher.`); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Could not approve."); }
    finally { setBusy(""); }
  }

  async function decline(id: string, name: string) {
    if (!window.confirm(`Reject ${name}'s teacher request? Their account stays active as a student.`)) return;
    setBusy(id); setMsg("");
    try { await reject({ data: { user_id: id } }); await q.refetch(); setMsg(`${name}'s request was rejected.`); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Could not reject."); }
    finally { setBusy(""); }
  }

  return (
    <SiteLayout>
      <section className="bl-container bl-section ta-wrap">
        <Link to="/admin-dashboard" className="bl-link">← Admin dashboard</Link>
        <h1 className="bl-page-title bl-mt">Teacher Approvals</h1>
        <p className="bl-muted">Teachers who signed up at /signup/teacher appear here. Approving unlocks their teacher dashboard.</p>
        {msg && <p role="status" className="bl-mt">{msg}</p>}
        {q.isPending ? <p className="bl-mt">Loading requests…</p>
          : q.error ? <EmptyState title="Approvals unavailable" text={q.error instanceof Error ? q.error.message : "Please try again."} action={<a href="/admin-login" className="bl-btn bl-btn-primary">Sign in as admin</a>} />
          : <>
            <h2 className="bl-h2 bl-mt-lg">Pending ({pending.length})</h2>
            {!pending.length ? <p className="bl-muted">No teacher requests waiting.</p> :
              <div className="bl-table-wrap"><table className="bl-table"><thead><tr><th>Name</th><th>School</th><th>Teaches</th><th>Requested</th><th>Action</th></tr></thead><tbody>
                {pending.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.school}{r.county && ` · ${r.county}`}</td><td>{r.subject}{r.level && ` · ${r.level}`}</td><td>{new Date(r.requestedAt).toLocaleDateString()}</td>
                  <td><Button disabled={busy === r.id} onClick={() => void unlock(r.id, r.name)}><UserCheck size={16} /> {busy === r.id ? "Working…" : "Approve"}</Button>{" "}
                    <Button variant="outline" disabled={busy === r.id} onClick={() => void decline(r.id, r.name)}><UserX size={16} /> Reject</Button></td></tr>)}
              </tbody></table></div>}
            {done.length > 0 && <><h2 className="bl-h2 bl-mt-lg">Approved</h2>
              <ul className="ta-done">{done.map((r) => <li key={r.id}><CheckCircle2 size={16} /> {r.name} — {r.subject || "Teacher"}</li>)}</ul></>}
          </>}
      </section>
    </SiteLayout>
  );
}
