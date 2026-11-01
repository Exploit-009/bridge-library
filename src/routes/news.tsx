import { createFileRoute } from '@tanstack/react-router';
import { NewsPage } from '@/components/site/NewsEvents';

export const Route = createFileRoute('/news')({
 head:()=>({meta:[{title:'Education News & Updates — BridgeLIB'},{name:'description',content:'BridgeLIB education announcements and upcoming events for Liberian learners.'},{property:'og:title',content:'Education News & Updates — BridgeLIB'},{property:'og:description',content:'Education announcements and event updates for the BridgeLIB community.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:NewsPage,
});
