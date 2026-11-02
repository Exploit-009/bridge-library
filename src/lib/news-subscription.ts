import { z } from 'zod';
export const subscriptionEmail = z.string().trim().toLowerCase().email().max(255);
export function newsletterPreference(preferences: Record<string, unknown>, email: string) {
  return { ...preferences, newsletter: { email: subscriptionEmail.parse(email), status: 'subscribed' } };
}