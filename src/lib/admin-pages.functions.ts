import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireBridgeAuth } from "./bridge-auth";

async function admin(supabase: any, userId: string) {
  const r = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (r.error || !r.data) throw new Error("Administrator access required.");
}
function must<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return (r.data ?? []) as T;
}
const tally = (rows: Array<Record<string, any>>, key: string) => {
  const m: Record<string, number> = {};
  for (const r of rows) m[String(r[key])] = (m[String(r[key])] ?? 0) + 1;
  return m;
};

export const adminCourses = createServerFn({ method: "POST" }).middleware([requireBridgeAuth]).handler(async ({ context: { supabase, userId } }) => {
  await admin(supabase, userId);
  const [subjects, lessons, enroll] = await Promise.all([
    supabase.from("subjects").select("id,name,description").order("name"),
    supabase.from("lessons").select("id,subject_id,title,is_published,grade_level,updated_at").order("created_at", { ascending: false }).limit(2000),
    supabase.from("course_enrollments").select("subject_id").limit(10000),
  ]);
  const ls = must(lessons) as any[];
  const en = tally(must(enroll) as any[], "subject_id");
  return {
    subjects: (must(subjects) as any[]).map((s) => ({ ...s, lessons: ls.filter((l) => l.subject_id === s.id).length, published: ls.filter((l) => l.subject_id === s.id && l.is_published).length, enrollments: en[String(s.id)] ?? 0 })),
    lessons: ls as Array<{ id: string; subject_id: number; title: string; is_published: boolean; grade_level: string | null; updated_at: string }>,
  };
});

export const adminCourseAction = createServerFn({ method: "POST" }).middleware([requireBridgeAuth])
  .inputValidator((v: unknown) => z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("save_subject"), id: z.number().int().positive().nullable(), name: z.string().trim().min(2).max(120), description: z.string().trim().max(1000) }),
    z.object({ kind: z.literal("delete_subject"), id: z.number().int().positive() }),
    z.object({ kind: z.literal("publish_lesson"), id: z.string().uuid(), is_published: z.boolean() }),
  ]).parse(v))
  .handler(async ({ data, context: { supabase, userId } }) => {
    await admin(supabase, userId);
    let r: any;
    if (data.kind === "save_subject") r = data.id ? await supabase.from("subjects").update({ name: data.name, description: data.description }).eq("id", data.id).select("id").single() : await supabase.from("subjects").insert({ name: data.name, description: data.description }).select("id").single();
    else if (data.kind === "delete_subject") r = await supabase.from("subjects").delete().eq("id", data.id);
    else r = await supabase.from("lessons").update({ is_published: data.is_published }).eq("id", data.id).select("id").single();
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  });

export const adminQuizzes = createServerFn({ method: "POST" }).middleware([requireBridgeAuth]).handler(async ({ context: { supabase, userId } }) => {
  await admin(supabase, userId);
  const [subjects, questions, attempts] = await Promise.all([
    supabase.from("subjects").select("id,name").order("name"),
    supabase.from("exam_questions").select("id,subject_id,prompt,exam_type,is_published,created_at").order("created_at", { ascending: false }).limit(2000),
    supabase.from("exam_attempts").select("score,total_questions").limit(5000),
  ]);
  const at = must(attempts) as any[];
  const scored = at.filter((a) => a.total_questions > 0);
  return {
    subjects: must(subjects) as Array<{ id: number; name: string }>,
    questions: must(questions) as Array<{ id: string; subject_id: number; prompt: string; exam_type: string | null; is_published: boolean; created_at: string }>,
    attempts: at.length,
    averageScore: scored.length ? Math.round((scored.reduce((s, a) => s + a.score / a.total_questions, 0) / scored.length) * 100) : null,
  };
});

export const adminQuizAction = createServerFn({ method: "POST" }).middleware([requireBridgeAuth])
  .inputValidator((v: unknown) => z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("publish"), id: z.string(), is_published: z.boolean() }),
    z.object({ kind: z.literal("delete"), id: z.string() }),
  ]).parse(v))
  .handler(async ({ data, context: { supabase, userId } }) => {
    await admin(supabase, userId);
    const r: any = data.kind === "publish"
      ? await supabase.from("exam_questions").update({ is_published: data.is_published }).eq("id", data.id as never).select("id").single()
      : await supabase.rpc("delete_exam_question", { p_id: data.id as never });
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  });

export const adminCertificates = createServerFn({ method: "POST" }).middleware([requireBridgeAuth]).handler(async ({ context: { supabase, userId } }) => {
  await admin(supabase, userId);
  return must(await supabase.from("bridge_certificates").select("id,learner_name,subject_name,issued_at,user_id").order("issued_at", { ascending: false }).limit(2000)) as Array<{ id: string; learner_name: string; subject_name: string; issued_at: string; user_id: string }>;
});

export const adminStudents = createServerFn({ method: "POST" }).middleware([requireBridgeAuth]).handler(async ({ context: { supabase, userId } }) => {
  await admin(supabase, userId);
  const [profiles, roles, enroll, attempts, certs] = await Promise.all([
    supabase.from("profiles").select("id,full_name,school_name,county,grade_level,created_at").order("created_at", { ascending: false }).limit(2000),
    supabase.from("user_roles").select("user_id,role"),
    supabase.from("course_enrollments").select("user_id").limit(10000),
    supabase.from("exam_attempts").select("user_id").limit(10000),
    supabase.from("bridge_certificates").select("user_id").limit(10000),
  ]);
  const rl = must(roles) as any[];
  const e = tally(must(enroll) as any[], "user_id"), a = tally(must(attempts) as any[], "user_id");
  const c = certs.error ? {} : tally((certs.data ?? []) as any[], "user_id");
  const order = ["admin", "school_admin", "teacher", "student"];
  return (must(profiles) as any[]).map((p) => {
    const mine = rl.filter((r) => r.user_id === p.id).map((r) => r.role as string);
    return { id: p.id as string, name: (p.full_name as string) || "Unnamed", school: p.school_name || "", county: p.county || "", grade: p.grade_level || "", joined: p.created_at as string,
      role: order.find((o) => mine.includes(o)) ?? "student", enrollments: e[p.id] ?? 0, attempts: a[p.id] ?? 0, certificates: c[p.id] ?? 0 };
  });
});

export const adminSchools = createServerFn({ method: "POST" }).middleware([requireBridgeAuth]).handler(async ({ context: { supabase, userId } }) => {
  await admin(supabase, userId);
  const [schools, papers, subjects] = await Promise.all([
    supabase.from("schools").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("exam_papers").select("*").order("exam_year", { ascending: false }).limit(1000),
    supabase.from("subjects").select("id,name"),
  ]);
  return { schools: must(schools) as any[], papers: must(papers) as any[], subjects: must(subjects) as Array<{ id: number; name: string }> };
});
