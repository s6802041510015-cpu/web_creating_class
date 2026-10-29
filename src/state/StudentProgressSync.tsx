import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Cloud, CloudOff, LoaderCircle, RefreshCw } from "lucide-react";
import { useLineAuth } from "./LineAuth";
import { hasProgress, hydrateProgress, importLegacyStorage, mergeProgress, readLegacySnapshot, readProgressSnapshot } from "./ProgressData";
import type { ProgressSnapshot } from "./ProgressData";
import { assessmentStorageKey, clearStudentMeta, getStudentMeta, lessonStorageKey, progressChangedEvent, removeStudentItem, setStudentMeta, setStudentNamespace } from "./StudentStorage";
import { codeLabStorageKey, workshopStorageKey } from "./StudentWork";
import "../styles/student-sync.css";

type SyncStatus = "demo" | "syncing" | "synced" | "offline";
const SyncContext = createContext<{ status: SyncStatus; retry: () => void }>({ status: "demo", retry: () => {} });
const apiOrigin = (import.meta.env.VITE_AI_API_URL ?? "").trim().replace(/\/+$/, "");
const syncEnabled = import.meta.env.VITE_PROGRESS_SYNC_ENABLED === "true";

export function useStudentSync() { return useContext(SyncContext); }

export function StudentProgressSync({ children }: { children: ReactNode }) {
  const { user, isDemo, getIdToken } = useLineAuth();
  const [phase, setPhase] = useState<"loading" | "consent" | "error" | "ready">("loading");
  const [status, setStatus] = useState<SyncStatus>(isDemo || !syncEnabled ? "demo" : "syncing");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const lastSynced = useRef("");
  const saving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consented = useRef(false);

  const request = useCallback(async (method: "GET" | "PUT", progress?: ProgressSnapshot) => {
    const token = await getIdToken();
    if (!token) throw new Error("กรุณาเปิดเว็บผ่าน LINE แล้วเข้าสู่ระบบอีกครั้ง");
    if (!apiOrigin) throw new Error("ยังไม่ได้ตั้งค่า URL ของ API");
    const response = await fetch(`${apiOrigin}/api/progress`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(progress ? { "Content-Type": "application/json" } : {}) },
      ...(progress ? { body: JSON.stringify(progress) } : {}),
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json().catch(() => null) as { progress?: ProgressSnapshot | null; error?: string } | null;
    if (!response.ok) throw new Error(result?.error || "เชื่อมต่อข้อมูลความก้าวหน้าไม่ได้");
    return result?.progress ?? null;
  }, [getIdToken]);

  const flush = useCallback(async () => {
    if (!user || !consented.current || saving.current) return;
    const snapshot = readProgressSnapshot();
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSynced.current) { clearStudentMeta("pending"); return; }
    saving.current = true;
    setStatus("syncing");
    let succeeded = false;
    try {
      const saved = await request("PUT", snapshot);
      lastSynced.current = JSON.stringify(saved ?? snapshot);
      if (JSON.stringify(readProgressSnapshot()) === serialized) clearStudentMeta("pending");
      setStatus("synced");
      setError("");
      succeeded = true;
    } catch (cause) {
      setStatus("offline");
      setError(cause instanceof Error ? cause.message : "ซิงก์ข้อมูลไม่สำเร็จ");
    } finally {
      saving.current = false;
      if (succeeded && JSON.stringify(readProgressSnapshot()) !== lastSynced.current && !timer.current) {
        timer.current = setTimeout(() => { timer.current = null; void flush(); }, 3000);
      }
    }
  }, [request, user]);

  useEffect(() => {
    let cancelled = false;
    if (isDemo || !syncEnabled) {
      void setStudentNamespace(null).then(() => { if (!cancelled) { setStatus("demo"); setPhase("ready"); } });
      return () => { cancelled = true; };
    }
    if (!user) return;
    setPhase("loading");
    setStatus("syncing");
    setError("");
    void (async () => {
      try {
        await setStudentNamespace(user.userId);
        const remote = await request("GET");
        if (cancelled) return;
        if (!remote) { setPhase("consent"); return; }
        consented.current = true;
        let current = remote;
        if (getStudentMeta("pending") === "1") {
          current = mergeProgress(remote, readProgressSnapshot());
          await request("PUT", current);
          clearStudentMeta("pending");
        }
        if (cancelled) return;
        hydrateProgress(current);
        lastSynced.current = JSON.stringify(current);
        setStatus("synced");
        setPhase("ready");
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "โหลดข้อมูลความก้าวหน้าไม่ได้");
        setStatus("offline");
        setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, [user?.userId, isDemo, attempt, request]);

  useEffect(() => {
    if (phase !== "ready" || isDemo || !syncEnabled || !consented.current) return;
    const changed = () => {
      if (JSON.stringify(readProgressSnapshot()) === lastSynced.current) return;
      setStudentMeta("pending", "1");
      setStatus("syncing");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { timer.current = null; void flush(); }, 3000);
    };
    window.addEventListener(progressChangedEvent, changed);
    return () => { window.removeEventListener(progressChangedEvent, changed); if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [phase, isDemo, flush]);

  async function begin(importLocal: boolean) {
    if (importLocal) {
      if (!hasProgress(readProgressSnapshot())) importLegacyStorage();
    } else {
      for (const key of [assessmentStorageKey, lessonStorageKey, codeLabStorageKey, workshopStorageKey]) removeStudentItem(key);
      hydrateProgress({ version: 1, completedLessons: [], assessments: { pre: null, post: null }, codeLabCompleted: [], workshopChecked: [] });
    }
    const snapshot = readProgressSnapshot();
    setPhase("loading");
    try {
      const saved = await request("PUT", snapshot);
      consented.current = true;
      lastSynced.current = JSON.stringify(saved ?? snapshot);
      clearStudentMeta("pending");
      setStatus("synced");
      setPhase("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "บันทึกข้อมูลครั้งแรกไม่สำเร็จ");
      setStatus("offline");
      setPhase("error");
    }
  }

  const hasLocal = phase === "consent" && (hasProgress(readProgressSnapshot()) || hasProgress(readLegacySnapshot()));
  if (phase !== "ready") return (
    <main className="student-sync-gate">
      <section className="student-sync-gate__card" aria-live="polite">
        <Cloud size={34} aria-hidden="true" />
        <h1>{phase === "consent" ? "บันทึกการเรียนกับบัญชี LINE" : phase === "error" ? "เชื่อมข้อมูลการเรียนไม่ได้" : "กำลังโหลดข้อมูลการเรียน"}</h1>
        {phase === "loading" && <p><LoaderCircle className="student-sync-spin" size={19} /> กรุณารอสักครู่...</p>}
        {phase === "consent" && <>
          <p>หากยอมรับ ระบบจะบันทึกชื่อ LINE บทเรียนที่เรียนจบ ผลแบบทดสอบ และสถานะ Code Lab กับ Workshop ลง Google Sheet ที่ครูดูได้ โค้ดที่กำลังเขียนจะอยู่ในอุปกรณ์นี้</p>
          {hasLocal && <button type="button" className="button button--primary" onClick={() => void begin(true)}>ยอมรับและนำข้อมูลเดิมในเครื่องนี้เข้า</button>}
          <button type="button" className="button button--primary" onClick={() => void begin(false)}>ยอมรับและเริ่มใหม่</button>
          <button type="button" className="button button--secondary" onClick={() => { setStatus("offline"); setPhase("ready"); }}>เรียนโดยบันทึกในเครื่องนี้เท่านั้น</button>
        </>}
        {phase === "error" && <>
          <p role="alert">{error}</p>
          <button type="button" className="button button--primary" onClick={() => setAttempt((value) => value + 1)}><RefreshCw size={17} /> ลองอีกครั้ง</button>
          <button type="button" className="button button--secondary" onClick={() => { setStatus("offline"); setPhase("ready"); }}>เรียนโดยบันทึกในเครื่องนี้ชั่วคราว</button>
        </>}
      </section>
    </main>
  );

  return <SyncContext.Provider value={{ status, retry: () => { if (consented.current) void flush(); else setAttempt((value) => value + 1); } }}>
    {children}
    {status === "offline" && <div className="student-sync-alert" role="status"><CloudOff size={17} /> {error || "ข้อมูลบันทึกในเครื่องนี้ ยังไม่ซิงก์ Google Sheets"} <button type="button" onClick={() => { if (consented.current) void flush(); else setAttempt((value) => value + 1); }}>ลองอีกครั้ง</button></div>}
  </SyncContext.Provider>;
}
