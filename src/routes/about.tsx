import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, Eye, GraduationCap, ShieldCheck, Target, Users, Laptop, Home, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteChrome";
import { referencePhotos } from '@/lib/reference-photos';
const aboutImg = referencePhotos.about;
const studyImg = referencePhotos.math;
const joinImg = referencePhotos.join;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BridgeLIB — Empowering learners in Liberia" },
      {
        name: "description",
        content:
          "BridgeLIB is an online learning platform helping Liberian students access quality education and prepare for the WASSCE.",
      },
      { property: "og:title", content: "About BridgeLIB — Empowering learners in Liberia" },
      {
        property: "og:description",
        content: "Our mission, vision, and the platform features built for Liberian students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const features = [
  {
    icon: BookOpen,
    title: "Subject lessons",
    text: "Learning organised by subject, level and grade.",
  },
  {
    icon: GraduationCap,
    title: "WASSCE practice",
    text: "Timed practice with scoring and explanations.",
  },
  { icon: BarChart3, title: "Progress", text: "See results after every practice attempt." },
  {
    icon: ShieldCheck,
    title: "Secure accounts",
    text: "Each learner’s data stays private to them.",
  },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="bl-container bl-about bl-about-reference">
        <div>
          <nav className="bl-crumbs bl-crumbs-light" aria-label="Breadcrumb"><Link to="/"><Home size={14}/>Home</Link><ChevronRight size={14}/>About</nav>
          <h1 className="bl-page-title">About Bridge<span className="bl-red">LIB</span></h1>
          <p className="bl-lead-strong">Empowering Learners, Building a Stronger Liberia</p>
          <p className="bl-muted">
            BridgeLIB is an online learning platform designed to help Liberian students access
            quality education, prepare for the WASSCE, and build a brighter future. We believe every
            learner deserves the right tools, support, and guidance to achieve their dreams.
          </p>
          <div className="bl-grid-4 bl-mt">
            {features.map((f) => (
              <div className="bl-card bl-stat" key={f.title}>
                <span className="bl-icon-tile blue">
                  <f.icon size={20} />
                </span>
                <b>{f.title}</b>
                <small>{f.text}</small>
              </div>
            ))}
          </div>
        </div>
        <figure className="bl-about-photo">
          <img
            src={aboutImg}
            alt="Liberian students holding books beneath the Liberian flag"
            width={768}
            height={1024}
            loading="lazy"
          />
          <figcaption>
            Education
            <br />
            Changes Lives
          </figcaption>
        </figure>
      </section>
      <section className="bl-container bl-about-values">
        <div className="bl-about-mission">
          <div><Target/><div><h2 className="bl-h3">Our Mission</h2><p className="bl-muted">To provide accessible, high-quality, and affordable education for every Liberian student, using technology and innovation.</p></div></div>
          <div><Eye/><div><h2 className="bl-h3">Our Vision</h2><p className="bl-muted">A Liberia where every young person is educated, skilled, and ready to contribute to national development.</p></div></div>
        </div>
        <div className="bl-about-why"><h2 className="bl-h2">Why BridgeLIB?</h2><p className="bl-muted">We are a community of learners working towards a stronger Liberia.</p><div className="bl-grid-3 bl-mt">{features.slice(0,3).map(f=><article className="bl-card bl-about-feature" key={f.title}><span className="bl-icon-tile blue"><f.icon size={22}/></span><h3>{f.title}</h3><p className="bl-muted">{f.text}</p></article>)}</div></div>
      </section>
      <section className="bl-container bl-about-impact"><div><h2>Our Purpose</h2><p>Real learning. Steady progress.<br/>A brighter future for Liberia.</p></div>{[[Users,'Learners first'],[BookOpen,'Subject resources'],[GraduationCap,'Exam preparation'],[ShieldCheck,'Private learning records']].map(([Icon,label])=>{const I=Icon as typeof Users;return <div key={String(label)}><I size={30}/><strong>{String(label)}</strong></div>;})}</section>
      <section className="bl-container bl-about-platform"><div><h2 className="bl-h2">Our Education Platform</h2><p className="bl-muted">Designed for Liberian students, built for a better future.</p><p className="bl-muted bl-mt">BridgeLIB brings subject courses, exam preparation, quizzes, progress tracking and learning resources together. Whether you are preparing for WASSCE or improving your skills, there is a place for you here.</p><a href="/?auth=signup" className="bl-btn bl-btn-primary bl-mt">Get Started Free <ArrowRight size={16}/></a></div><img src={studyImg} alt="Student working through a lesson" loading="lazy"/><div className="bl-about-platform-features">{[[Laptop,'Learn Anywhere','Your learning, wherever you are.'],[BookOpen,'Subject Content','Published lessons and practice questions.'],[Users,'Support & Community','Learn with your teachers and classmates.']].map(([Icon,title,text])=>{const I=Icon as typeof Laptop;return <div key={String(title)}><span className="bl-icon-tile blue"><I size={22}/></span><div><h3>{String(title)}</h3><p className="bl-muted">{String(text)}</p></div></div>;})}</div></section>
      <section className="bl-container bl-about-join"><img src={joinImg} alt="Liberian student with books" loading="lazy"/><div><h2>Join BridgeLIB Today</h2><p>Learn with a growing community of students, teachers and schools.</p><a href="/?auth=signup" className="bl-btn bl-btn-red">Get Started Free <ArrowRight size={16}/></a></div></section>
    </SiteLayout>
  );
}
