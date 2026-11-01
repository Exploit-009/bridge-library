import { createServerFn } from "@tanstack/react-start";
import { requireBridgeAuth } from "./bridge-auth";

const count = (r: { count: number | null; error: unknown }) => (r.error ? null : r.count ?? 0);

/** One-call overview for the admin dashboard. Sections that RLS blocks come back as null. */
export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireBridgeAuth])
  .handler(async ({ context: { supabase, userId } }) => {
    const isAdmin = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (isAdmin.error || !isAdmin.data) throw new Error("Administrator access required.");
    const head = { count: "exact" as const, head: true };
    const [profiles, subjects, lessons, questions, publishedQ, certs, attempts, enrollments, roles, recentStudents, recentCerts, recentAttempts] = await Promise.all([
      supabase.from("profiles").select("id", head),
      supabase.from("subjects").select("id", head),
      supabase.from("lessons").select("id", head),
      supabase.from("exam_questions").select("id", head),
      supabase.from("exam_questions").select("id", head).eq("is_published", true),
      supabase.from("bridge_certificates").select("id", head),
      supabase.from("exam_attempts").select("id", head),
      supabase.from("course_enrollments").select("id", head),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("profiles").select("id,full_name,school_name,county,created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("bridge_certificates").select("id,learner_name,subject_name,issued_at").order("issued_at", { ascending: false }).limit(6),
      supabase.from("exam_attempts").select("id,score,total_questions,submitted_at").order("submitted_at", { ascending: false }).limit(50),
    ]);
    const pubLessons = await supabase.from("lessons").select("subject_id").eq("is_published", true).limit(5000);
    const roleRows = (roles.data ?? []) as Array<{ user_id: string; role: string }>;
    const staff = new Set(roleRows.filter((r) => r.role !== "student").map((r) => r.user_id));
    const scored = (recentAttempts.data ?? []).filter((a) => a.total_questions > 0);
    const avg = scored.length ? Math.round((scored.reduce((s, a) => s + a.score / a.total_questions, 0) / scored.length) * 100) : null;
    return {
      stats: {
        users: count(profiles),
        teachers: roles.error ? null : roleRows.filter((r) => r.role === "teacher").length,
        courses: count(subjects),
        publishedCourses: pubLessons.error ? null : new Set((pubLessons.data ?? []).map((l) => l.subject_id)).size,
        lessons: count(lessons),
        questions: count(questions),
        publishedQuestions: count(publishedQ),
        certificates: count(certs),
        attempts: count(attempts),
        enrollments: count(enrollments),
        averageScore: avg,
      },
      recentStudents: (recentStudents.data ?? []).filter((p) => !staff.has(p.id)).map((p) => ({ id: p.id, name: p.full_name || "Unnamed", school: p.school_name || "", county: p.county || "", joined: p.created_at })),
      recentCertificates: recentCerts.error ? null : (recentCerts.data ?? []),
    };
  });
