import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Search, LayoutGrid, GraduationCap, User, BookOpen, FileText, CalendarDays, Settings, CreditCard, HelpCircle, ChevronRight,
  MessagesSquare, Plus, Minus, Headphones, MessageCircle, Mail, Lightbulb, CheckCircle2, Clapperboard, BookOpenText, Star,
  ArrowRight, Download, X,
} from 'lucide-react';
import { SiteLayout } from './SiteChrome';
import { parseBlocks, useSiteContent } from '@/lib/site-content';
import { resolveVideoSource } from '@/lib/video';
import { supabase } from '@/lib/supabase';
import hero from '@/assets/help-center-students.jpg.asset.json';
import guide from '@/assets/bridgelib-user-guide.pdf.asset.json';
import { HELP_CATEGORIES, HELP_FAQS, searchFaqs, type HelpCategory } from '@/lib/help-faqs';

const icons: Record<HelpCategory, typeof GraduationCap> = { start: GraduationCap, account: User, courses: BookOpen, exams: FileText, events: CalendarDays, tech: Settings, payments: CreditCard, other: HelpCircle };
type Kind = 'chat' | 'message' | 'problem' | 'feedback';
const forms: Record<Kind, { title: string; intro: string; subject: string; button: string }> = {
  chat: { title: 'Chat with Support', intro: 'Live chat is not staffed in real time yet. Send your question here and our support team will reply — you can follow the reply under My Enquiries on your profile.', subject: 'Support chat request', button: 'Send to Support' },
  message: { title: 'Send Us a Message', intro: 'Tell us how we can help. We reply to the email on your account.', subject: '', button: 'Send Message' },
  problem: { title: 'Report a Problem', intro: 'Describe what went wrong and what page you were on.', subject: 'Problem report', button: 'Report Issue' },
  feedback: { title: 'Rate Our Help', intro: 'How helpful was the Help Center?', subject: 'Help Center feedback', button: 'Send Feedback' },
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return <div className="sp-modal-back" role="presentation" onClick={onClose}><div className="sp-modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}><header><h2>{title}</h2><button type="button" aria-label="Close" onClick={onClose}><X size={18} /></button></header>{children}</div></div>;
}

function SupportForm({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const cfg = forms[kind]; const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [rating, setRating] = useState(0); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [done, setDone] = useState(false);
  useEffect(() => { void supabase.auth.getUser().then(r => setUserId(r.data.user?.id ?? null)); }, []);
  return <Modal title={cfg.title} onClose={onClose}>
    {userId === undefined ? <p>Loading…</p> : userId === null ? <><p className="sp-muted">Please sign in so we can reply to you and keep your request private.</p><div className="sp-modal-foot"><Link to="/contact" className="sp-btn sp-btn-outline">Contact page</Link><a href="/?auth=login" className="sp-btn sp-btn-primary">Sign in</a></div></>
      : done ? <><p className="sp-verified"><CheckCircle2 size={18} />Thank you — your {kind === 'feedback' ? 'feedback' : 'request'} was sent.</p><div className="sp-modal-foot"><button className="sp-btn sp-btn-primary" onClick={onClose}>Close</button></div></>
      : <form className="sp-modal-form" onSubmit={async e => {
        e.preventDefault(); const f = new FormData(e.currentTarget);
        const subject = String(f.get('subject') ?? cfg.subject).trim(); const message = String(f.get('message') ?? '').trim();
        if (kind === 'feedback' && !rating) return setMsg('Choose a star rating.');
        if (kind !== 'feedback' && message.length < 10) return setMsg('Please write at least 10 characters.');
        if (kind === 'message' && subject.length < 3) return setMsg('Add a short subject.');
        setBusy(true); setMsg('');
        const r = await supabase.from('support_requests').insert({ user_id: userId, kind, subject: subject.slice(0, 200), message: message.slice(0, 5000), rating: kind === 'feedback' ? rating : null, page: '/faq' });
        setBusy(false); if (r.error) setMsg(r.error.message); else setDone(true);
      }}>
        <p className="sp-muted">{cfg.intro}</p>
        {kind === 'message' && <label>Subject<input name="subject" maxLength={200} required /></label>}
        {kind === 'feedback' && <div className="hc-stars" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}><Star size={28} className={n <= rating ? 'is-on' : ''} /></button>)}</div>}
        <label>{kind === 'feedback' ? 'Comments (optional)' : 'Message'}<textarea name="message" rows={5} maxLength={5000} required={kind !== 'feedback'} /></label>
        <div className="sp-modal-foot"><button type="button" className="sp-btn sp-btn-outline" onClick={onClose}>Cancel</button><button className="sp-btn sp-btn-primary" disabled={busy}>{busy ? 'Sending…' : cfg.button}</button></div>
        {msg && <p className="sp-form-msg" role="alert">{msg}</p>}
      </form>}
  </Modal>;
}

export function HelpCenterPage() {
  const content = useSiteContent().data;
  const custom = parseBlocks(content?.faq).map(([q, a]) => ({ q, a, cat: 'other' as HelpCategory }));
  const all = useMemo(() => [...HELP_FAQS, ...custom], [custom.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [term, setTerm] = useState(''); const [query, setQuery] = useState(''); const [cat, setCat] = useState<HelpCategory | null>(null);
  const [open, setOpen] = useState<string | null>(null); const [form, setForm] = useState<Kind | null>(null); const [video, setVideo] = useState(false);
  const shown = searchFaqs(all, query, cat);
  const initial = !query && !cat ? shown.slice(0, 8) : shown;
  const src = resolveVideoSource(content?.video_url);

  return <SiteLayout>
    <div className="hc-page">
      <section className="hc-hero"><img src={hero.url} alt="Smiling Liberian students outside their school" /><div className="hc-hero-text"><span className="hc-pill">Bridge<b>LIB</b></span><h1>Help Center &amp;<br /><em>Frequently Asked Questions</em></h1><p>Find quick answers to common questions and get the help you need, anytime, anywhere.</p></div><p className="hc-slogan">Learn • Ask • Succeed</p></section>
      <form className="hc-search" role="search" onSubmit={e => { e.preventDefault(); setQuery(term.trim()); setCat(null); }}>
        <Search size={22} aria-hidden /><input type="search" value={term} onChange={e => { setTerm(e.target.value); if (!e.target.value) setQuery(''); }} placeholder="Search for help... (e.g. WASSCE, registration, results)" aria-label="Search help" /><button><Search size={17} />Search</button>
      </form>
      <div className="hc-grid">
        <aside className="hc-card hc-cats"><h2 className="hc-head"><LayoutGrid size={24} />Help Categories</h2>
          {HELP_CATEGORIES.map(c => { const Icon = icons[c.id]; return <button key={c.id} type="button" className={cat === c.id ? 'is-active' : ''} aria-pressed={cat === c.id} onClick={() => { setCat(cat === c.id ? null : c.id); setQuery(''); setTerm(''); setOpen(null); }}><Icon size={28} /><span><b>{c.label}</b><small>{c.hint}</small></span><ChevronRight size={20} /></button>; })}
        </aside>
        <section className="hc-card hc-faq"><h2 className="hc-head"><MessagesSquare size={26} />{query ? `Results for “${query}”` : cat ? HELP_CATEGORIES.find(c => c.id === cat)?.label : 'Frequently Asked Questions'}</h2>
          {(query || cat) && <button type="button" className="hc-clear" onClick={() => { setQuery(''); setTerm(''); setCat(null); }}>Show all questions</button>}
          {initial.length ? <ol>{initial.map((f, i) => { const isOpen = open === f.q; return <li key={f.q} className={isOpen ? 'is-open' : ''}><button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.q)}><span className="hc-num">{i + 1}</span><span className="hc-q">{f.q}</span>{isOpen ? <Minus size={22} /> : <Plus size={22} />}</button>{isOpen && <p>{f.a}</p>}</li>; })}</ol>
            : <p className="hc-empty">No questions match. Try other words, or <button type="button" className="sp-link" onClick={() => setForm('message')}>send us a message</button>.</p>}
        </section>
        <div className="hc-right">
          <section className="hc-card hc-help"><div className="hc-help-head"><Headphones size={46} /><div><h2>Need More Help?</h2><p>Our support team is ready to assist you.</p></div></div>
            <button type="button" className="hc-btn-chat" onClick={() => setForm('chat')}><MessageCircle size={24} />Start Live Chat</button><p className="hc-or">or</p><button type="button" className="hc-btn-msg" onClick={() => setForm('message')}><Mail size={22} />Send Us a Message</button></section>
          <section className="hc-card hc-tips"><h2><Lightbulb size={30} />Helpful Tips</h2><ul>{['Use the search box to find answers fast.', 'Check our FAQs before contacting us.', 'Keep your account information safe.'].map(t => <li key={t}><CheckCircle2 size={20} />{t}</li>)}<li><CheckCircle2 size={20} /><span>Visit the <Link to="/news" className="hc-tip-link">News</Link> section for updates.</span></li></ul></section>
        </div>
      </div>
      <div className="hc-actions">
        <article className="hc-action is-dark"><Clapperboard size={64} /><div><h3>Watch Tutorial Videos</h3><p>Learn step by step with our easy video guides.</p><button type="button" className="hc-act-btn is-blue" onClick={() => setVideo(true)}>Watch Now <ChevronRight size={16} /></button></div></article>
        <article className="hc-action"><BookOpenText size={56} className="is-red" /><div><h3>Download User Guide</h3><p>Get our complete user manual (PDF).</p><a className="hc-act-btn is-red" href={guide.url} download="BridgeLIB-User-Guide.pdf">Download PDF <Download size={16} /></a></div></article>
        <article className="hc-action"><HelpCircle size={56} className="is-blue" /><div><h3>Report a Problem</h3><p>Let us know about any issue you encounter.</p><button type="button" className="hc-act-btn is-blue" onClick={() => setForm('problem')}>Report Issue <ArrowRight size={16} /></button></div></article>
        <article className="hc-action"><Star size={52} className="is-gold" /><div><h3>Rate Our Help</h3><p>Help us improve by rating your experience.</p><button type="button" className="hc-act-btn is-red" onClick={() => setForm('feedback')}>Give Feedback <Star size={15} /></button></div></article>
      </div>
    </div>
    {form && <SupportForm kind={form} onClose={() => setForm(null)} />}
    {video && <Modal title="Tutorial Videos" onClose={() => setVideo(false)}>{src ? (src.kind === 'embed' ? <iframe className="hc-video" src={src.src} title="BridgeLIB tutorial" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <video className="hc-video" src={src.src} controls autoPlay />) : <><p className="sp-muted">Our video tutorial is being prepared. Meanwhile, follow the step-by-step written guide.</p><div className="sp-modal-foot"><Link to="/study-guide/steps" className="sp-btn sp-btn-primary">Open step-by-step guide</Link></div></>}</Modal>}
  </SiteLayout>;
}
