import { createFileRoute } from '@tanstack/react-router';
import { AccountAccess } from '@/components/account/AccountAccess';

export const Route = createFileRoute('/forgot-password')({
  head: () => ({ meta: [
    { title: 'Password Recovery — BridgeLIB' },
    { name: 'description', content: 'Request a secure reset link for your BridgeLIB account.' },
    { property: 'og:title', content: 'Password Recovery — BridgeLIB' },
    { property: 'og:description', content: 'Recover access to your BridgeLIB learning account.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <AccountAccess mode="forgot" />,
});