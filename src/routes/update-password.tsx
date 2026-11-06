import { createFileRoute } from '@tanstack/react-router';
import { AccountAccess } from '@/components/account/AccountAccess';

export const Route = createFileRoute('/update-password')({
  head: () => ({ meta: [
    { title: 'Change Your Password — BridgeLIB' },
    { name: 'description', content: 'Update your signed-in BridgeLIB account password.' },
    { property: 'og:title', content: 'Change Your Password — BridgeLIB' },
    { property: 'og:description', content: 'Manage your BridgeLIB account security.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <AccountAccess mode="update" />,
});