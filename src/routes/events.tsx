import { createFileRoute } from '@tanstack/react-router';
import { EventsPage } from '@/components/site/NewsEvents';
export const Route=createFileRoute('/events')({head:()=>({meta:[{title:'Education Events — BridgeLIB'},{name:'description',content:'Confirmed education events and upcoming BridgeLIB community dates.'},{property:'og:title',content:'Education Events — BridgeLIB'},{property:'og:description',content:'Upcoming verified education events for BridgeLIB learners.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:EventsPage});
