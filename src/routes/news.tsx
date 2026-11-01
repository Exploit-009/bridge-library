import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, Newspaper, Star } from 'lucide-react';
import { LearnerShell } from '@/components/learning/LearnerPages';
import { EmptyState } from '@/components/site/SiteChrome';
import { referencePhotos } from '@/lib/reference-photos';

export const Route = createFileRoute('/news')({
 head:()=>({meta:[{title:'Education News & Updates — BridgeLIB'},{name:'description',content:'BridgeLIB education announcements and upcoming events for Liberian learners.'},{property:'og:title',content:'Education News & Updates — BridgeLIB'},{property:'og:description',content:'Education announcements and event updates for the BridgeLIB community.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),
 component:NewsPage,
});

function NewsPage(){return <LearnerShell active="news"><section className="bl-news-banner"><img src={referencePhotos.news} alt="Liberian students outside their school"/><div><h1>Education<br/>News & Updates</h1><p>Education announcements and opportunities for the BridgeLIB community.</p></div></section><div className="bl-news-layout"><section className="bl-news-section"><h2><Newspaper size={20}/> Latest Education News</h2><EmptyState title="No published announcements yet" text="Education news will appear here when verified announcements are available." action={<Link to="/wassce" className="bl-btn bl-btn-primary">WASSCE Preparation <ArrowRight size={15}/></Link>}/></section><aside><section className="bl-news-section"><h2><Star size={20}/> Latest Updates</h2><p>No verified updates are available yet.</p></section><section className="bl-news-section"><h2><CalendarDays size={20}/> Upcoming Events</h2><p>No confirmed events have been posted.</p><Link to="/events" className="bl-link">View Calendar <ArrowRight size={14}/></Link></section></aside></div></LearnerShell>;}