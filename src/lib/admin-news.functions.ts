import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireBridgeAuth } from "./bridge-auth";
import { announcementSchema, readAnnouncements, requireAdminRole, writeAnnouncements } from "./announcements";

export const adminNews = createServerFn({ method: "POST" })
  .middleware([requireBridgeAuth])
  .handler(async ({ context: { supabase, userId } }) => {
    requireAdminRole(await supabase.rpc("has_role", { _user_id: userId, _role: "admin" }));
    const result = await supabase.from("feature_settings").select("label").eq("key", "site.news").maybeSingle();
    if (result.error) throw new Error("Could not load announcements. Please retry.");
    const revision = result.data?.label ?? null;
    return { articles: readAnnouncements(revision ?? ""), revision };
  });

export const publishNews = createServerFn({ method: "POST" })
  .middleware([requireBridgeAuth])
  .inputValidator((value: unknown) => z.object({
    revision: z.string().nullable(),
    action: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("publish"), article: announcementSchema }),
      z.object({ kind: z.literal("remove"), slug: z.string().min(1).max(160) }),
    ]),
  }).parse(value))
  .handler(async ({ data, context: { supabase, userId } }) => {
    requireAdminRole(await supabase.rpc("has_role", { _user_id: userId, _role: "admin" }));
    let articles = readAnnouncements(data.revision ?? "");
    const action = data.action;
    if (action.kind === "remove") articles = articles.filter((article) => article.slug !== action.slug);
    else {
      const index = articles.findIndex((article) => article.slug === action.article.slug);
      if (index < 0) articles.unshift(action.article);
      else articles[index] = action.article;
    }
    const label = writeAnnouncements(articles);
    const result = data.revision === null
      ? await supabase.from("feature_settings").insert({ key: "site.news", label, enabled: true }).select("label").single()
      : await supabase.from("feature_settings").update({ label }).eq("key", "site.news").eq("label", data.revision).select("label").single();
    if (result.error || result.data?.label !== label) throw new Error("Announcement not saved. Refresh and retry; another editor may have changed the news, or your account may lack publishing permission.");
    return { articles, revision: label };
  });