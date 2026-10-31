import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type liff from "@line/liff";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  ClipboardList, Clock3, FileText, HeartPulse, Info, LoaderCircle,
  MessageCircle, RefreshCw, Send, ShieldCheck, Sparkles, UserRound, XCircle,
} from "lucide-react";

type Profile = { studentId: string; fullName: string; number: string; className: string };
type LeaveRequest = Profile & {
  id: string; type: string; startDate: string; endDate: string; period: string;
  startTime: string; endTime: string;
  reason: string; status: string; submittedAt: string; reviewedAt: string;
  reviewer: string; teacherReason: string;
};
type View = "home" | "form" | "history";
type AuthState = "loading" | "login" | "ready" | "demo" | "error";
type FormData = { type: string; startDate: string; endDate: string; period: string;
  startTime: string; endTime: string; reason: string };

const liffId = (import.meta.env.VITE_LEAVE_LIFF_ID ?? "").trim();
const apiOrigin = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");
const emptyProfile: Profile = { studentId: "", fullName: "", number: "", className: "" };
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const initialForm: FormData = { type: "sick", startDate: today, endDate: today, period: "full",
  startTime: "", endTime: "", reason: "" };
const typeLabel: Record<string, string> = { sick: "ลาป่วย", personal: "ลากิจ", other: "อื่น ๆ" };
const periodLabel: Record<string, string> = { full: "เต็มวัน", morning: "ช่วงเช้า", afternoon: "ช่วงบ่าย", custom: "ระบุเวลาเอง" };
function periodText(value: { period: string; startTime: string; endTime: string }) {
  return value.period === "custom" && value.startTime && value.endTime
    ? `${value.startTime}–${value.endTime} น.` : periodLabel[value.period] ?? "เต็มวัน";
}
const statusLabel: Record<string, string> = { pending: "รอพิจารณา", approved: "อนุมัติแล้ว", rejected: "ไม่อนุมัติ" };
let liffInit: Promise<typeof liff> | null = null;

function initializeLiff() {
  if (!liffInit) liffInit = import("@line/liff").then(async ({ default: sdk }) => {
    await sdk.init({ liffId });
    return sdk;
  }).catch((error: unknown) => { liffInit = null; throw error; });
  return liffInit;
}

function dateThai(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
  }).format(date);
}

function dateTimeThai(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function StatusIcon({ status }: { status: string }) {
  return status === "approved" ? <CheckCircle2 size={19} /> :
    status === "rejected" ? <XCircle size={19} /> : <Clock3 size={19} />;
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [auth, setAuth] = useState<AuthState>(liffId ? "loading" : "demo");
  const [displayName, setDisplayName] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [form, setForm] = useState<FormData>(initialForm);
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retry, setRetry] = useState(0);
  const pendingKey = useRef("");
  const idToken = useRef("");

  const currentIdToken = useCallback(async () => {
    const sdk = await initializeLiff();
    const token = sdk.getIDToken() || idToken.current;
    if (!token) throw new Error("เซสชัน LINE ไม่พร้อม กรุณาเปิดหน้าแจ้งลาจาก Rich Menu อีกครั้ง");
    idToken.current = token;
    return token;
  }, []);

  const load = useCallback(async (token: string, signal?: AbortSignal) => {
    if (!apiOrigin) throw new Error("ยังไม่ได้ตั้งค่า URL ของ API");
    const response = await fetch(`${apiOrigin}/api/leave`, {
      headers: { Authorization: `Bearer ${token}` }, signal: signal ?? AbortSignal.timeout(20000),
    });
    const result = await response.json().catch(() => null) as {
      user?: { displayName: string }; profile?: Profile | null;
      requests?: LeaveRequest[]; error?: string;
    } | null;
    if (!response.ok) throw new Error(result?.error || "โหลดข้อมูลการลาไม่ได้");
    setDisplayName(result?.user?.displayName ?? "");
    setRequests(result?.requests ?? []);
    setSavedProfile(Boolean(result?.profile));
    setProfile(result?.profile ?? emptyProfile);
  }, []);

  useEffect(() => {
    if (!liffId) return;
    const controller = new AbortController();
    setAuth("loading");
    setError("");
    void (async () => {
      try {
        const sdk = await initializeLiff();
        if (controller.signal.aborted) return;
        if (!sdk.isLoggedIn()) {
          if (sdk.isInClient()) throw new Error("กรุณาปิดหน้านี้และเปิดจาก Rich Menu อีกครั้ง");
          setAuth("login");
          return;
        }
        const token = sdk.getIDToken();
        if (!token) throw new Error("LIFF ไม่ได้รับสิทธิ์ openid กรุณาตรวจการตั้งค่า");
        await load(token, controller.signal);
        if (controller.signal.aborted) return;
        idToken.current = token;
        setAuth("ready");
        void sdk.getProfile().then((data) => {
          if (!controller.signal.aborted && data.pictureUrl) setPictureUrl(data.pictureUrl);
        }).catch(() => {});
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "เชื่อมต่อ LINE ไม่สำเร็จ");
        setAuth("error");
      }
    })();
    return () => controller.abort();
  }, [load, retry]);

  async function refresh() {
    if (auth !== "ready") return;
    setBusy(true);
    setError("");
    try {
      const token = await currentIdToken();
      await load(token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "รีเฟรชข้อมูลไม่ได้");
    } finally { setBusy(false); }
  }

  function updateForm<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "startDate" && next.endDate < value) next.endDate = value;
      if (next.startDate !== next.endDate) next.period = "full";
      if (next.period !== "custom") { next.startTime = ""; next.endTime = ""; }
      return next;
    });
    setReviewing(false);
    pendingKey.current = "";
  }

  function checkForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (form.endDate < form.startDate || (form.period !== "full" && form.startDate !== form.endDate)) {
      setError("กรุณาตรวจวันที่และช่วงเวลาที่ลา");
      return;
    }
    if (form.period === "custom" && (!form.startTime || !form.endTime || form.startTime >= form.endTime)) {
      setError("กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด โดยเวลาสิ้นสุดต้องหลังเวลาเริ่ม");
      return;
    }
    if (form.reason.trim().length < 5) {
      setError("กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร");
      return;
    }
    setReviewing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (busy || auth !== "ready") return;
    setBusy(true);
    setError("");
    try {
      const token = await currentIdToken();
      if (!pendingKey.current) pendingKey.current = crypto.randomUUID();
      const response = await fetch(`${apiOrigin}/api/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, reason: form.reason.trim(), profile, requestKey: pendingKey.current }),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json().catch(() => null) as {
        request?: LeaveRequest; notificationRequested?: boolean; error?: string;
      } | null;
      if (response.status === 401) {
        idToken.current = "";
        throw new Error("เซสชัน LINE หมดอายุ กรุณาเปิดหน้าแจ้งลาจาก Rich Menu อีกครั้ง");
      }
      if (!response.ok || !result?.request) throw new Error(result?.error || "ส่งคำขอลาไม่สำเร็จ");
      pendingKey.current = "";
      await load(token);
      setForm(initialForm);
      setReviewing(false);
      setSuccess(result.notificationRequested
        ? "บันทึกคำขอแล้ว และระบบขอส่งข้อความรับเรื่องผ่าน LINE OA แล้ว"
        : "บันทึกคำขอแล้ว ดูสถานะได้ในประวัติการลา");
      setView("history");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ส่งคำขอลาไม่สำเร็จ");
    } finally { setBusy(false); }
  }

  const pendingCount = requests.filter((item) => item.status === "pending").length;
  const latest = requests[0];
  const profileComplete = Boolean(profile.studentId && profile.fullName && profile.number && profile.className);

  return (
    <div className="leave-app">
      <header className="site-header">
        <div className="header-inner">
          <button className="wordmark" type="button" onClick={() => { setView("home"); setError(""); }}>
            <span className="wordmark-icon"><FileText size={24} strokeWidth={2.3} /></span>
            <span><strong>WEBHTML <em>LEAVE</em></strong><small>ระบบแจ้งลาเรียน</small></span>
          </button>
          <span className="header-tag"><span className="header-tag-dot" /> เว็บลาเรียนสำหรับนักเรียน</span>
        </div>
      </header>

      <main className="page-container">
        {(auth === "loading" || auth === "login" || auth === "error") && (
          <section className="auth-card">
            <div className="auth-mark"><MessageCircle size={32} /></div>
            <span className="eyebrow">เชื่อมต่อ LINE</span>
            <h1>{auth === "loading" ? "กำลังเตรียมข้อมูลของคุณ" : "เข้าเว็บลาเรียนด้วย LINE"}</h1>
            <p>ใช้บัญชี LINE เพื่อระบุตัวตนและติดตามคำขอของคุณ</p>
            {auth === "loading" && <LoaderCircle className="spin" size={28} />}
            {auth === "login" && <button className="primary-button" type="button" onClick={() => {
              void initializeLiff().then((sdk) => sdk.login({ redirectUri: window.location.href }))
                .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "เปิด LINE Login ไม่สำเร็จ"));
            }}>เข้าสู่ระบบด้วย LINE <ArrowRight size={18} /></button>}
            {auth === "error" && <button className="primary-button" type="button" onClick={() => setRetry((value) => value + 1)}>
              ลองอีกครั้ง <RefreshCw size={18} /></button>}
            {error && auth !== "loading" && <p className="error-banner" role="alert">{error}</p>}
          </section>
        )}

        {(auth === "ready" || auth === "demo") && <>
          {auth === "demo" && <div className="demo-banner"><Info size={18} /> โหมดตัวอย่าง · ตั้งค่า LIFF ID และ API ก่อนส่งคำขอจริง</div>}
          <div className="topline"><span>บริการนักเรียน <ChevronRight size={14} /> ระบบแจ้งลาเรียน</span><span>WEBHTML CLASS</span></div>
          {view === "home" && <>
            <section className="hero">
              <div className="hero-copy">
                <span className="hero-kicker"><Sparkles size={16} /> ทุกคำขอ ติดตามได้</span>
                <h1>ลาเรียนได้ง่าย<br /><span>รู้ผลได้ชัดเจน</span></h1>
                <p>ส่งคำขอจากที่นี่ แล้วติดตามผลจากครูได้ทั้งในเว็บและข้อความ LINE OA</p>
                <button className="hero-button" type="button" onClick={() => { setView("form"); setSuccess(""); }}>
                  เริ่มแจ้งลา <ArrowRight size={20} />
                </button>
                <div className="hero-note"><ShieldCheck size={17} /> ข้อมูลของคุณแสดงเฉพาะบัญชีที่เข้าสู่ระบบ</div>
              </div>
              <div className="hero-visual" aria-hidden="true">
                <div className="visual-orbit visual-orbit--one" />
                <div className="visual-orbit visual-orbit--two" />
                <div className="visual-document">
                  <span className="doc-pill">LEAVE REQUEST</span>
                  <span className="doc-line doc-line--wide" /><span className="doc-line" />
                  <span className="doc-divider" />
                  <span className="doc-row"><span /> <i /></span>
                  <span className="doc-row"><span /> <i /></span>
                  <span className="doc-row"><span /> <i /></span>
                  <span className="doc-confirm"><Check size={25} /></span>
                </div>
                <div className="floating-note"><CalendarDays size={18} /> ส่งคำขอได้ทุกเวลา</div>
              </div>
            </section>
            <section className="home-grid">
              <div className="welcome-card">
                <span className="eyebrow">ยินดีต้อนรับ</span>
                <div className="welcome-person">
                  <span className="avatar">{pictureUrl ? <img src={pictureUrl} alt="" referrerPolicy="no-referrer" /> : <UserRound size={26} />}</span>
                  <div><h2>{profile.fullName || displayName || "นักเรียน"}</h2><p>{profile.className || "กรอกข้อมูลเมื่อส่งคำขอครั้งแรก"}{profile.number ? ` · เลขที่ ${profile.number}` : ""}</p></div>
                </div>
                <div className="welcome-stats"><span><strong>{requests.length}</strong> คำขอทั้งหมด</span><span><strong>{pendingCount}</strong> รอพิจารณา</span></div>
              </div>
              <button className="action-card" type="button" onClick={() => setView("form")}>
                <span className="action-icon action-icon--blue"><FileText size={23} /></span>
                <strong>แจ้งลาเรียน</strong><small>กรอกแบบฟอร์มและส่งคำขอ</small><ArrowRight className="action-arrow" size={19} />
              </button>
              <button className="action-card" type="button" onClick={() => setView("history")}>
                <span className="action-icon action-icon--peach"><ClipboardList size={23} /></span>
                <strong>ประวัติการลา</strong><small>ดูคำขอและผลการพิจารณา</small><ArrowRight className="action-arrow" size={19} />
              </button>
            </section>
            <section className="latest-section">
              <div className="section-heading"><div><span className="eyebrow">อัปเดตล่าสุด</span><h2>คำขอของฉัน</h2></div>
                <button type="button" onClick={() => setView("history")}>ดูทั้งหมด <ArrowRight size={16} /></button></div>
              {latest ? <RequestCard request={latest} compact /> :
                <div className="empty-state"><span><FileText size={24} /></span><strong>ยังไม่มีคำขอลา</strong><p>เมื่อส่งคำขอครั้งแรก รายการจะปรากฏที่นี่</p></div>}
            </section>
          </>}

          {view === "form" && <section className="inner-page">
            <button className="back-button" type="button" onClick={() => reviewing ? setReviewing(false) : setView("home")}><ArrowLeft size={17} /> {reviewing ? "กลับไปแก้ไข" : "กลับหน้าหลัก"}</button>
            <div className="page-heading"><span className="eyebrow">แบบฟอร์มออนไลน์</span><h1>{reviewing ? "ตรวจสอบคำขอก่อนส่ง" : "แจ้งลาเรียน"}</h1>
              <p>{reviewing ? "โปรดตรวจรายละเอียดให้ถูกต้องก่อนยืนยัน" : "กรอกข้อมูลให้ครบเพื่อให้ครูพิจารณาคำขอของคุณ"}</p></div>
            {success && <p className="success-banner"><CheckCircle2 size={18} /> {success}</p>}
            {error && <p className="error-banner" role="alert">{error}</p>}
            {reviewing ? <div className="form-card review-card">
              <div className="form-section-title"><span>01</span><div><h2>ข้อมูลนักเรียน</h2><p>ระบุตัวตนตามบัญชี LINE</p></div></div>
              <div className="review-grid"><Detail label="รหัสนักเรียน" value={profile.studentId} /><Detail label="ชื่อ-นามสกุล" value={profile.fullName} /><Detail label="เลขที่" value={profile.number} /><Detail label="ห้องเรียน" value={profile.className} /></div>
              <div className="divider" />
              <div className="form-section-title"><span>02</span><div><h2>รายละเอียดการลา</h2><p>ข้อมูลที่จะส่งให้ครู</p></div></div>
              <div className="review-grid"><Detail label="ประเภท" value={typeLabel[form.type]} /><Detail label="วันที่ลา" value={form.startDate === form.endDate ? dateThai(form.startDate) : `${dateThai(form.startDate)} – ${dateThai(form.endDate)}`} /><Detail label="ช่วงเวลา" value={periodText(form)} /><Detail label="เหตุผล" value={form.reason} /></div>
              <div className="form-footer"><button className="secondary-button" type="button" onClick={() => setReviewing(false)}>แก้ไขข้อมูล</button>
                <button className="primary-button" type="button" onClick={() => void submit()} disabled={busy || auth === "demo"}>
                  {busy ? "กำลังส่งคำขอ..." : "ยืนยันส่งคำขอ"} <Send size={17} /></button></div>
              {auth === "demo" && <p className="form-hint">ต้องตั้งค่า LINE LIFF ก่อนส่งคำขอจริง</p>}
            </div> : <form className="form-card" onSubmit={checkForm}>
              <div className="form-section-title"><span>01</span><div><h2>ข้อมูลนักเรียน</h2><p>{savedProfile ? "ข้อมูลจากการลงทะเบียนด้วย LINE" : "กรอกครั้งแรก แล้วระบบจะจดจำให้"}</p></div></div>
              <div className="field-grid">
                <label>รหัสนักเรียน <em>*</em><input value={profile.studentId} onChange={(e) => setProfile({ ...profile, studentId: e.target.value })} disabled={savedProfile} inputMode="numeric" pattern="[0-9]{5,20}" required placeholder="รหัสนักเรียน" /></label>
                <label>ชื่อ-นามสกุล <em>*</em><input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} disabled={savedProfile} maxLength={100} required placeholder="ชื่อและนามสกุล" /></label>
                <label>เลขที่ <em>*</em><input value={profile.number} onChange={(e) => setProfile({ ...profile, number: e.target.value })} disabled={savedProfile} inputMode="numeric" pattern="[0-9]{1,3}" required placeholder="เลขที่" /></label>
                <label>ชั้น / ห้อง <em>*</em><input value={profile.className} onChange={(e) => setProfile({ ...profile, className: e.target.value })} disabled={savedProfile} maxLength={50} required placeholder="เช่น ปวช.1/1" /></label>
              </div>
              <div className="divider" />
              <div className="form-section-title"><span>02</span><div><h2>รายละเอียดการลา</h2><p>เลือกวันและอธิบายเหตุผล</p></div></div>
              <div className="form-fields">
                <label>ประเภทการลา <em>*</em><select value={form.type} onChange={(e) => updateForm("type", e.target.value)}>
                  <option value="sick">ลาป่วย</option><option value="personal">ลากิจ</option><option value="other">อื่น ๆ</option>
                </select></label>
                <div className="field-grid"><label>วันที่เริ่ม <em>*</em><input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} required /></label>
                  <label>วันที่สิ้นสุด <em>*</em><input type="date" min={form.startDate} value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} required /></label></div>
                <fieldset><legend>ช่วงเวลา <em>*</em></legend><div className="period-options">
                  {(["full", "morning", "afternoon", "custom"] as const).map((period) => <label key={period} className={form.period === period ? "selected" : ""}>
                    <input type="radio" name="period" value={period} checked={form.period === period} disabled={period !== "full" && form.startDate !== form.endDate} onChange={() => updateForm("period", period)} />{periodLabel[period]}
                  </label>)}</div>
                  {form.period === "custom" && <div className="field-grid custom-time-fields">
                    <label>เวลาเริ่ม <em>*</em><input type="time" value={form.startTime} onChange={(e) => updateForm("startTime", e.target.value)} required /></label>
                    <label>เวลาสิ้นสุด <em>*</em><input type="time" value={form.endTime} onChange={(e) => updateForm("endTime", e.target.value)} required /></label>
                  </div>}
                  {form.startDate !== form.endDate && <small>การระบุเวลาใช้ได้เฉพาะการลาในวันเดียว</small>}
                </fieldset>
                <label>เหตุผลในการลา <em>*</em><textarea value={form.reason} onChange={(e) => updateForm("reason", e.target.value)} required minLength={5} maxLength={1000} rows={4} placeholder="อธิบายเหตุผลให้ครูทราบโดยสรุป" /><small>แสดงให้ครูผู้ดูแลคำขอลาเท่านั้น</small></label>
              </div>
              <div className="form-footer"><span><ShieldCheck size={18} /> ส่งข้อมูลผ่านระบบที่ตรวจสอบบัญชี LINE</span>
                <button className="primary-button" type="submit" disabled={!profileComplete}>ตรวจสอบข้อมูล <ArrowRight size={18} /></button></div>
            </form>}
          </section>}

          {view === "history" && <section className="inner-page">
            <button className="back-button" type="button" onClick={() => setView("home")}><ArrowLeft size={17} /> กลับหน้าหลัก</button>
            <div className="page-heading page-heading--row"><div><span className="eyebrow">ติดตามสถานะ</span><h1>ประวัติการลา</h1><p>คำขอทั้งหมดของคุณ รวมถึงเหตุผลที่ครูตอบกลับ</p></div>
              <button className="secondary-button" type="button" onClick={() => void refresh()} disabled={busy}><RefreshCw size={17} /> รีเฟรช</button></div>
            {success && <p className="success-banner"><CheckCircle2 size={18} /> {success}</p>}
            {error && <p className="error-banner" role="alert">{error}</p>}
            <div className="history-list">
              {requests.length ? requests.map((item) => <RequestCard key={item.id} request={item} />) :
                <div className="empty-state"><span><ClipboardList size={26} /></span><strong>ยังไม่มีประวัติการลา</strong><p>เริ่มส่งคำขอได้จากหน้าแจ้งลาเรียน</p>
                  <button className="primary-button" type="button" onClick={() => setView("form")}>แจ้งลาเรียน <ArrowRight size={17} /></button></div>}
            </div>
          </section>}
        </>}
      </main>

      {(auth === "ready" || auth === "demo") && <nav className="bottom-nav" aria-label="เมนูหลัก">
        <button type="button" className={view === "home" ? "active" : ""} onClick={() => setView("home")}><Sparkles size={20} /> หน้าหลัก</button>
        <button type="button" className={view === "form" ? "active" : ""} onClick={() => { setView("form"); setReviewing(false); }}><FileText size={20} /> แจ้งลา</button>
        <button type="button" className={view === "history" ? "active" : ""} onClick={() => setView("history")}><ClipboardList size={20} /> ประวัติ</button>
      </nav>}
      <footer className="site-footer"><HeartPulse size={16} /> WEBHTML LEAVE · ดูแลทุกคำขออย่างใส่ใจ</footer>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail"><span>{label}</span><strong>{value || "—"}</strong></div>;
}

function RequestCard({ request, compact = false }: { request: LeaveRequest; compact?: boolean }) {
  return <article className={`request-card request-card--${request.status}`}>
    <div className="request-main"><span className="request-symbol">{request.type === "sick" ? <HeartPulse size={21} /> : <CalendarDays size={21} />}</span>
      <div><strong>{typeLabel[request.type] ?? "ลาเรียน"}</strong><small>{dateThai(request.startDate)}{request.endDate !== request.startDate ? ` – ${dateThai(request.endDate)}` : ""} · {periodText(request)}</small></div>
      <span className={`status-pill status-pill--${request.status}`}><StatusIcon status={request.status} /> {statusLabel[request.status] ?? request.status}</span></div>
    {!compact && <div className="request-detail"><p>{request.reason}</p>
      {request.teacherReason && <div className="teacher-note"><MessageCircle size={18} /><span><strong>คำชี้แจงจากครู</strong>{request.teacherReason}</span></div>}
      <span>ส่งเมื่อ {dateTimeThai(request.submittedAt)}{request.reviewedAt ? ` · พิจารณาเมื่อ ${dateTimeThai(request.reviewedAt)}` : ""}</span></div>}
  </article>;
}
