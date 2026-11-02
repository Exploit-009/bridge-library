import { describe, expect, it } from "vitest";
import { newsletterPreference, subscriptionEmail } from "./news-subscription";
describe("newsletter subscriptions", () => {
  it("rejects invalid email addresses", () => {
    expect(subscriptionEmail.safeParse("not-an-email").success).toBe(false);
  });
  it("keeps one normalized subscription and preserves other preferences", () => {
    const first = newsletterPreference({ language: "en" }, "Student@Example.com");
    expect(newsletterPreference(first, "student@example.com")).toEqual({
      language: "en",
      newsletter: { email: "student@example.com", status: "subscribed" },
    });
  });
});
