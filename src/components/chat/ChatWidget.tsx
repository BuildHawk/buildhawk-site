"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; ts: number };

const STORAGE_KEY = "bh-chat-history";
const SEEN_KEY = "bh-chat-seen";

const greeting: Message = {
  id: "greeting",
  role: "assistant",
  content:
    "G'day. This is BuildHawk Estimate Intake, powered by Hawktress. What can I help you with today?",
  ts: Date.now(),
};

const quickReplies = [
  "I'm a builder",
  "I'm a trade",
  "I'm a supplier",
  "Pricing",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Render a message body, turning [label](url) markdown links and bare https://
// URLs into clickable anchors. Same-origin links resolve to a relative path so
// the on-page anchors (#intake, #waitlist) scroll smoothly without reloading.
function renderMessage(content: string) {
  const pattern =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;
  const out: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      out.push(content.slice(lastIndex, match.index));
    }
    const [full, mdLabel, mdHref, bareUrl] = match;
    const href = mdHref || bareUrl;
    const label = mdLabel || bareUrl;
    let finalHref = href;
    try {
      const u = new URL(href);
      if (typeof window !== "undefined" && u.host === window.location.host) {
        finalHref = u.pathname + u.search + u.hash;
      }
    } catch {
      /* keep raw */
    }
    out.push(
      <a
        key={key++}
        href={finalHref}
        className="underline underline-offset-2 hover:text-bh-orange"
      >
        {label}
      </a>
    );
    lastIndex = match.index + full.length;
  }
  if (lastIndex < content.length) {
    out.push(content.slice(lastIndex));
  }
  return out;
}

function loadHistory(): Message[] {
  if (typeof window === "undefined") return [greeting];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [greeting];
    const parsed = JSON.parse(raw) as Message[];
    if (!Array.isArray(parsed) || !parsed.length) return [greeting];
    return parsed;
  } catch {
    return [greeting];
  }
}

function saveHistory(messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    /* ignore */
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [hint, setHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate from sessionStorage after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate messages from sessionStorage after mount (client-only)
    setMessages(loadHistory());
  }, []);

  // Persist on change.
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Surface a one-time attention hint after 6s on first visit.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => {
      if (!open) setHint(true);
      sessionStorage.setItem(SEEN_KEY, "1");
    }, 6000);
    return () => clearTimeout(t);
  }, [open]);

  // Auto-scroll on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  // Focus input on open + ESC to close.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the attention hint when the widget opens
    setHint(false);
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: trimmed,
      // eslint-disable-next-line react-hooks/purity -- Date.now() runs inside the send() event handler, not during render
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = (await r.json()) as { text?: string; lead?: Record<string, string> };
      const replyText =
        data.text ||
        "Sorry, can you say that again? Or email services@buildhawk.com.au and we'll pick it up.";

      // Subtle 'typing' delay scaled to message length, capped.
      const delay = Math.min(2200, 600 + replyText.length * 12);
      await new Promise((res) => setTimeout(res, delay));

      const reply: Message = {
        id: uid(),
        role: "assistant",
        content: replyText,
        // eslint-disable-next-line react-hooks/purity -- Date.now() runs inside the send() event handler, not during render
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);

      if (data.lead && !leadCaptured) {
        setLeadCaptured(true);
        try {
          await fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data.lead,
              source: "Live chat widget",
              transcript: [...messages, userMsg, reply].map((m) => ({
                role: m.role,
                content: m.content,
              })),
            }),
          });
        } catch (err) {
          console.warn("[chat] lead send failed", err);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content:
            "Connection dropped. Try once more, or email services@buildhawk.com.au.",
          ts: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const showQuickReplies = useMemo(
    () => messages.length === 1 && messages[0].id === "greeting" && !busy,
    [messages, busy]
  );

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close live chat" : "Open live chat with BuildHawk support"}
        aria-expanded={open}
        className="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-[60] inline-flex items-center justify-center w-14 h-14 rounded-full bg-bh-ink text-bh-paper shadow-[0_12px_40px_-8px_rgba(17,17,17,0.4)] hover:bg-bh-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bh-orange focus-visible:ring-offset-2"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <path d="M5 5 L17 17 M17 5 L5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5v-3.5H6.5A2.5 2.5 0 0 1 4 14.5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="absolute -top-0.5 -right-0.5 inline-block w-3.5 h-3.5 rounded-full bg-bh-orange border-2 border-bh-ink bh-pulse"
              aria-hidden
            />
          </>
        )}
      </button>

      {/* Attention bubble (one-time hint) */}
      {hint && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[88px] right-4 md:right-5 z-[60] max-w-[260px] text-left px-4 py-3 rounded-2xl rounded-br-md bg-bh-ink text-bh-paper text-[13px] leading-snug tracking-[-0.005em] shadow-[0_12px_40px_-8px_rgba(17,17,17,0.4)] hover:bg-bh-orange transition-colors"
          aria-label="Open live chat"
        >
          Got a build in the pipeline? Drop your details and the team replies within one business day.
        </button>
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Live support chat"
        aria-hidden={!open}
        className={`fixed z-[60] inset-x-0 bottom-0 sm:inset-x-auto sm:right-5 sm:bottom-24 sm:w-[380px] h-[80svh] sm:h-[600px] sm:max-h-[80svh] sm:rounded-2xl bg-bh-paper text-bh-ink shadow-[0_24px_80px_-12px_rgba(17,17,17,0.45)] border border-bh-steel/40 overflow-hidden flex flex-col transition-[opacity,transform] duration-300 ease-out ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-bh-ink text-bh-paper px-5 py-4 flex items-start gap-3">
          <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-bh-orange/15 border border-bh-orange/40 flex-none overflow-hidden">
            <svg width="18" height="14" viewBox="0 0 255.21 195.97" aria-hidden>
              <path fill="#fff" d="M248.58,87.27c3.72-19.49-12.19-23.39-32.82-20.97-31.46,3.7-73.92,22.12-74.65,22.43,37.44-30.15,74.53-41.23,74.53-41.23l-.93-2.64c1.88-.17,3.67-.3,5.39-.39-.21-3.19-2.51-6.4-7.61-9.54-22.92-14.12-56.85-13.31-76.88-11.21L103.04,1.14s90.09.96,121.13,28.03c4.71,4.11,5.89,9.36,4.48,15.3,44.14,2.28,19.93,42.8,19.93,42.8Z"/>
              <path fill="#de5123" d="M134.06,71.73c-14.44,25.73-43.31,8.41-51.72,8.41-5.03,0-16.67-.35-25.2-.42v42.36s-17.12-11.93-28-33.1c-4.15-8.06-7.39-17.46-8.44-28.05-.23-2.38-.36-4.82-.36-7.32v-22.82s36.8-.17,36.8,0v31.35h18.6c31.67,0,34.27-40.89-5.24-40.89H26.01C14.28,21.24,0,11.73,0,0h74.84c31.85,0,48.24,11.12,54.11,24.53,8.4,19.16-4.71,42.99-24.9,45.68,0,0,9.89,7.42,30.01,1.52Z"/>
            </svg>
            <span
              className="absolute bottom-0 right-0 inline-block w-3 h-3 rounded-full bg-[#22c55e] border-2 border-bh-ink"
              aria-hidden
            />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] tracking-[-0.005em] font-medium leading-tight">
              BuildHawk · Estimate Intake
            </p>
            <p className="text-[11px] tracking-[0.04em] text-bh-paper/65 mt-0.5">
              Online · typically replies in seconds
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-bh-paper/70 hover:text-bh-paper hover:bg-bh-paper/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M4 4 L12 12 M12 4 L4 12"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-bh-cloud/40"
          aria-live="polite"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3.5 py-2.5 text-[14px] leading-[1.5] tracking-[-0.005em] whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-bh-orange text-bh-paper rounded-2xl rounded-br-md"
                    : "bg-bh-paper text-bh-ink border border-bh-steel/50 rounded-2xl rounded-bl-md"
                }`}
              >
                {m.role === "assistant" ? renderMessage(m.content) : m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start" aria-label="Estimate Intake is typing">
              <div className="px-3.5 py-3 bg-bh-paper border border-bh-steel/50 rounded-2xl rounded-bl-md inline-flex items-center gap-1.5">
                <span className="bh-typing-dot inline-block w-1.5 h-1.5 rounded-full bg-bh-graphite" />
                <span className="bh-typing-dot inline-block w-1.5 h-1.5 rounded-full bg-bh-graphite" style={{ animationDelay: "120ms" }} />
                <span className="bh-typing-dot inline-block w-1.5 h-1.5 rounded-full bg-bh-graphite" style={{ animationDelay: "240ms" }} />
              </div>
            </div>
          )}
          {showQuickReplies && (
            <div className="flex flex-wrap gap-2 pt-1">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="text-[12px] tracking-[-0.005em] h-8 px-3 rounded-full border border-bh-ink/15 text-bh-ink hover:bg-bh-ink hover:text-bh-paper transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          className="border-t border-bh-steel/50 bg-bh-paper p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Message Estimate Intake…"
              aria-label="Type a message"
              className="flex-1 resize-none max-h-32 min-h-[40px] bg-bh-cloud/60 text-bh-ink placeholder:text-bh-graphite/80 text-[14px] tracking-[-0.005em] leading-snug px-3 py-2.5 rounded-[10px] border border-bh-steel/60 focus:border-bh-orange focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] bg-bh-ink text-bh-paper hover:bg-bh-orange transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-none"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M3 8h10m0 0L9 4m4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-[10px] tracking-[0.04em] text-bh-graphite leading-snug">
            AI-assisted support · escalates to the BuildHawk team. By messaging,
            you accept our{" "}
            <a
              href="/data-policy"
              className="underline underline-offset-2 hover:text-bh-orange"
            >
              data policy
            </a>
            .
          </p>
        </form>
      </div>
    </>
  );
}
