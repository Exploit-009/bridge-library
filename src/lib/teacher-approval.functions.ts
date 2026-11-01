import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireBridgeAuth } from "./bridge-auth";

async function assertAdmin(supabase: any, userId: string) {
  const r = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (r.error || !r.data) throw new Error("Administrator access required.");
}

/** Pending = profile has preferences.teacher_request and no teacher role yet. */
export const teacherRequests = createServerFn({ method: "POST" })
  .middleware([requireBridgeAuth])
  .handler(async ({ context: { supabase, userId } }) => {
    await assertAdmin(supabase, userId);
    const [profiles, roles] = await Promise.all([
      supabase.from("profiles").select("id,full_name,school_name,county,preferences,created_at").not("preferences->teacher_request", "is", null).limit(500),
      supabase.from("user_roles").select("user_id,role").eq("role", "teacher"),
    ]);
    if (profiles.error) throw new Error(profiles.error.message);
    if (roles.error) throw new Error(roles.error.message);
    const teachers = new Set((roles.data ?? []).map((r: any) => r.user_id));
    return (profiles.data ?? []).map((p: any) => {
      const req = (p.preferences?.teacher_request ?? {}) as Record<string, string>;
      return {
        id: p.id as string,
        name: (p.full_name as string) || "Unnamed",
        school: (p.school_name as string) || "",
        county: (p.county as string) || "",
        subject: req["subject"] ?? "",
        level: req["level"] ?? "",
        requestedAt: req["requested_at"] ?? p.created_at,
        approved: teachers.has(p.id),
      };
    });
  });

export const approveTeacher = createServerFn({ method: "POST" })
  .middleware([requireBridgeAuth])
  .inputValidator((v: unknown) => z.object({ user_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context: { supabase, userId } }) => {
    await assertAdmin(supabase, userId);
    const r = await supabase.rpc("set_user_role", { p_user_id: data.user_id, p_role: "teacher" });
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  });
