import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { BarChart3, BookOpenCheck, Bot, CalendarClock, ChevronRight, FileText, GraduationCap, HelpCircle, Lightbulb, ListChecks, MessageCircleQuestion } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { referencePhotos } from "@/lib/reference-photos";
import { LiberiaFlag } from "@/components/site/SiteChrome";
import { LearnerShell } from "./LearnerPages";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const CHIPS: [string, string][] = [
  ["Explain Quadratic Equations", "Explain quadratic equations step by step with a worked example."],
  ["WASSCE Past Papers", "Give me 3 WASSCE-style Mathematics past questions with full solutions."],
  ["Study Tips", "Give me practical study tips to prepare for WASSCE in the next 8 weeks."],
  ["Create Practice Quiz", "Create a 5-question multiple-choice practice quiz on photosynthesis, with answers at the end."],
  ["Summarize a Lesson", "Summarize the main points of the lesson on the causes of World War I in simple bullet points."],
];
const FEATURES: [typeof Bot, string, string, string][] = [
  [GraduationCap, "Study Tutor", "Learn any topic step by step", "Be my study tutor. Ask me which subject and topic I want to learn, then teach it step by step."],
  [ListChecks, "Quiz Generator", "Create quizzes to test yourself", "Quiz mode: create a 5-question multiple-choice practice quiz for me. Ask which subject and topic first."],
  [FileText, "Summarizer", "Summarize notes and lessons", "I will paste my notes. Summarize them into short, clear bullet points."],
  [BookOpenCheck, "Exam Helper", "Prepare for WASSCE exams", "Help me prepare for WASSCE: suggest the key topics to revise and give one practice question per subject."],
  [CalendarClock, "Learning Planner", "Plan your study schedule", "Create a weekly study timetable for me for WASSCE preparation with 2 hours of study each weekday."],
];
const TILES: [typeof Bot, string, string][] = [
  [MessageCircleQuestion, "Ask Anything", "Get instant answers to your questions."],
  [Lightbulb, "Get Explanations", "Understand topics step by step."],
  [HelpCircle, "Practice Questions", "Test yourself with smart quizzes."],
  [BarChart3, "Track Your Learning Progress", "Stay on top of your goals."],
];

export function AiDashboardPage() {
  const [name, setName] = useState("Student");
  const [error, setError] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const n = data.user?.user_metadata?.["full_name"];
      if (typeof n === "string" && n.trim()) setName(n.trim());
    });
  }, []);
  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/ai-chat",
    headers: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
    },
    fetch: async (url, init) => {
      const r = await fetch(url, init);
      if (!r.ok) { const p = await r.json().catch(() => ({})); throw new Error(p.message ?? "BridgeLIB AI is unavailable."); }
      return r;
    },
  }), []);
  const { messages, sendMessage, status, stop } = useChat({ id: "bridgelib-ai", transport, onError: (e) => setError(e.message) });
  const busy = status === "submitted" || status === "streaming";
  const ask = (text: string) => {
    if (busy) return;
    setError("");
    chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    void sendMessage({ text });
  };

  return (
    <LearnerShell active="study-tools">
      <div className="ai-dash">
        <section className="ai-hero">
          <div>
            <h1><span>BridgeLIB AI</span> Your Smart Learning Assistant</h1>
            <p>Ask questions, get explanations, practice quizzes and study smarter, anytime.</p>
            <p className="ai-slogan">Smarter Learning. Brighter Future.</p>
          </div>
          <img src={referencePhotos.student} alt="Liberian student studying" />
        </section>

        <div className="ai-tiles">{TILES.map(([I, t, d]) => <div key={t}><span><I size={22} /></span><b>{t}</b><small>{d}</small></div>)}</div>

        <div className="ai-grid">
          <section className="ai-chat" ref={chatRef}>
            <header><span className="ai-bot"><Bot size={22} /></span><div><b>AI Assistant</b><small><i /> Online</small></div></header>
            <Conversation className="ai-transcript">
              <ConversationContent>
                {!messages.length && <div className="ai-greet">
                  <p><b>Hello {name}! 👋</b> I'm BridgeLIB AI. How can I help you today?</p>
                  <ul><li>Explain a topic</li><li>Solve a math problem</li><li>Create a practice quiz</li><li>Summarize a lesson</li><li>WASSCE exam tips</li></ul>
                </div>}
                {messages.map((m) => <Message key={m.id} from={m.role}><MessageContent>
                  {m.parts.map((p, i) => p.type === "text" ? <MessageResponse key={i}>{p.text}</MessageResponse> : null)}
                </MessageContent></Message>)}
                {status === "submitted" && <Shimmer>BridgeLIB AI is thinking…</Shimmer>}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
            <div className="ai-chips">{CHIPS.map(([l, p]) => <button key={l} type="button" disabled={busy} onClick={() => ask(p)}>{l}</button>)}</div>
            {error && <p role="alert" className="ai-error">{error} {/sign in/i.test(error) && <a href="/?auth=login">Sign in</a>}</p>}
            <PromptInput onSubmit={({ text }) => { if (text.trim()) ask(text.trim()); }}>
              <PromptInputTextarea aria-label="Ask BridgeLIB AI" placeholder="Type your question here…" disabled={busy} />
              <PromptInputFooter className="justify-end"><PromptInputSubmit status={status} onStop={() => void stop()} /></PromptInputFooter>
            </PromptInput>
          </section>

          <aside className="ai-side">
            <section><h3>Popular AI Features</h3>
              {FEATURES.map(([I, t, d, p]) => <button key={t} type="button" disabled={busy} onClick={() => ask(p)}><span><I size={18} /></span><div><b>{t}</b><small>{d}</small></div><ChevronRight size={16} /></button>)}
            </section>
            <section className="ai-tips"><h3>BridgeLIB AI Tips</h3>
              <ul><li>Be specific with your questions.</li><li>Ask for step-by-step explanations.</li><li>Practice regularly with quizzes.</li><li>Review and track your progress.</li></ul>
              <Link to="/study-tools" className="bl-link">Open AI Study Tools →</Link>
            </section>
          </aside>
        </div>

        <section className="ai-upgrade">
          <LiberiaFlag size={40} />
          <div><b>Upgrade Your Learning with BridgeLIB AI!</b><small>Smarter tools. Better results. Brighter future.</small></div>
          <Link to="/my-courses" className="bl-btn bl-btn-red">Start Learning Now</Link>
        </section>
      </div>
    </LearnerShell>
  );
}
