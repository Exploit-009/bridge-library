import { z } from "zod";

export const announcementSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  title: z.string().trim().min(3).max(180),
  content: z.string().trim().min(10).max(20000),
  date: z.iso.date(),
});
export type Announcement = z.infer<typeof announcementSchema>;
const documentSchema = z.object({ version: z.literal(1), articles: z.array(announcementSchema.extend({ date: z.union([z.iso.date(), z.literal("")]) })).max(200) });

export function readAnnouncements(text?: string): Announcement[] {
  if (!text?.trim()) return [];
  if (text.trim().startsWith("{")) {
    const parsed = documentSchema.parse(JSON.parse(text));
    return parsed.articles;
  }
  return text.split(/\n\s*\n/).map((block, index) => {
    const [title = "", ...body] = block.trim().split("\n");
    return { slug: `announcement-${index + 1}`, title: title.trim(), content: body.join("\n").trim(), date: "" };
  }).filter((article) => article.title);
}

export function writeAnnouncements(articles: Announcement[]): string {
  // Legacy announcements may not have a date; retain those unchanged.
  const stored = articles.map((article) => article.date ? announcementSchema.parse(article) : article);
  return JSON.stringify({ version: 1, articles: stored });
}

export function requireAdminRole(result: { data: unknown; error: unknown }): void {
  if (result.error || result.data !== true) throw new Error("Administrator access required.");
}