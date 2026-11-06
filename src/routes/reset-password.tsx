import { createFileRoute } from '@tanstack/react-router';
import { AccountAccess } from '@/components/account/AccountAccess';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'Set a New Password — BridgeLIB' },
    { name: 'description', content: 'Use your BridgeLIB recovery link to securely set a new password.' },
    { property: 'og:title', content: 'Set a New Password — BridgeLIB' },
    { property: 'og:description', content: 'Securely reset your BridgeLIB password.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <AccountAccess mode="reset" />,
});