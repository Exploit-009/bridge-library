import { describe, expect, it } from "vitest";
import { accountStep, liberianPhone, gradeEducationLevel } from "./signup-steps";

describe("signup steps", () => {
  it("accepts +231 phone format", () => expect(liberianPhone.safeParse("+231 770 123 456").success).toBe(true));
  it("rejects non-Liberian phone", () => expect(liberianPhone.safeParse("+1 555 123 4567").success).toBe(false));
  it("rejects mismatched passwords", () =>
    expect(accountStep.safeParse({ password: "abc12345", confirm: "abc12346", terms: true }).success).toBe(false));
  it("requires terms", () =>
    expect(accountStep.safeParse({ password: "abc12345", confirm: "abc12345", terms: false }).success).toBe(false));
  it("requires a number in password", () =>
    expect(accountStep.safeParse({ password: "abcdefgh", confirm: "abcdefgh", terms: true }).success).toBe(false));
  it("maps grade 12 to senior high", () => expect(gradeEducationLevel("Grade 12 (WASSCE)")).toBe("senior_high"));
});
import { teacherAcademicStep } from "./signup-steps";
describe("teacher signup", () => {
  it("requires subject taught", () =>
    expect(teacherAcademicStep.safeParse({ county: "Bong", school: "CWA", subject: "", teachLevel: "Senior High" }).success).toBe(false));
});
