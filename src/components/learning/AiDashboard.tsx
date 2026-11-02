import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  Lightbulb,
  ListChecks,
  MessageCircle,
  Send,
  Star,
  Trash2,
  Trophy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LiberiaFlag } from "@/components/site/SiteChrome";
import robot from "@/assets/bridgelib-ai-robot.png";
import brain from "@/assets/bridgelib-ai-brain.png";
import students from "@/assets/bridgelib-ai-students.jpg";
import books from "@/assets/bridgelib-ai-books.png";
import { LearnerShell } from "./LearnerPages";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const CHIPS = [
  [
    "Explain Quadratic Equations",
    "Explain quadratic equations step by step with a worked example.",
  ],
  [
    "WASSCE Past Papers",
    "Give me 3 WASSCE-style Mathematics practice questions with full solutions. Clearly label them as generated practice, not official past papers.",
  ],
  ["Study Tips", "Give me practical study tips to prepare for WASSCE in the next 8 weeks."],
  [
    "Create Practice Quiz",
    "Create a 5-question multiple-choice practice quiz on photosynthesis, with answers at the end.",
  ],
  [
    "Summarize a Lesson",
    "Summarize the main points of the lesson on the causes of World War I in simple bullet points.",
  ],
] as const;
const FEATURES = [
  {
    Icon: GraduationCap,
    title: "Study Tutor",
    description: "Get help with any subject.",
    tone: "tutor",
    prompt:
      "Be my study tutor. Ask which subject and topic I want to learn, then teach it step by step.",
  },
  {
    Icon: ListChecks,
    title: "Quiz Generator",
    description: "Create custom quizzes.",
    tone: "quiz",
    prompt:
      "Create a custom practice quiz for me. Ask which subject, topic and difficulty first, then give questions with answers at the end.",
  },
  {
    Icon: FileText,
    title: "Summarizer",
    description: "Get key points quickly.",
    tone: "summary",
    prompt:
      "Help me summarize a lesson. Ask me to paste the lesson or notes, then extract the key points clearly.",
  },
  {
    Icon: Trophy,
    title: "Exam Helper",
    description: "Prepare for WASSCE & more.",
    tone: "exam",
    prompt:
      "Help me prepare for WASSCE. Ask which subject I need, then suggest revision topics and practice questions.",
  },
  {
    Icon: CalendarDays,
    title: "Learning Planner",
    description: "Plan your study schedule.",
    tone: "planner",
    prompt:
      "Help me plan my study schedule. Ask my subjects, exam date and available study time, then make a realistic weekly plan.",
  },
] as const;
const WELCOME = [
  "Explain WASSCE Mathematics",
  "Help with English essay",
  "Solve a physics question",
  "Give study tips",
  "Find past papers",
];

export function AiDashboardPage() {
  const [name, setName] = useState("Student");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let live = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const profile = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .maybeSingle();
      const n = profile.data?.full_name || data.user.user_metadata["full_name"];
      if (live && typeof n === "string" && n.trim()) setName(n.trim());
    });
    return () => {
      live = false;
    };
  }, []);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai-chat",
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
        fetch: async (url, init) => {
          const response = await fetch(url, init);
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message ?? "BridgeLIB AI is unavailable.");
          }
          return response;
        },
      }),
    [],
  );
  const { messages, sendMessage, setMessages, status, stop } = useChat({
    id: "bridgelib-ai",
    transport,
    onError: (e) => setError(e.message),
  });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => {
    if (
      !busy &&
      (!document.activeElement ||
        document.activeElement === document.body ||
        document.activeElement === inputRef.current)
    )
      inputRef.current?.focus({ preventScroll: true });
  }, [busy]);
  const focusChat = () => {
    chatRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "center",
    });
    inputRef.current?.focus({ preventScroll: true });
  };
  const ask = (raw: string) => {
    const text = raw.trim();
    if (busy) return;
    if (!text) {
      setError("Enter a question before sending.");
      return;
    }
    if (text.length > 10000) {
      setError("Please keep your question under 10,000 characters.");
      return;
    }
    setError("");
    setDraft("");
    void sendMessage({ text });
    inputRef.current?.focus({ preventScroll: true });
  };
  const clear = () => {
    setMessages([]);
    setError("");
    setDraft("");
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <LearnerShell active="study-tools" aiReference>
      <div className="ai-dash">
        <section className="ai-hero">
          <img
            className="ai-hero-students"
            src={students}
            width={1024}
            height={768}
            alt="Smiling Liberian students in blue school uniforms"
          />
          <div className="ai-hero-copy">
            <h1>
              Bridge<span>LIB</span> <em>AI</em>
            </h1>
            <h2>
              Your <mark>Smart</mark> Learning Assistant
            </h2>
            <p>
              Ask questions, get instant help, and learn better
              <br className="ai-desktop-break" /> with the power of Artificial Intelligence.
            </p>
            <i className="ai-red-stroke" />
          </div>
          <div className="ai-hero-future">
            <img
              src={brain}
              width={816}
              height={816}
              alt="Blue artificial intelligence head and processor"
            />
            <p>
              Smarter Learning.
              <br />
              Brighter Future.
            </p>
          </div>
        </section>
        <div className="ai-tiles">
          <Button variant="ghost" onClick={focusChat}>
            <MessageCircle />
            <span>
              <b>Ask Anything</b>
              <small>(Any Subject)</small>
            </span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setDraft("Explain ");
              focusChat();
            }}
          >
            <Lightbulb />
            <span>
              <b>Get Explanations</b>
              <small>(Step-by-Step)</small>
            </span>
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              ask(
                "Create practice questions with answers. Ask which subject and topic I want to practice first.",
              )
            }
          >
            <GraduationCap />
            <span>
              <b>Practice Questions</b>
              <small>(with Answers)</small>
            </span>
          </Button>
          <Link to="/progress">
            <BarChart3 />
            <span>
              <b>Track Your</b>
              <small>Learning Progress</small>
            </span>
          </Link>
        </div>
        <div className="ai-grid">
          <section className="ai-chat" ref={chatRef} aria-label="BridgeLIB AI chat">
            <header>
              <img src={robot} loading="lazy" width={816} height={816} alt="" />
              <b>BridgeLIB AI Assistant</b>
              <span className="ai-chat-online">
                <i />
                Online
              </span>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  disabled={busy}
                  onClick={clear}
                >
                  <Trash2 size={17} />
                </Button>
              )}
            </header>
            <Conversation className="ai-transcript">
              <ConversationContent className="ai-conversation-content">
                {!messages.length && (
                  <Message from="assistant" className="ai-welcome">
                    <img
                      src={robot}
                      loading="lazy"
                      width={816}
                      height={816}
                      alt="BridgeLIB AI assistant"
                    />
                    <MessageContent className="ai-welcome-bubble">
                      <p>
                        <b>Hello {name}! 👋</b>
                        <br />
                        I'm your BridgeLIB AI assistant. How can I help you today?
                      </p>
                      <p>You can ask me anything like:</p>
                      <ul>
                        {WELCOME.map((text) => (
                          <li key={text}>
                            <CheckCircle2 size={16} />
                            {text}
                          </li>
                        ))}
                      </ul>
                    </MessageContent>
                  </Message>
                )}
                {messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.parts.map((part, index) =>
                        part.type === "text" ? (
                          <MessageResponse key={index}>{part.text}</MessageResponse>
                        ) : part.type === "reasoning" && status === "streaming" ? (
                          <Shimmer key={index}>BridgeLIB AI is thinking…</Shimmer>
                        ) : null,
                      )}
                    </MessageContent>
                  </Message>
                ))}
                {status === "submitted" && <Shimmer>BridgeLIB AI is thinking…</Shimmer>}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
            <div className="ai-chips">
              {CHIPS.map(([label, prompt]) => (
                <Button variant="outline" key={label} disabled={busy} onClick={() => ask(prompt)}>
                  {label}
                </Button>
              ))}
            </div>
            {error && (
              <p role="alert" className="ai-error">
                {error}{" "}
                {/sign in/i.test(error) && (
                  <Link to="/" search={{ auth: "login" }}>
                    Sign in
                  </Link>
                )}
              </p>
            )}
            <PromptInput className="ai-composer" onSubmit={({ text }) => ask(text)}>
              <PromptInputTextarea
                ref={inputRef}
                aria-label="Ask BridgeLIB AI"
                placeholder="Type your question here..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={10000}
              />
              <PromptInputFooter>
                <PromptInputSubmit
                  status={status}
                  onStop={() => void stop()}
                  disabled={!busy && !draft.trim()}
                >
                  {!busy ? <Send size={21} /> : undefined}
                </PromptInputSubmit>
              </PromptInputFooter>
            </PromptInput>
          </section>
          <aside className="ai-side">
            <section className="ai-features">
              <h3>
                <Star size={27} />
                Popular AI Features
              </h3>
              {FEATURES.map(({ Icon, title, description, tone, prompt }) => (
                <Button variant="ghost" key={title} disabled={busy} onClick={() => ask(prompt)}>
                  <span className={`ai-feature-icon ai-tone-${tone}`}>
                    <Icon size={26} />
                  </span>
                  <span className="ai-feature-copy">
                    <b>{title}</b>
                    <small>{description}</small>
                  </span>
                  <ChevronRight size={19} />
                </Button>
              ))}
            </section>
            <section className="ai-tips">
              <h3>
                <Lightbulb size={28} />
                BridgeLIB AI Tips
              </h3>
              <ul>
                <li>
                  <CheckCircle2 />
                  Ask clear and specific questions.
                </li>
                <li>
                  <CheckCircle2 />
                  Use keywords like “explain”, “solve”, “summarize”.
                </li>
                <li>
                  <CheckCircle2 />
                  Explore different tools to learn better.
                </li>
              </ul>
            </section>
          </aside>
        </div>
        <section className="ai-upgrade">
          <img
            src={books}
            loading="lazy"
            width={992}
            height={672}
            alt="Educational books and a golden crown"
          />
          <div>
            <b>Upgrade Your Learning with BridgeLIB AI!</b>
            <small>Study smarter, prepare better, and achieve more in school and beyond.</small>
          </div>
          <Link to="/study-tools" className="bl-btn bl-btn-red">
            Start Learning Now <ArrowRight size={20} />
          </Link>
          <LiberiaFlag size={96} />
        </section>
      </div>
    </LearnerShell>
  );
}
