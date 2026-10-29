import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Bot, Code2, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTutorPage } from "../../state/TutorPage";
import { useLessonProgress } from "../../state/LessonProgress";
import { useLineAuth } from "../../state/LineAuth";
import "./assistant-chat.css";

type ChatMessage = { role: "user" | "assistant"; text: string };
type PageContext = { kind: string; title: string; detail: string };

const apiOrigin = (import.meta.env.VITE_AI_API_URL ?? "").trim().replace(/\/+$/, "");
const suggestions = ["อธิบายเรื่องนี้แบบง่าย ๆ", "ขอคำใบ้ทีละขั้น", "ช่วยดูว่าควรเริ่มตรงไหน"];

function fallbackPage(pathname: string): PageContext {
  if (pathname === "/lessons") return { kind: "overview", title: "เส้นทางบทเรียน", detail: "ผู้เรียนกำลังดูรายการบทเรียน HTML" };
  if (pathname === "/code-lab") return { kind: "code-lab", title: "Code Lab", detail: "ผู้เรียนกำลังฝึกเขียน HTML" };
  if (pathname === "/workshop") return { kind: "workshop", title: "Workshop", detail: "ผู้เรียนกำลังสร้างเว็บไซต์แนะนำตัวเอง 3 หน้า" };
  if (pathname === "/progress") return { kind: "progress", title: "ความก้าวหน้าของฉัน", detail: "ผู้เรียนกำลังดูความก้าวหน้า" };
  return { kind: "home", title: "วิชา การสร้างเว็บไซต์", detail: "ผู้เรียนกำลังเรียน HTML เบื้องต้น" };
}

export function AssistantChat() {
  const { isDemo, getIdToken } = useLineAuth();
  const location = useLocation();
  const { page } = useTutorPage();
  const { isUnlocked } = useLessonProgress();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [includeCode, setIncludeCode] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const isAssessment = /^\/assessment(?:\/|$)/.test(location.pathname);
  const lessonId = /^\/lessons\/([^/]+)$/.exec(location.pathname)?.[1];
  const isLockedLesson = Boolean(lessonId && !isUnlocked(lessonId));
  const isHidden = isAssessment || isLockedLesson;
  const activePage: PageContext = page?.path === location.pathname
    ? { kind: page.kind, title: page.title, detail: page.detail }
    : fallbackPage(location.pathname);
  const canAttachCode = Boolean(page?.path === location.pathname && page.code);

  useEffect(() => {
    setIncludeCode(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isHidden) {
      abortRef.current?.abort();
      setOpen(false);
      setDraft("");
      setError("");
    }
  }, [isHidden]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [open, messages, sending]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const question = draft.trim();
    if (!question || sending || !apiOrigin || isHidden || isDemo) return;
    const history = messages.slice(-6);
    const controller = new AbortController();
    abortRef.current = controller;
    setMessages((current) => [...current, { role: "user", text: question }]);
    setDraft("");
    setError("");
    setSending(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("กรุณาเข้าสู่ระบบด้วย LINE อีกครั้ง");
      const response = await fetch(`${apiOrigin}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: question,
          history,
          page: activePage,
          ...(includeCode && canAttachCode ? { code: page?.code?.slice(0, 6000) } : {}),
        }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null) as { reply?: string; error?: string } | null;
      if (!response.ok || !result?.reply) throw new Error(result?.error || "ผู้ช่วยตอบกลับไม่ได้ในขณะนี้");
      setMessages((current) => [...current, { role: "assistant", text: result.reply! }]);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "เชื่อมต่อผู้ช่วยไม่ได้ กรุณาลองอีกครั้ง");
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setSending(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
    if (event.key === "Escape") setOpen(false);
  }

  if (isHidden) return null;

  return (
    <div className="assistant-chat">
      {open && (
        <section className="assistant-chat__panel" aria-label="แชทกับผู้ช่วย AI">
          <header className="assistant-chat__header">
            <span className="assistant-chat__avatar"><Bot size={23} aria-hidden="true" /></span>
            <div><strong>ผู้ช่วยการเรียนรู้</strong><small>ช่วยคิดทีละขั้น ไม่ทำงานแทน</small></div>
            <button type="button" className="assistant-chat__close" onClick={() => setOpen(false)} aria-label="ปิดแชท"><X size={19} /></button>
          </header>
          <div className="assistant-chat__context">กำลังช่วยในหน้า: <strong>{activePage.title}</strong></div>
          <div className="assistant-chat__messages" ref={scrollRef} role="log" aria-live="polite" aria-label="ข้อความสนทนา">
            <div className="assistant-chat__message assistant-chat__message--assistant">
              สวัสดี! ติดตรงไหนบอกได้เลย ฉันจะช่วยอธิบายและให้คำใบ้ทีละขั้น
            </div>
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`assistant-chat__message assistant-chat__message--${message.role}`}>
                {message.text}
              </div>
            ))}
            {sending && <div className="assistant-chat__message assistant-chat__message--assistant assistant-chat__loading"><LoaderCircle size={16} className="assistant-chat__spinner" /> กำลังคิดคำแนะนำ...</div>}
          </div>
          {messages.length === 0 && apiOrigin && <div className="assistant-chat__suggestions" aria-label="คำถามแนะนำ">
            {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setDraft(suggestion); inputRef.current?.focus(); }}>{suggestion}</button>)}
          </div>}
          {!apiOrigin && <p className="assistant-chat__notice" role="status">ช่องแชทพร้อมแล้ว แต่ยังไม่ได้เชื่อม API ของ Vercel จึงยังส่งข้อความไม่ได้</p>}
          {isDemo && apiOrigin && <p className="assistant-chat__notice" role="status">เปิดเว็บผ่าน LINE เพื่อใช้ผู้ช่วย AI</p>}
          {error && <p className="assistant-chat__error" role="alert">{error}</p>}
          <form className="assistant-chat__composer" onSubmit={(event) => void sendMessage(event)}>
            {canAttachCode && <label className="assistant-chat__code-optin">
              <input type="checkbox" checked={includeCode} onChange={(event) => setIncludeCode(event.target.checked)} />
              <Code2 size={15} aria-hidden="true" /> แนบโค้ดปัจจุบันเพื่อขอคำแนะนำ
            </label>}
            <div className="assistant-chat__input-row">
              <textarea ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} placeholder="พิมพ์คำถามของคุณ..." rows={2} maxLength={1000} aria-label="พิมพ์คำถามถึงผู้ช่วย AI" disabled={!apiOrigin || sending || isDemo} />
              <button type="submit" disabled={!apiOrigin || sending || isDemo || !draft.trim()} aria-label="ส่งข้อความ"><Send size={19} /></button>
            </div>
            <small>Enter เพื่อส่ง · Shift+Enter ขึ้นบรรทัดใหม่</small>
            <small>คำถามจะส่งไปยัง Gemini ส่วนโค้ดจะส่งเมื่อเลือกแนบเท่านั้น</small>
          </form>
        </section>
      )}
      <button type="button" className="assistant-chat__launcher" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "ปิดผู้ช่วย AI" : "เปิดแชทผู้ช่วย AI"}>
        {open ? <X size={23} aria-hidden="true" /> : <MessageCircle size={23} aria-hidden="true" />}
        <span>{open ? "ปิดแชท" : "ถามผู้ช่วย AI"}</span>
      </button>
    </div>
  );
}
