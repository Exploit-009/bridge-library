import { useRef, useState } from "react";
import { BookOpen, ListChecks, Send, Square } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LearnerShell } from "./LearnerPages";

type Mode = "explain" | "quiz";
const LEVELS = ["Junior High", "Senior High", "WASSCE"] as const;
const EXAMPLES = ["Explain quadratic equations", "Photosynthesis", "Causes of the Liberian civil war", "Balancing chemical equations"];

export function StudyToolsPage() {
  const [mode, setMode] = useState<Mode>("explain");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("WASSCE");
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);

  async function generate() {
    if (topic.trim().length < 3) return setError("Enter a question, lesson or topic (at least 3 characters).");
    setError(""); setOutput(""); setBusy(true);
    const ctrl = new AbortController(); abort.current = ctrl;
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sign in to use BridgeLIB AI.");
      const res = await fetch("/api/study-tools", {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ mode, topic, level }),
      });
      if (!res.ok || !res.body) {
        const p = await res.json().catch(() => ({}));
        throw new Error(p.message ?? "BridgeLIB AI is unavailable.");
      }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      for (;;) { const { done, value } = await reader.read(); if (done) break; setOutput((o) => o + dec.decode(value, { stream: true })); }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); abort.current = null; }
  }

  return (
    <LearnerShell active="study-tools">
      <section className="st-wrap">
        <header><h1>BridgeLIB AI Study Tools</h1><p>Enter a question, lesson or exam topic and get a clear explanation or a practice quiz.</p></header>
        <div className="st-modes" role="tablist">
          <button role="tab" aria-selected={mode === "explain"} className={mode === "explain" ? "on" : ""} onClick={() => setMode("explain")}><BookOpen size={18} /> Explain it</button>
          <button role="tab" aria-selected={mode === "quiz"} className={mode === "quiz" ? "on" : ""} onClick={() => setMode("quiz")}><ListChecks size={18} /> Practice quiz</button>
        </div>
        <label className="st-label">Level
          <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
        </label>
        <label className="st-label">Your question or topic
          <textarea value={topic} maxLength={2000} rows={4} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. How do I solve x² − 5x + 6 = 0?" />
        </label>
        <div className="st-chips">{EXAMPLES.map((x) => <button key={x} type="button" onClick={() => setTopic(x)}>{x}</button>)}</div>
        <div className="st-actions">
          {busy
            ? <button className="bl-btn" onClick={() => abort.current?.abort()}><Square size={16} /> Stop</button>
            : <button className="bl-btn bl-btn-primary" onClick={generate}><Send size={16} /> {mode === "explain" ? "Explain" : "Generate quiz"}</button>}
        </div>
        {error && <p className="st-error" role="alert">{error}</p>}
        {(busy || output) && <article className="st-output" aria-live="polite">{output || "Thinking…"}</article>}
      </section>
    </LearnerShell>
  );
}
