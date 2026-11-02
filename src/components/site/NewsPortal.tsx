import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Mail, Newspaper, Search, Star } from 'lucide-react';
import { LearnerShell } from '@/components/learning/LearnerPages';
import { Button } from '@/components/ui/button';
import { LiberiaFlag } from './SiteChrome';
import hero from '@/assets/bridgelib-ai-students.jpg';
import { newsArticles } from '@/lib/news-articles';
import { parseEvents, useSiteContent } from '@/lib/site-content';
import { subscriptionEmail } from '@/lib/news-subscription';
import { subscribeNews } from '@/lib/news-subscription.functions';
const dateLabel=(value:string)=>value?new Date(`${value}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'BridgeLIB Update';
export function NewsPortal({query='',all=false,slug}:{query?:string;all?:boolean;slug?:string}){
 const content=useSiteContent();const articles=newsArticles(content.data?.news);const selected=slug?articles.find(a=>a.slug===slug):undefined;
 const [email,setEmail]=useState('');const [validation,setValidation]=useState('');const subscribe=useServerFn(subscribeNews);
 const mutation=useMutation({mutationFn:(value:string)=>subscribe({data:value})});
 const shown=articles.filter(a=>`${a.title} ${a.content}`.toLowerCase().includes(query.toLowerCase())).slice(0,all||query?undefined:4);
 const events=parseEvents(content.data?.events).filter(e=>!e.date||e.date>=new Date().toISOString().slice(0,10)).slice(0,3);
 return <LearnerShell active="news" aiReference newsReference><div className="np-page">
  <section className="np-hero"><img src={hero} width={1024} height={768} alt="Liberian students in blue school uniforms"/><div className="np-hero-copy"><span>Bridge<b>LIB</b></span><h1>Education<br/><em>News &amp; Updates</em></h1><p>Stay informed with the latest education news, announcements and opportunities in Liberia.</p><i className="ai-red-stroke"/></div><div className="np-hero-flag"><LiberiaFlag size={150}/><p>Better Education<br/>A Stronger Liberia</p></div></section>
  <div className="np-layout"><section className="np-main"><header><h2><Newspaper/>Latest Education News</h2><Link to="/news" search={{all:true,q:''}}>View All News <ArrowRight size={18}/></Link></header>
   {(all||query)&&<form className="np-search" onSubmit={e=>{e.preventDefault();}}><Search size={18}/><input aria-label="Search news articles" value={query} readOnly/><Link to="/news" search={{all:false,q:''}}>Clear</Link></form>}
   {slug?<article className="np-detail">{selected?<><Link to="/news">← All news</Link><img src={selected.image} alt=""/><small>{dateLabel(selected.date)}{selected.example?' · Reference example':''}</small><h1>{selected.title}</h1><p>{selected.content}</p><Link to={selected.slug==='scholarship-opportunities'?'/news':'/courses'}>{selected.slug==='scholarship-opportunities'?'View opportunities':'Explore learning resources'} <ArrowRight size={16}/></Link></>:<><h1>Article unavailable</h1><Link to="/news">Back to news</Link></>}</article>:<div className="np-articles">{shown.map(a=><article className="np-article" key={a.slug}><div className="np-thumbnail"><img src={a.image} width={992} height={672} loading="lazy" alt={a.example?'Illustrative education building':a.title}/><span><CalendarDays size={14}/>{dateLabel(a.date)}</span></div><div><h3>{a.title}</h3><p>{a.excerpt}</p><Link to="/news/$slug" params={{slug:a.slug}}>Read More <ArrowRight size={16}/></Link></div></article>)}</div>}
   {!shown.length&&!slug&&<p>No matching news articles.</p>}
   <p className="np-editorial-note">Reference dates are retained from the design. Ministry content is an unverified example; current official dates must be confirmed.</p>
  </section><aside className="np-side"><section><h2><Star/>Latest Updates</h2><ol>{articles.slice(0,4).map(a=><li key={a.slug}><Link to="/news/$slug" params={{slug:a.slug}}><small>{dateLabel(a.date)}</small><b>{a.title}</b></Link></li>)}</ol><Link className="np-all" to="/news" search={{all:true,q:''}}>View All Updates <ArrowRight size={15}/></Link></section>
   <section><h2><CalendarDays/>Upcoming Events <Link to="/events">View Calendar →</Link></h2>{events.length?events.map(e=><Link key={e.title} to="/events" className="np-event"><span>{e.date?<>{new Date(`${e.date}T12:00:00`).toLocaleString('en-US',{month:'short'})}<b>{new Date(`${e.date}T12:00:00`).getDate()}</b></>:<>TBA</>}</span><b>{e.title}</b></Link>):<p className="np-empty-events">No confirmed upcoming events.<br/><Link to="/events">View calendar →</Link></p>}</section>
   <section className="np-subscribe"><h2><Mail/>Subscribe for Updates</h2><p>Get the latest news and alerts from BridgeLIB.</p><form onSubmit={e=>{e.preventDefault();const parsed=subscriptionEmail.safeParse(email);if(!parsed.success){setValidation('Enter a valid email address.');return;}setValidation('');mutation.mutate(parsed.data);}}><input type="email" required maxLength={255} aria-label="Email address" placeholder="Enter your email address" value={email} onChange={e=>setEmail(e.target.value)}/><Button disabled={mutation.isPending}>{mutation.isPending?'Saving…':'Subscribe'}</Button></form>{(validation||mutation.error)&&<p role="alert">{validation||mutation.error?.message}{/sign in|session/i.test(mutation.error?.message??'')&&<Link to="/" search={{auth:'login'}}> Sign in</Link>}</p>}{mutation.isSuccess&&<p role="status">Your newsletter preference is saved.</p>}</section>
  </aside></div>
 </div></LearnerShell>;
}