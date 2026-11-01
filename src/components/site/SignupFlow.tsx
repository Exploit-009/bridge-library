import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, CheckCircle2, Eye, EyeOff, GraduationCap, Phone, School, ShieldCheck, Sparkles, Trophy, Users, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SiteLayout, LiberiaFlag } from "./SiteChrome";
import { referencePhotos } from "@/lib/reference-photos";
import { LIBERIA_COUNTIES } from "@/lib/profile-summary";
import { academicStep, accountStep, EXAM_TYPES, GRADES, gradeEducationLevel, passwordStrength, personalStep } from "@/lib/signup-steps";

type Role = "student" | "teacher";
const STEPS = ["Personal Info", "Academic Info", "Account Setup", "Complete"];
const BENEFITS: [typeof BookOpen, string, string][] = [
  [BookOpen, "Quality Lessons", "Published lessons for every subject."],
  [Trophy, "WASSCE Practice", "Past questions and timed quizzes."],
  [Sparkles, "BridgeLIB AI", "Explanations and practice quizzes on demand."],
  [GraduationCap, "Certificates", "Earn certificates as you complete courses."],
  [ShieldCheck, "Safe & Free", "Learn securely, anytime, anywhere."],
];

export function SignupFlowPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("student");
  const [f, setF] = useState({ fullName: "", email: "", phone: "+231 ", dateOfBirth: "", gender: "", county: "", school: "", grade: "", examType: "WASSCE", password: "", confirm: "", terms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  function check(schema: typeof personalStep | typeof academicStep | typeof accountStep) {
    const r = schema.safeParse(f);
    if (r.success) { setErrors({}); return true; }
    const e: Record<string, string> = {};
    for (const i of r.error.issues) e[String(i.path[0])] ??= i.message;
    setErrors(e); return false;
  }
  const next = () => { setMsg(""); if (check(step === 0 ? personalStep : academicStep)) setStep(step + 1); };

  async function create() {
    setMsg("");
    if (!check(personalStep) || !check(academicStep)) return setMsg("Please review earlier steps.");
    if (!check(accountStep)) return;
    setBusy(true);
    try {
      const educationLevel = gradeEducationLevel(f.grade);
      const learnerPath = f.examType === "WASSCE" ? "wassce_candidate" : "school_learner";
      const { data, error } = await supabase.auth.signUp({
        email: f.email.trim().toLowerCase(), password: f.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: f.fullName.trim(), phone_number: f.phone.trim(), school_name: f.school.trim(), learner_path: learnerPath, education_level: educationLevel, grade_level: f.grade, exam_type: f.examType, date_of_birth: f.dateOfBirth, gender: f.gender, county: f.county, requested_role: role },
        },
      });
      if (error) throw error;
      if (data.session && data.user) {
        await supabase.from("profiles").update({ full_name: f.fullName.trim(), learner_path: learnerPath, education_level: educationLevel, grade_level: f.grade, school_name: f.school.trim(), county: f.county, onboarding_completed: true, updated_at: new Date().toISOString() }).eq("id", data.user.id);
      } else setNeedsConfirm(true);
      setStep(3);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not create your account."); }
    finally { setBusy(false); }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
    if (error) setMsg(error.message);
  }
  async function phoneLogin() {
    const r = personalStep.shape.phone.safeParse(f.phone);
    if (!r.success) return setMsg("Enter your +231 phone number in Step 1 first.");
    const { error } = await supabase.auth.signInWithOtp({ phone: r.data.replace(/[\s-]/g, "") });
    setMsg(error ? error.message : "We sent a code to your phone by SMS.");
  }

  const err = (k: string) => errors[k] && <small className="su-err">{errors[k]}</small>;
  const strength = passwordStrength(f.password);

  return (
    <SiteLayout>
      <div className="su-page">
        <aside className="su-hero">
          <img src={referencePhotos.join} alt="Smiling Liberian student" />
          <div className="su-hero-text">
            <p className="su-tag">Bright Students <span>Brighter Liberia</span></p>
            <h2>Join BridgeLIB Today</h2>
            <p>Start learning with lessons, WASSCE practice and AI study tools built for Liberia.</p>
            <ul className="su-stats"><li><b>10K+</b>Students</li><li><b>8+</b>Subjects</li><li><b>100%</b>Online Access</li></ul>
          </div>
        </aside>

        <section className="su-card">
          <h1>Create Your {role === "teacher" ? "Teacher" : "Student"} Account</h1>
          <ol className="su-progress">{STEPS.map((s, i) => <li key={s} className={i < step ? "done" : i === step ? "on" : ""}><span>{i < step ? <Check size={14} /> : i + 1}</span>{s}</li>)}</ol>

          <div className="su-role-mobile"><RolePicker role={role} setRole={setRole} /></div>

          {step === 0 && <div className="su-form">
            <label>Full Name<input value={f.fullName} onChange={set("fullName")} placeholder="John Doe" autoComplete="name" />{err("fullName")}</label>
            <label>Email Address<input type="email" value={f.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />{err("email")}</label>
            <label>Phone Number<input type="tel" value={f.phone} onChange={set("phone")} placeholder="+231 770 123 456" autoComplete="tel" />{err("phone")}</label>
            <label>Date of Birth<input type="date" value={f.dateOfBirth} onChange={set("dateOfBirth")} max={new Date().toISOString().slice(0, 10)} />{err("dateOfBirth")}</label>
            <fieldset><legend>Gender</legend><div className="su-radios">{[["male", "Male"], ["female", "Female"], ["prefer_not", "Prefer not to say"]].map(([v, l]) => <label key={v}><input type="radio" name="gender" value={v} checked={f.gender === v} onChange={set("gender")} />{l}</label>)}</div>{err("gender")}</fieldset>
          </div>}

          {step === 1 && <div className="su-form">
            <label>County<select value={f.county} onChange={set("county")}><option value="">Select your county</option>{LIBERIA_COUNTIES.map((c) => <option key={c}>{c}</option>)}</select>{err("county")}</label>
            <label>School Name<input value={f.school} onChange={set("school")} placeholder="Your school" />{err("school")}</label>
            <label>Current Class / Grade<select value={f.grade} onChange={set("grade")}><option value="">Select class</option>{GRADES.map((g) => <option key={g}>{g}</option>)}</select>{err("grade")}</label>
            <label>Exam Type<select value={f.examType} onChange={set("examType")}>{EXAM_TYPES.map((g) => <option key={g}>{g}</option>)}</select>{err("examType")}</label>
          </div>}

          {step === 2 && <div className="su-form">
            <label>Password<span className="su-pw"><input type={show ? "text" : "password"} value={f.password} onChange={set("password")} autoComplete="new-password" /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
              <span className="su-meter" data-level={strength}><i /><i /><i /><i /></span>{err("password")}</label>
            <label>Confirm Password<span className="su-pw"><input type={show ? "text" : "password"} value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></span>{err("confirm")}</label>
            <label className="su-check"><input type="checkbox" checked={f.terms} onChange={set("terms")} />I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link></label>{err("terms")}
          </div>}

          {step === 3 && <div className="su-done">
            <CheckCircle2 size={72} />
            <h2>Account Created!</h2>
            <p>{needsConfirm ? `We sent a confirmation link to ${f.email}. Confirm your email, then you'll land on your dashboard.` : "Welcome to BridgeLIB. Your learning space is ready."}</p>
            {needsConfirm ? <a href="/?auth=login" className="bl-btn bl-btn-primary">Go to Sign In</a> : <button className="bl-btn bl-btn-primary" onClick={() => navigate({ to: "/dashboard" })}>Go to Dashboard</button>}
          </div>}

          {msg && <p className="su-msg" role="status">{msg}</p>}

          {step < 3 && <div className="su-nav">
            {step > 0 && <button type="button" className="bl-btn bl-btn-outline" onClick={() => { setErrors({}); setStep(step - 1); }}>Back</button>}
            {step < 2 ? <button type="button" className="bl-btn bl-btn-primary" onClick={next}>Next Step</button>
              : <button type="button" className="bl-btn bl-btn-primary" disabled={busy} onClick={create}>{busy ? "Creating…" : "Create Account"}</button>}
          </div>}
          {step === 2 && <div className="su-alt"><span>Or continue with</span><div><button type="button" onClick={google}><School size={16} /> Google</button><button type="button" onClick={phoneLogin}><Phone size={16} /> Phone</button></div></div>}
          {step < 3 && <p className="su-foot">Already have an account? <a href="/?auth=login">Sign In</a></p>}
        </section>

        <aside className="su-side">
          <h3>Why Join BridgeLIB?</h3>
          <ul>{BENEFITS.map(([I, t, d]) => <li key={t}><span><I size={18} /></span><div><b>{t}</b><small>{d}</small></div></li>)}</ul>
          <h3>I am a…</h3>
          <RolePicker role={role} setRole={setRole} />
          {role === "teacher" && <small className="su-note">Teacher accounts are reviewed by BridgeLIB before teacher tools unlock.</small>}
          <blockquote><LiberiaFlag size={28} /> “Education is the bridge to a brighter Liberia.”</blockquote>
        </aside>
      </div>
    </SiteLayout>
  );
}

function RolePicker({ role, setRole }: { role: Role; setRole: (r: Role) => void }) {
  return <div className="su-roles" role="radiogroup" aria-label="Account type">
    {([["student", "Student", GraduationCap], ["teacher", "Teacher", Users]] as const).map(([v, l, I]) =>
      <button key={v} type="button" role="radio" aria-checked={role === v} className={role === v ? "on" : ""} onClick={() => setRole(v)}><I size={20} />{l}</button>)}
  </div>;
}
