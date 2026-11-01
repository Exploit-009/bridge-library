import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/** Copies a teacher signup request from account metadata onto the profile so admins can review it. */
export async function syncTeacherRequest(user: User) {
  const m = user.user_metadata ?? {};
  if (m["requested_role"] !== "teacher") return;
  const p = await supabase.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
  if (p.error || !p.data) return;
  const prefs = (p.data.preferences ?? {}) as Record<string, unknown>;
  if (prefs["teacher_request"]) return;
  await supabase.from("profiles").update({
    preferences: { ...prefs, teacher_request: { subject: m["subject_taught"] ?? "", level: m["teaching_level"] ?? "", requested_at: new Date().toISOString() } },
  } as never).eq("id", user.id);
}
