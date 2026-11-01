export type HelpCategory = 'start' | 'account' | 'courses' | 'exams' | 'events' | 'tech' | 'payments' | 'other';

export const HELP_CATEGORIES: Array<{ id: HelpCategory; label: string; hint: string }> = [
  { id: 'start', label: 'Getting Started', hint: 'Basics and first steps' },
  { id: 'account', label: 'Account & Profile', hint: 'Manage your account' },
  { id: 'courses', label: 'Courses & Learning', hint: 'Access and study courses' },
  { id: 'exams', label: 'Exams & Results', hint: 'WASSCE and more' },
  { id: 'events', label: 'Events & Calendar', hint: 'Find upcoming events' },
  { id: 'tech', label: 'Technical Support', hint: 'Fix common issues' },
  { id: 'payments', label: 'Payments & Access', hint: 'Subscriptions and fees' },
  { id: 'other', label: 'Other Questions', hint: 'Everything else' },
];

export type Faq = { q: string; a: string; cat: HelpCategory };

// The first eight entries are the questions shown in the reference design, in order.
export const HELP_FAQS: Faq[] = [
  { cat: 'start', q: 'How do I register on BridgeLIB?', a: 'Click Sign Up at the top of any page, enter your details (name, email, phone, school and education level) and create a password. Confirm your email from the link we send you, then sign in.' },
  { cat: 'account', q: 'How can I reset my password?', a: 'Open Login and choose “Forgot password”. We email you a reset link. If you are signed in, you can also change it from Profile → Account Settings → Change Password.' },
  { cat: 'exams', q: 'Can I download past WASSCE papers?', a: 'Yes, when papers have been published. Sign in and open Downloads (or Practice → Past Questions) to download available exam papers as PDFs.' },
  { cat: 'courses', q: 'How do I track my progress?', a: 'Sign in and open My Progress to see your enrolled courses, completed lessons and quiz results. Your profile also shows quick stats and recent activity.' },
  { cat: 'payments', q: 'Is BridgeLIB free to use?', a: 'Creating an account and studying the available courses is free. Some optional premium features may require a subscription; when they do, the price is shown on that feature before you pay.' },
  { cat: 'courses', q: 'How do I contact a teacher?', a: 'Join your teacher’s class with the invite they give you, then open Classroom → Messages to message your class teacher.' },
  { cat: 'courses', q: 'Can I get a certificate?', a: 'Yes. Enroll in a course and complete all of its published lessons, then open My Certificates to issue your BridgeLIB completion certificate. These are BridgeLIB records, not official WASSCE certificates.' },
  { cat: 'tech', q: 'What if I face technical problems?', a: 'Try refreshing the page and checking your internet connection. If the problem continues, use “Report a Problem” on this page and describe what happened — our team will follow up.' },
  { cat: 'start', q: 'Can teachers use BridgeLIB?', a: 'Yes. Teachers can create classes, invite students, share lessons and quizzes, and follow class results from the teacher dashboard.' },
  { cat: 'events', q: 'Where can I find upcoming events?', a: 'Open Events from the menu to see published BridgeLIB events. News & Updates lists the latest announcements.' },
  { cat: 'account', q: 'How do I update my profile or photo?', a: 'Sign in, open My Profile and use Edit Profile. Click Change Photo to upload a JPG, PNG or WebP image up to 5 MB, then press Save Changes.' },
  { cat: 'exams', q: 'Where are mock tests and practice questions?', a: 'Open Practice from the menu to take past questions and timed practice tests. Your saved results appear in My Progress.' },
  { cat: 'tech', q: 'Which devices can I use?', a: 'BridgeLIB works in a modern web browser on Android phones, tablets and computers. No app download is needed.' },
];

export function searchFaqs(list: Faq[], query: string, cat: HelpCategory | null): Faq[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter(f => (!cat || f.cat === cat) && words.every(w => `${f.q} ${f.a}`.toLowerCase().includes(w)));
}
