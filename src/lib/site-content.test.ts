import { describe, expect, it } from "vitest";
import { parseBlocks, rowsToContent, safeUrl } from "./site-content";

describe("site content", () => {
  it("only reads site.* rows and drops empty values", () => {
    expect(
      rowsToContent([
        { key: "courses", label: "Courses" },
        { key: "site.contact_phone", label: " +231 555 " },
        { key: "site.facebook", label: "  " },
      ]),
    ).toEqual({ contact_phone: "+231 555" });
  });
  it("splits FAQ blocks into question and answer", () => {
    expect(parseBlocks("Is it free?\nYes.\n\nHow?\nSign up.")).toEqual([
      ["Is it free?", "Yes."],
      ["How?", "Sign up."],
    ]);
  });
  it("rejects non-http links", () => {
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl("https://youtu.be/x")).toBe("https://youtu.be/x");
  });
});
import { parseEvents } from "./site-content";
describe("parseEvents", () => {
  it("reads title, date and place and sorts by date", () => {
    const e = parseEvents("Science Fair | 2026-12-05 | Monrovia\nBring projects\n\nMath Camp | 2026-11-20 | Gbarnga");
    expect(e.map((x) => x.title)).toEqual(["Math Camp", "Science Fair"]);
    expect(e[1]).toMatchObject({ date: "2026-12-05", place: "Monrovia", details: "Bring projects" });
  });
});
