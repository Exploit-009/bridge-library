import { z } from "zod";
import { LIBERIA_COUNTIES } from "./profile-summary";

export const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12 (WASSCE)", "Private candidate", "College / Vocational"] as const;
export const EXAM_TYPES = ["WASSCE", "WAEC Junior (9th Grade)", "WAEC Primary (6th Grade)", "University Entrance", "None"] as const;

export function gradeEducationLevel(grade: string) {
  if (["Grade 7", "Grade 8", "Grade 9"].includes(grade)) return "junior_high";
  if (["Grade 10", "Grade 11", "Grade 12 (WASSCE)"].includes(grade)) return "senior_high";
  if (grade === "College / Vocational") return "college_vocational";
  return "other";
}

/** Liberian number: +231 followed by 8–9 digits (e.g. +231 770 123 456). */
export const liberianPhone = z
  .string()
  .trim()
  .refine((v) => /^\+231[\d\s-]+$/.test(v) && /^\d{8,9}$/.test(v.slice(4).replace(/[\s-]/g, "")), "Enter a Liberian number like +231 770 123 456.");

export const personalStep = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: liberianPhone,
  dateOfBirth: z.string().min(1, "Choose your date of birth.").refine((d) => !Number.isNaN(Date.parse(d)) && new Date(d) < new Date(), "Enter a valid date of birth."),
  gender: z.enum(["male", "female", "prefer_not"], { message: "Choose a gender option." }),
});

export const academicStep = z.object({
  county: z.enum(LIBERIA_COUNTIES, { message: "Choose your county." }),
  school: z.string().trim().min(2, "Enter your school name.").max(200),
  grade: z.enum(GRADES, { message: "Choose your class or grade." }),
  examType: z.enum(EXAM_TYPES, { message: "Choose an exam type." }),
});

export const accountStep = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirm: z.string(),
    terms: z.literal(true, { message: "Please agree to the Terms and Privacy Policy." }),
  })
  .refine((v) => v.password === v.confirm, { message: "The passwords do not match.", path: ["confirm"] });

export function passwordStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return s; // 0–4
}

export const TEACH_SUBJECTS = ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "Economics", "Literature", "Geography", "History", "Civics", "Other"] as const;
export const TEACH_LEVELS = ["Junior High", "Senior High", "Junior & Senior High", "College / Vocational"] as const;
export const teacherAcademicStep = z.object({
  county: z.enum(LIBERIA_COUNTIES, { message: "Choose your county." }),
  school: z.string().trim().min(2, "Enter your school name.").max(200),
  subject: z.enum(TEACH_SUBJECTS, { message: "Choose the subject you teach." }),
  teachLevel: z.enum(TEACH_LEVELS, { message: "Choose the level you teach." }),
});
