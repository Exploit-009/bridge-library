import { describe, expect, it } from "vitest";
import { announcementSchema, readAnnouncements, requireAdminRole, writeAnnouncements } from "./announcements";

describe("BridgeLIB announcements", () => {
  it("does not supply reference cards when no real announcements exist", () => {
    expect(readAnnouncements("")).toEqual([]);
  });
  it("retains real stored announcements and stable links after edits", () => {
    const real = { slug: "bridgelib-update", title: "BridgeLIB update", content: "Our new learning update.", date: "2026-11-02" };
    const saved = writeAnnouncements([{ ...real, title: "BridgeLIB announcement" }]);
    expect(readAnnouncements(saved)).toEqual([{ ...real, title: "BridgeLIB announcement" }]);
  });
  it("preserves existing published news", () => {
    expect(readAnnouncements("Real update\nExisting story")[0]).toMatchObject({ slug: "announcement-1", title: "Real update", content: "Existing story" });
  });
  it("requires a valid announcement and calendar date before publication", () => {
    expect(announcementSchema.safeParse({ slug: "update", title: "Update", content: "A real announcement.", date: "2026-02-30" }).success).toBe(false);
  });
  it("rejects non-admins and failed role lookups", () => {
    expect(() => requireAdminRole({ data: false, error: null })).toThrow("Administrator access required.");
    expect(() => requireAdminRole({ data: true, error: new Error("Failed") })).toThrow();
    expect(() => requireAdminRole({ data: true, error: null })).not.toThrow();
  });
});