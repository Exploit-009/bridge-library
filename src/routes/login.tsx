import { createFileRoute } from '@tanstack/react-router';
import { AccountAccess } from '@/components/account/AccountAccess';
import { signInDestination } from '@/lib/account-access';

export const Route = createFileRoute('/login')({
  validateSearch: (s: Record<string, unknown>) => ({ next: signInDestination(s.next) }),
  head: () => ({ meta: [
    { title: 'Sign In — BridgeLIB' },
    { name: 'description', content: 'Sign in to your BridgeLIB account and continue learning.' },
    { property: 'og:title', content: 'Sign In — BridgeLIB' },
    { property: 'og:description', content: 'Access your BridgeLIB learning account.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <AccountAccess mode="login" next={Route.useSearch().next} />,
});