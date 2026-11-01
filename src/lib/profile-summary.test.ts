import { describe, it, expect } from 'vitest';
import { averageScore, goalPercent, profileFormSchema } from './profile-summary';

const valid = { fullName: 'John Doe', email: 'john@example.org', phone: '+231 770 123 456', county: 'Montserrado', school: 'JFK High School', educationLevel: 'grade_12_wassce' };

describe('profile summary rules', () => {
  it('averages quiz percentages', () => expect(averageScore([{ score: 8, total_questions: 10 }, { score: 6, total_questions: 10 }])).toBe(70));
  it('has no average without attempts', () => expect(averageScore([])).toBeNull());
  it('caps goal progress at 100%', () => expect(goalPercent(12, 10)).toBe(100));
  it('computes goal progress', () => expect(goalPercent(3, 4)).toBe(75));
  it('accepts a complete profile', () => expect(profileFormSchema.safeParse(valid).success).toBe(true));
  it('rejects counties outside Liberia', () => expect(profileFormSchema.safeParse({ ...valid, county: 'Lagos' }).success).toBe(false));
  it('rejects invalid phone numbers', () => expect(profileFormSchema.safeParse({ ...valid, phone: 'abc' }).success).toBe(false));
});
