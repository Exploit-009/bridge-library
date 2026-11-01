import { z } from 'zod';

export const LIBERIA_COUNTIES = ['Bomi','Bong','Gbarpolu','Grand Bassa','Grand Cape Mount','Grand Gedeh','Grand Kru','Lofa','Margibi','Maryland','Montserrado','Nimba','River Cess','River Gee','Sinoe'] as const;

export const EDUCATION_LEVELS = [
  { value: 'junior_high', label: 'Junior High (Grades 7–9)' },
  { value: 'senior_high', label: 'Senior High (Grades 10–11)' },
  { value: 'grade_12_wassce', label: 'Grade 12 (WASSCE)' },
  { value: 'university', label: 'University / College' },
  { value: 'other', label: 'Other' },
] as const;

export function educationLabel(value: string | null | undefined) {
  return EDUCATION_LEVELS.find(l => l.value === value)?.label ?? (value || '');
}

export const profileFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(160, 'Name is too long.'),
  email: z.string().trim().email('Enter a valid email address.').max(255),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,25}$/, 'Enter a valid phone number.')
    .refine(v => { const n = v.replace(/\D/g, '').length; return n >= 7 && n <= 15; }, 'Enter a valid phone number.'),
  county: z.enum(LIBERIA_COUNTIES, { message: 'Choose your county.' }),
  school: z.string().trim().min(2, 'Enter your school name.').max(180, 'School name is too long.'),
  educationLevel: z.enum(EDUCATION_LEVELS.map(l => l.value) as [string, ...string[]], { message: 'Choose your education level.' }),
});

export const goalSchema = z.object({
  target: z.coerce.number().int('Use a whole number.').min(1, 'Set at least 1 course.').max(50, 'Keep the goal at 50 courses or fewer.'),
  text: z.string().trim().max(200, 'Keep the description under 200 characters.'),
});

/** Average percentage across practice and class quiz attempts; null when there are none. */
export function averageScore(attempts: Array<{ score: number; total_questions: number }>): number | null {
  const valid = attempts.filter(a => a.total_questions > 0);
  if (!valid.length) return null;
  return Math.round(valid.reduce((s, a) => s + a.score / a.total_questions, 0) / valid.length * 100);
}

/** Share of the course-completion goal reached, capped at 100. */
export function goalPercent(completedCourses: number, target: number | null | undefined): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round(completedCourses / target * 100));
}
