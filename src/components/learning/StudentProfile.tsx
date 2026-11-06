import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import type { User as AuthUser, Factor } from '@supabase/supabase-js';
import {
  User, BookOpen, BarChart3, GraduationCap, Mail, Bookmark, Settings, HelpCircle, LogOut, MapPin, CalendarDays,
  Camera, CheckCircle2, Trophy, Clock, Pencil, Save, Lock, Bell, Globe, Moon, ChevronRight, ShieldCheck, Timer,
  Shield, Target, ArrowRight, FileBadge, X,
} from 'lucide-react';
import { SiteHeader, SiteFooter } from '@/components/site/SiteChrome';
import { StudentHeaderActions } from './StudentHeaderActions';
import { workspaceData } from '@/lib/learning.functions';
import { myCertificates } from '@/lib/reference.functions';
import { supabase } from '@/lib/supabase';
import { validateStudentPhoto } from '@/lib/student-registration';
import { PasswordField } from '@/components/account/PasswordField';
import { validateNewPassword } from '@/lib/account-access';
import { LIBERIA_COUNTIES, EDUCATION_LEVELS, educationLabel, profileFormSchema, goalSchema, averageScore, goalPercent } from '@/lib/profile-summary';
import banner from '@/assets/profile-journey-student.jpg.asset.json';
import flagPanel from '@/assets/flag-slogan-panel.jpg.asset.json';

type Prefs = { notifications?: { email?: boolean; classMessages?: boolean; news?: boolean }; language?: string; region?: string; textSize?: 'standard' | 'large' };
type Panel = null | 'password' | 'email' | 'notifications' | 'language' | 'appearance' | 'mfa' | 'logins' | 'privacy' | 'enquiries' | 'goals';

function fmtDate(d: string | Date, time = false) {
  const x = new Date(d);
  return time ? `${x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${x.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return <div className="sp-modal-back" role="presentation" onClick={onClose}><div className="sp-modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}><header><h2>{title}</h2><button type="button" aria-label="Close" onClick={onClose}><X size={18} /></button></header>{children}</div></div>;
}

function Avatar({ src, size }: { src: string; size: number }) {
  const [failed, setFailed] = useState('');
  return <span className="sp-avatar" style={{ width: size, height: size }}>{src && failed !== src ? <img src={src} alt="Your profile" onError={() => setFailed(src)} /> : <User size={size * 0.45} />}</span>;
}

export function StudentProfilePage() {
  const load = useServerFn(workspaceData); const loadCerts = useServerFn(myCertificates);
  const q = useQuery({ queryKey: ['workspace'], queryFn: () => load(), retry: false });
  const certs = useQuery({ queryKey: ['certificates'], queryFn: () => loadCerts(), retry: false });
  const [user, setUser] = useState<AuthUser | null>(null); const [authChecked, setAuthChecked] = useState(false);
  const [photo, setPhoto] = useState(''); const [panel, setPanel] = useState<Panel>(null); const [toast, setToast] = useState('');
  const navigate = useNavigate();

  async function refreshUser() {
    const { data } = await supabase.auth.getUser(); setUser(data.user); setAuthChecked(true);
    const path = data.user?.user_metadata['student_photo_path'];
    if (data.user && typeof path === 'string' && path.startsWith(`${data.user.id}/`)) { const r = await supabase.storage.from('student-photos').createSignedUrl(path, 3600); setPhoto(r.data?.signedUrl ?? ''); }
    else setPhoto('');
  }
  useEffect(() => { void refreshUser(); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);

  const d = q.data; const profile = d?.profile; const prefs = (profile?.preferences ?? {}) as Prefs;
  useEffect(() => { document.documentElement.classList.toggle('sp-large-text', prefs.textSize === 'large'); return () => document.documentElement.classList.remove('sp-large-text'); }, [prefs.textSize]);

  const myEnrollments = (d?.enrollments ?? []).filter(e => e.user_id === d?.userId);
  const allAttempts = [...(d?.attempts ?? []), ...(d?.classAttempts ?? [])];
  const avg = averageScore(allAttempts);
  const certList = certs.data ?? [];
  const activity = useMemo(() => {
    if (!d) return [];
    const subj = (id: number) => d.subjects.find(s => s.id === id)?.name ?? 'a course';
    const items = [
      ...d.attempts.map(a => ({ at: a.submitted_at, kind: 'quiz' as const, text: 'Completed: ', bold: `Practice quiz (${a.score}/${a.total_questions})` })),
      ...d.classAttempts.map(a => ({ at: a.submitted_at, kind: 'quiz' as const, text: 'Completed: ', bold: d.content.find(c => c.id === a.content_id)?.title ?? 'Class quiz' })),
      ...myEnrollments.map(e => ({ at: e.created_at, kind: 'course' as const, text: 'Enrolled in ', bold: subj(e.subject_id) })),
      ...certList.map(c => ({ at: c.issued_at, kind: 'cert' as const, text: 'Certificate issued: ', bold: c.subject_name })),
    ];
    return items.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [d, certList, myEnrollments]);

  async function savePrefs(next: Prefs) {
    if (!d) return;
    const r = await supabase.from('profiles').update({ preferences: { ...prefs, ...next } }).eq('id', d.userId);
    if (r.error) throw new Error(r.error.message); await q.refetch();
  }

  const signedOut = authChecked && !user;
  const side = (
    <aside className="sp-side" aria-label="Profile menu">
      <div className="sp-side-user"><span className="sp-side-photo"><Avatar src={photo} size={96} />{user && <i aria-hidden />}</span><div><strong>{profile?.full_name || 'Student'}</strong><span>Student</span>{user && <em className="sp-online">Online</em>}</div></div>
      <nav>
        <Link to="/profile" className="is-active"><User size={20} />My Profile</Link>
        <Link to="/my-courses"><BookOpen size={20} />My Courses</Link>
        <Link to="/progress"><BarChart3 size={20} />My Progress</Link>
        <Link to="/certificates"><FileBadge size={20} />My Certificates</Link>
        <button type="button" onClick={() => setPanel('enquiries')}><Mail size={20} />My Enquiries</button>
        <Link to="/bookmarks"><Bookmark size={20} />Bookmarks</Link>
        <Link to="/settings"><Settings size={20} />Settings</Link>
        <Link to="/faq"><HelpCircle size={20} />Help &amp; Support</Link>
        {user ? <button type="button" onClick={async () => { await supabase.auth.signOut(); await navigate({ to: '/' }); }}><LogOut size={20} />Logout</button> : <a href="/?auth=login"><LogOut size={20} />Login</a>}
      </nav>
      <img className="sp-flag-panel" src={flagPanel.url} alt="Liberian flag — Learn Today, Build Tomorrow." />
    </aside>
  );

  return <div className="bl-site sp-page">
    <SiteHeader student actions={<StudentHeaderActions />} />
    <div className="sp-layout">
      {side}
      <main className="sp-main">
        <section className="sp-banner"><img src={banner.url} alt="Smiling Liberian student outside school" /><div className="sp-banner-text"><p className="sp-banner-brand">Bridge<span>LIB</span></p><h1>Your Learning Journey<br /><b>Our Priority!</b></h1></div><p className="sp-banner-slogan">Educate • Learn • Achieve</p></section>
        {signedOut ? <section className="sp-card sp-empty"><h2>Sign in to view your profile</h2><p>Your profile, progress and settings appear here after you sign in.</p><a className="sp-btn sp-btn-primary" href="/?auth=login">Sign in</a></section>
          : q.error ? <section className="sp-card sp-empty"><h2>Profile unavailable</h2><p>{q.error instanceof Error ? q.error.message : 'Please try again.'}</p><button className="sp-btn sp-btn-primary" onClick={() => void q.refetch()}>Try again</button></section>
          : !d ? <section className="sp-card sp-empty"><p>Loading your profile…</p></section>
          : <div className="sp-grid">
            <div className="sp-col">
              <section className="sp-card sp-overview">
                <h2 className="sp-title"><User size={22} />Profile Overview</h2>
                <div className="sp-ov-body">
                  <span className="sp-ov-photo"><Avatar src={photo} size={112} /><label className="sp-cam" aria-label="Change photo"><Camera size={14} /><PhotoInput userId={d.userId} onDone={async m => { setToast(m); await refreshUser(); }} /></label></span>
                  <div className="sp-ov-info"><p className="sp-ov-name">{profile?.full_name || 'Student'} <span className="sp-badge">Student</span></p><p>{user?.email}</p><p><MapPin size={13} />{profile?.county ? `${profile.county} County, Liberia` : 'County not set'}</p><p><CalendarDays size={13} />Joined: {fmtDate(user?.created_at ?? profile?.created_at ?? new Date())}</p></div>
                </div>
                {user?.email_confirmed_at ? <p className="sp-verified"><CheckCircle2 size={18} />Account Verified</p> : <p className="sp-unverified">Email not yet verified</p>}
              </section>
              <section className="sp-card sp-stats-card">
                <h2 className="sp-title-plain">Quick Stats</h2>
                <div className="sp-stats">
                  <div className="sp-stat is-blue"><BookOpen size={26} /><b>{myEnrollments.length}</b><span>Courses Enrolled</span></div>
                  <div className="sp-stat is-green"><CheckCircle2 size={26} /><b>{avg === null ? '—' : `${avg}%`}</b><span>Average Score</span></div>
                  <div className="sp-stat is-purple"><Trophy size={26} /><b>{certList.length}</b><span>Certificates</span></div>
                  <div className="sp-stat is-orange" title="Study time is not tracked yet"><Clock size={26} /><b>—</b><span>Study Time</span></div>
                </div>
              </section>
              <section className="sp-card sp-activity">
                <div className="sp-row"><h2 className="sp-title-plain">Recent Activity</h2><Link to="/progress" className="sp-link">View All <ArrowRight size={16} /></Link></div>
                {activity.length ? <ul>{activity.slice(0, 3).map((a, i) => <li key={i}><span className={`sp-act-icon is-${a.kind}`}>{a.kind === 'quiz' ? <CheckCircle2 size={18} /> : a.kind === 'course' ? <BookOpen size={16} /> : <GraduationCap size={16} />}</span><div><p>{a.text}<b>{a.bold}</b></p><small>{fmtDate(a.at, true)}</small></div></li>)}</ul> : <p className="sp-muted">No activity yet. Enroll in a course or take a quiz to get started.</p>}
              </section>
            </div>
            <div className="sp-col">
              <EditProfile key={profile?.updated_at} d={d} email={user?.email ?? ''} photo={photo} onSaved={async m => { setToast(m); await q.refetch(); await refreshUser(); }} />
              <section className="sp-card sp-goals">
                <div className="sp-goal-head"><Target size={34} /><div><h2>Study Goals</h2><p>Set and track your learning goals.</p></div></div>
                {profile?.study_goal_target ? <><div className="sp-progress"><span><i style={{ width: `${goalPercent(certList.length, profile.study_goal_target)}%` }} /></span><b>{goalPercent(certList.length, profile.study_goal_target)}%</b></div><div className="sp-row"><p>Goal: {profile.study_goal_text || `Complete ${profile.study_goal_target} courses`} <small>({certList.length} of {profile.study_goal_target} completed)</small></p><button className="sp-btn sp-btn-outline" onClick={() => setPanel('goals')}>Update Goals</button></div></>
                  : <div className="sp-row"><p>No goal set yet.</p><button className="sp-btn sp-btn-outline" onClick={() => setPanel('goals')}>Set a Goal</button></div>}
              </section>
            </div>
            <div className="sp-col">
              <section className="sp-card sp-settings">
                <h2 className="sp-title-pill"><Settings size={26} /><span>Account Settings</span></h2>
                {([['password', Lock, 'Change Password'], ['email', Mail, 'Update Email'], ['notifications', Bell, 'Notification Preferences'], ['language', Globe, 'Language & Region'], ['appearance', Moon, 'Appearance']] as const).map(([k, Icon, label]) => <button key={k} type="button" onClick={() => setPanel(k)}><Icon size={20} />{label}<ChevronRight size={18} /></button>)}
              </section>
              <SecurityCard onOpen={setPanel} />
            </div>
          </div>}
      </main>
    </div>
    <SiteFooter />
    {toast && <p className="sp-toast" role="status">{toast}</p>}
    {panel && d && <Panels panel={panel} close={() => setPanel(null)} d={d} user={user} prefs={prefs} savePrefs={savePrefs} toast={setToast} certCount={certList.length} refetch={() => void q.refetch()} refreshUser={refreshUser} />}
    {panel === 'enquiries' && !d && <Modal title="My Enquiries" onClose={() => setPanel(null)}><p>Sign in to see your enquiries.</p></Modal>}
  </div>;
}

function PhotoInput({ userId, onDone }: { userId: string; onDone: (m: string) => void }) {
  return <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async e => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    try { onDone(await uploadPhoto(userId, f)); } catch (err) { onDone(err instanceof Error ? err.message : 'Could not upload photo.'); }
  }} />;
}

async function uploadPhoto(userId: string, f: File) {
  validateStudentPhoto(f);
  const path = `${userId}/profile.${f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg'}`;
  const up = await supabase.storage.from('student-photos').upload(path, f, { upsert: true });
  if (up.error) throw new Error('Photo storage is unavailable; your photo was not saved.');
  const meta = await supabase.auth.updateUser({ data: { student_photo_path: path } });
  if (meta.error) throw new Error('Photo uploaded, but could not be linked to your profile.');
  return 'Profile photo updated.';
}

type WS = Awaited<ReturnType<typeof workspaceData>>;

function EditProfile({ d, email, photo, onSaved }: { d: WS; email: string; photo: string; onSaved: (m: string) => void }) {
  const p = d.profile; const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  async function submit() {
    if (!formRef.current) return;
    const f = new FormData(formRef.current);
    const parsed = profileFormSchema.safeParse({ fullName: f.get('fullName'), email: f.get('email'), phone: f.get('phone'), county: f.get('county'), school: f.get('school'), educationLevel: f.get('educationLevel') });
    if (!parsed.success) { const e: Record<string, string> = {}; for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message; setErrors(e); setMsg('Please fix the highlighted fields.'); return; }
    setErrors({}); setBusy(true); setMsg('');
    try {
      const v = parsed.data;
      const r = await supabase.from('profiles').update({ full_name: v.fullName, phone: v.phone, county: v.county, school_name: v.school, education_level: v.educationLevel }).eq('id', d.userId);
      if (r.error) throw new Error(r.error.message);
      let extra = '';
      if (v.email.toLowerCase() !== email.toLowerCase()) { const u = await supabase.auth.updateUser({ email: v.email }, { emailRedirectTo: `${window.location.origin}/profile` }); if (u.error) throw new Error(`Profile saved, but email change failed: ${u.error.message}`); extra = ' Check your inbox to confirm the new email.'; }
      onSaved(`Profile saved.${extra}`);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Could not save profile.'); } finally { setBusy(false); }
  }
  const field = (name: string, label: string, input: ReactNode) => <label className={errors[name] ? 'has-error' : ''}><span>{label} <i>*</i></span>{input}{errors[name] && <small>{errors[name]}</small>}</label>;
  return <section className="sp-card sp-edit">
    <div className="sp-row sp-edit-head"><h2 className="sp-title"><Pencil size={22} />Edit Profile</h2><div><button type="button" className="sp-btn sp-btn-outline" disabled={busy} onClick={() => { formRef.current?.reset(); setErrors({}); setMsg(''); }}>Cancel</button><button type="button" className="sp-btn sp-btn-primary" disabled={busy} onClick={() => void submit()}><Save size={16} />{busy ? 'Saving…' : 'Save Changes'}</button></div></div>
    <form ref={formRef} className="sp-edit-body" onSubmit={e => { e.preventDefault(); void submit(); }} noValidate>
      <div className="sp-edit-photo"><Avatar src={photo} size={124} /><label className="sp-btn sp-btn-primary sp-btn-sm"><Camera size={15} />Change Photo<PhotoInput userId={d.userId} onDone={onSaved} /></label></div>
      <div className="sp-fields">
        {field('fullName', 'Full Name', <input name="fullName" defaultValue={p?.full_name ?? ''} maxLength={160} autoComplete="name" />)}
        {field('email', 'Email Address', <input name="email" type="email" defaultValue={email} maxLength={255} autoComplete="email" />)}
        {field('phone', 'Phone Number', <input name="phone" type="tel" defaultValue={p?.phone ?? ''} placeholder="+231 770 123 456" maxLength={25} autoComplete="tel" />)}
        {field('county', 'County', <select name="county" defaultValue={p?.county && (LIBERIA_COUNTIES as readonly string[]).includes(p.county) ? p.county : ''}><option value="" disabled>Choose county</option>{LIBERIA_COUNTIES.map(c => <option key={c}>{c}</option>)}</select>)}
        {field('school', 'School Name', <input name="school" defaultValue={p?.school_name ?? ''} maxLength={180} />)}
        {field('educationLevel', 'Education Level', <select name="educationLevel" defaultValue={EDUCATION_LEVELS.some(l => l.value === p?.education_level) ? p?.education_level ?? '' : ''}><option value="" disabled>{p?.education_level ? educationLabel(p.education_level) : 'Choose level'}</option>{EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}</select>)}
        <button hidden />
      </div>
    </form>
    {msg && <p className="sp-form-msg" role="alert">{msg}</p>}
  </section>;
}

function SecurityCard({ onOpen }: { onOpen: (p: Panel) => void }) {
  const [mfa, setMfa] = useState<boolean | null>(null);
  useEffect(() => { void supabase.auth.mfa.listFactors().then(r => setMfa(!!r.data?.totp.some(f => f.status === 'verified'))).catch(() => setMfa(false)); }, []);
  return <section className="sp-card sp-security">
    <h2 className="sp-title-pill"><Shield size={26} /><span>Privacy &amp; Security</span></h2>
    <button type="button" onClick={() => onOpen('mfa')}><div><strong>Two-Factor Authentication</strong><small>Add an extra layer of security</small></div><span className={`sp-switch ${mfa ? 'is-on' : ''}`} role="switch" aria-checked={!!mfa} aria-label="Two-factor authentication" /></button>
    <button type="button" onClick={() => onOpen('logins')}><div><strong>Login Activity</strong><small>View recent logins</small></div><Timer size={22} /></button>
    <button type="button" onClick={() => onOpen('privacy')}><div><strong>Data Privacy</strong><small>Manage your data</small></div><ShieldCheck size={22} /></button>
  </section>;
}

function Panels({ panel, close, d, user, prefs, savePrefs, toast, certCount, refetch, refreshUser }: { panel: Exclude<Panel, null>; close: () => void; d: WS; user: AuthUser | null; prefs: Prefs; savePrefs: (p: Prefs) => Promise<void>; toast: (m: string) => void; certCount: number; refetch: () => void; refreshUser: () => Promise<void> }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function run(fn: () => Promise<string | void>) { setBusy(true); setErr(''); try { const m = await fn(); if (m) { toast(m); close(); } } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong.'); } finally { setBusy(false); } }
  const foot = (label: string) => <><div className="sp-modal-foot"><button type="button" className="sp-btn sp-btn-outline" onClick={close}>Cancel</button><button className="sp-btn sp-btn-primary" disabled={busy}>{busy ? 'Saving…' : label}</button></div>{err && <p className="sp-form-msg" role="alert">{err}</p>}</>;
  if (panel === 'password') return <Modal title="Change Password" onClose={close}><form className="sp-modal-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(async () => { const pw = validateNewPassword(String(f.get('pw')), String(f.get('pw2'))); const r = await supabase.auth.updateUser({ password: pw, current_password: String(f.get('current')) }); if (r.error) throw r.error; return 'Password changed.'; }); }}><PasswordField name="current" label="Current password" current /><PasswordField name="pw" label="New password" /><PasswordField name="pw2" label="Confirm new password" />{foot('Change Password')}</form></Modal>;
  if (panel === 'email') return <Modal title="Update Email" onClose={close}><form className="sp-modal-form" onSubmit={e => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get('email')).trim(); void run(async () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new Error('Enter a valid email address.'); const r = await supabase.auth.updateUser({ email: v }, { emailRedirectTo: `${window.location.origin}/profile` }); if (r.error) throw r.error; return 'Check both inboxes to confirm your new email address.'; }); }}><p className="sp-muted">Current: {user?.email}</p><label>New email address<input name="email" type="email" required maxLength={255} /></label>{foot('Send Confirmation')}</form></Modal>;
  if (panel === 'notifications') { const n = prefs.notifications ?? {}; return <Modal title="Notification Preferences" onClose={close}><form className="sp-modal-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(async () => { await savePrefs({ notifications: { email: f.has('email'), classMessages: f.has('classMessages'), news: f.has('news') } }); return 'Notification preferences saved.'; }); }}><label className="sp-check"><input type="checkbox" name="email" defaultChecked={n.email ?? true} />Email me about account and course updates</label><label className="sp-check"><input type="checkbox" name="classMessages" defaultChecked={n.classMessages ?? true} />Show alerts for new class messages</label><label className="sp-check"><input type="checkbox" name="news" defaultChecked={n.news ?? true} />Tell me about News & Events</label>{foot('Save Preferences')}</form></Modal>; }
  if (panel === 'language') return <Modal title="Language & Region" onClose={close}><form className="sp-modal-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(async () => { await savePrefs({ language: String(f.get('language')), region: String(f.get('region')) }); return 'Language & region saved.'; }); }}><label>Language<select name="language" defaultValue={prefs.language ?? 'en'}><option value="en">English</option></select></label><small className="sp-muted">BridgeLIB is currently available in English only.</small><label>Region<select name="region" defaultValue={prefs.region ?? 'LR'}><option value="LR">Liberia</option><option value="other">Outside Liberia</option></select></label>{foot('Save')}</form></Modal>;
  if (panel === 'appearance') return <Modal title="Appearance" onClose={close}><form className="sp-modal-form" onSubmit={e => { e.preventDefault(); const v = new FormData(e.currentTarget).get('size') === 'large' ? 'large' : 'standard'; void run(async () => { await savePrefs({ textSize: v }); return 'Appearance saved.'; }); }}><p className="sp-muted">Choose a comfortable text size for your profile pages.</p><label className="sp-check"><input type="radio" name="size" value="standard" defaultChecked={prefs.textSize !== 'large'} />Standard text</label><label className="sp-check"><input type="radio" name="size" value="large" defaultChecked={prefs.textSize === 'large'} />Larger text</label>{foot('Save')}</form></Modal>;
  if (panel === 'goals') return <Modal title="Study Goals" onClose={close}><form className="sp-modal-form" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(async () => { const g = goalSchema.safeParse({ target: f.get('target'), text: f.get('text') }); if (!g.success) throw new Error(g.error.issues[0]?.message); const r = await supabase.from('profiles').update({ study_goal_target: g.data.target, study_goal_text: g.data.text || null }).eq('id', d.userId); if (r.error) throw new Error(r.error.message); refetch(); return 'Study goal saved.'; }); }}><label>Courses to complete<input name="target" type="number" min={1} max={50} required defaultValue={d.profile?.study_goal_target ?? 5} /></label><label>Goal description<input name="text" maxLength={200} placeholder="Complete 10 courses this semester" defaultValue={d.profile?.study_goal_text ?? ''} /></label><small className="sp-muted">Progress counts completed courses with an issued certificate ({certCount} so far).</small>{foot('Save Goal')}</form></Modal>;
  if (panel === 'mfa') return <MfaPanel close={close} toast={toast} />;
  if (panel === 'logins') return <Modal title="Login Activity" onClose={close}><ul className="sp-list"><li><b>Last sign-in</b><span>{user?.last_sign_in_at ? fmtDate(user.last_sign_in_at, true) : 'Unknown'}</span></li><li><b>This device</b><span>{typeof navigator !== 'undefined' ? (navigator.userAgent.split(') ')[0] ?? '').replace('(', '') + ')' : ''}</span></li><li><b>Account created</b><span>{user?.created_at ? fmtDate(user.created_at, true) : ''}</span></li></ul><p className="sp-muted">Don't recognise a sign-in? Sign out everywhere and change your password.</p><div className="sp-modal-foot"><button className="sp-btn sp-btn-primary" disabled={busy} onClick={() => void run(async () => { const r = await supabase.auth.signOut({ scope: 'others' }); if (r.error) throw r.error; return 'Signed out of all other devices.'; })}>Sign out other devices</button></div>{err && <p className="sp-form-msg">{err}</p>}</Modal>;
  if (panel === 'privacy') return <Modal title="Data Privacy" onClose={close}><p className="sp-muted">Read how we handle your information in our <Link to="/privacy" className="sp-link">Privacy Policy</Link>.</p><div className="sp-modal-stack"><button className="sp-btn sp-btn-outline" onClick={() => { const blob = new Blob([JSON.stringify({ email: user?.email, profile: d.profile, enrollments: d.enrollments.filter(e => e.user_id === d.userId), practice_attempts: d.attempts, class_quiz_attempts: d.classAttempts }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bridgelib-my-data.json'; a.click(); URL.revokeObjectURL(a.href); }}>Download my data</button><button className="sp-btn sp-btn-danger" disabled={busy} onClick={() => { if (!confirm('Send a request to delete your BridgeLIB account and data?')) return; void run(async () => { const r = await supabase.from('support_requests').insert({ user_id: d.userId, kind: 'message', subject: 'Account deletion request', message: 'Please delete my BridgeLIB account and personal data.', page: '/profile' }); if (r.error) throw new Error(r.error.message); return 'Deletion request sent. Our team will contact you.'; }); }}>Request account deletion</button></div>{err && <p className="sp-form-msg">{err}</p>}</Modal>;
  if (panel === 'enquiries') return <Enquiries close={close} userId={d.userId} />;
  void refreshUser; return null;
}

function MfaPanel({ close, toast }: { close: () => void; toast: (m: string) => void }) {
  const [factors, setFactors] = useState<Factor[] | null>(null); const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = () => supabase.auth.mfa.listFactors().then(r => { if (r.error) setErr(r.error.message); setFactors(r.data?.totp ?? []); });
  useEffect(() => { void load(); }, []);
  const verified = factors?.find(f => f.status === 'verified');
  async function act(fn: () => Promise<void>) { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : 'Two-factor setup failed.'); } finally { setBusy(false); } }
  return <Modal title="Two-Factor Authentication" onClose={close}>
    {factors === null ? <p>Loading…</p> : verified ? <><p className="sp-verified"><CheckCircle2 size={18} />Two-factor authentication is on.</p><div className="sp-modal-foot"><button className="sp-btn sp-btn-danger" disabled={busy} onClick={() => void act(async () => { const r = await supabase.auth.mfa.unenroll({ factorId: verified.id }); if (r.error) throw r.error; toast('Two-factor authentication turned off.'); close(); })}>Turn off</button></div></>
      : enroll ? <form className="sp-modal-form" onSubmit={e => { e.preventDefault(); void act(async () => { const r = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() }); if (r.error) throw r.error; toast('Two-factor authentication is now on.'); close(); }); }}><p className="sp-muted">Scan this code with an authenticator app (Google Authenticator, Authy), then enter the 6-digit code.</p><img className="sp-qr" src={enroll.qr} alt="Authenticator QR code" /><small className="sp-muted">Or enter key: {enroll.secret}</small><label>6-digit code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)} required /></label><div className="sp-modal-foot"><button className="sp-btn sp-btn-primary" disabled={busy}>Verify &amp; turn on</button></div></form>
      : <><p className="sp-muted">Two-factor authentication is off. Turn it on to require a code from your phone when signing in.</p><div className="sp-modal-foot"><button className="sp-btn sp-btn-primary" disabled={busy} onClick={() => void act(async () => { for (const f of factors.filter(f => f.status !== 'verified')) await supabase.auth.mfa.unenroll({ factorId: f.id }); const r = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `BridgeLIB ${Date.now()}` }); if (r.error) throw r.error; setEnroll({ id: r.data.id, qr: r.data.totp.qr_code, secret: r.data.totp.secret }); })}>Set up two-factor</button></div></>}
    {err && <p className="sp-form-msg" role="alert">{err}</p>}
  </Modal>;
}

function Enquiries({ close, userId }: { close: () => void; userId: string }) {
  const q = useQuery({ queryKey: ['my-enquiries', userId], queryFn: async () => { const r = await supabase.from('support_requests').select('id,kind,subject,message,status,created_at').eq('user_id', userId).order('created_at', { ascending: false }); if (r.error) throw new Error(r.error.message); return r.data; } });
  return <Modal title="My Enquiries" onClose={close}>{q.isPending ? <p>Loading…</p> : q.error ? <p className="sp-form-msg">{q.error.message}</p> : !q.data.length ? <p className="sp-muted">You haven't sent any enquiries yet. <Link to="/faq" className="sp-link">Visit the Help Center</Link>.</p> : <ul className="sp-list">{q.data.map(r => <li key={r.id}><b>{r.subject || r.kind}</b><span>{fmtDate(r.created_at, true)} · <em className={`sp-status is-${r.status}`}>{r.status.replace('_', ' ')}</em></span><p>{r.message}</p></li>)}</ul>}</Modal>;
}
