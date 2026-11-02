import { createServerFn } from '@tanstack/react-start';
import { requireBridgeAuth } from './bridge-auth';
import { newsletterPreference, subscriptionEmail } from './news-subscription';
export const subscribeNews = createServerFn({method:'POST'})
  .middleware([requireBridgeAuth])
  .inputValidator((input: unknown) => subscriptionEmail.parse(input))
  .handler(async ({data,context}) => {
    const identity = await context.supabase.auth.getUser();
    if (!identity.data.user?.email || identity.data.user.email.toLowerCase() !== data) throw new Error('Use the email address on your signed-in account.');
    const profile = await context.supabase.from('profiles').select('preferences').eq('id',context.userId).single();
    if (profile.error) throw new Error('Could not read your subscription preferences.');
    const preferences = newsletterPreference((profile.data.preferences ?? {}) as Record<string,unknown>,data);
    const saved = await context.supabase.from('profiles').update({preferences} as never).eq('id',context.userId).select('preferences').single();
    if (saved.error) throw new Error('Your subscription could not be saved. Please try again.');
    return {saved:true};
  });