import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays, CheckCircle2, Clock3, ExternalLink, FileSpreadsheet,
  RefreshCw, Search, XCircle,
} from "lucide-react";
import "./teacher-leaves.css";

type LeaveRequest = {
  id: string; userId: string; studentId: string; fullName: string; number: string;
  className: string; type: string; startDate: string; endDate: string;
  period: string; startTime: string; endTime: string; reason: string; status: string; submittedAt: string;
  reviewedAt: string; reviewer: string; teacherReason: string;
};
type Decision = { id: string; status: "approved" | "rejected"; reason: string };
const typeLabels: Record<string, string> = { sick: "ลาป่วย", personal: "ลากิจ", other: "อื่น ๆ" };
const periodLabels: Record<string, string> = { full: "เต็มวัน", morning: "ช่วงเช้า", afternoon: "ช่วงบ่าย", custom: "ระบุเวลาเอง" };
function periodText(item: LeaveRequest) {
  return item.period === "custom" && item.startTime && item.endTime
    ? `${item.startTime}–${item.endTime} น.` : periodLabels[item.period] ?? "เต็มวัน";
}
const apiOrigin = (import.meta.env.VITE_AI_API_URL ?? "").trim().replace(/\/+$/, "");
function dateThai(value: string) {
  const date = new Date(`${value}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
  }).format(date);
}
function timeThai(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

export function TeacherLeaves({ token, onAuthExpired }: { token: string; onAuthExpired: () => void }) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("pending");
  const [className, setClassName] = useState("all");
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${apiOrigin}/api/teacher/leaves`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json().catch(() => null) as {
        requests?: LeaveRequest[]; sheetUrl?: string; error?: string;
      } | null;
      if (response.status === 401) onAuthExpired();
      if (!response.ok) throw new Error(data?.error || "โหลดคำขอลาไม่ได้");
      setRequests(data?.requests ?? []);
      setSheetUrl(data?.sheetUrl ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "โหลดคำขอลาไม่ได้");
    } finally { setBusy(false); }
  }, [token, onAuthExpired]);

  useEffect(() => { void load(); }, [load]);

  const classes = useMemo(() => [...new Set(requests.map((item) => item.className).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "th")), [requests]);
  const visible = useMemo(() => requests.filter((item) => {
    const matchesStatus = status === "all" || item.status === status;
    const matchesClass = className === "all" || item.className === className;
    const text = `${item.fullName} ${item.studentId} ${item.className} ${item.reason}`.toLocaleLowerCase("th");
    return matchesStatus && matchesClass && text.includes(query.trim().toLocaleLowerCase("th"));
  }), [requests, status, className, query]);

  async function submitDecision() {
    if (!decision || busy) return;
    if (decision.status === "rejected" && decision.reason.trim().length < 3) {
      setError("กรุณาระบุเหตุผลที่ไม่อนุมัติอย่างน้อย 3 ตัวอักษร");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiOrigin}/api/teacher/leaves`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: decision.id, status: decision.status, teacherReason: decision.reason.trim() }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json().catch(() => null) as {
        request?: LeaveRequest; notificationRequested?: boolean; error?: string;
      } | null;
      if (response.status === 401) onAuthExpired();
      if (!response.ok || !data?.request) throw new Error(data?.error || "บันทึกผลไม่ได้");
      setRequests((current) => current.map((item) => item.id === data.request?.id ? data.request : item));
      setNotice(data.notificationRequested
        ? "บันทึกผลและขอส่งข้อความแจ้งนักเรียนผ่าน LINE OA แล้ว"
        : "บันทึกผลแล้ว นักเรียนดูผลได้ในเว็บลาเรียน");
      setDecision(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "บันทึกผลไม่ได้");
    } finally { setBusy(false); }
  }

  return <section className="teacher-leaves">
    <div className="teacher-leaves__summary">
      <div><Clock3 /><span>รอพิจารณา</span><strong>{requests.filter((item) => item.status === "pending").length}</strong></div>
      <div><CheckCircle2 /><span>อนุมัติ</span><strong>{requests.filter((item) => item.status === "approved").length}</strong></div>
      <div><XCircle /><span>ไม่อนุมัติ</span><strong>{requests.filter((item) => item.status === "rejected").length}</strong></div>
    </div>
    <div className="teacher-leaves__toolbar">
      <div className="teacher-leaves__filters">
        <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ รหัส หรือเหตุผล" aria-label="ค้นหาคำขอลา" /></label>
        <select value={className} onChange={(event) => setClassName(event.target.value)} aria-label="กรองห้องเรียน">
          <option value="all">ทุกห้อง</option>{classes.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="กรองสถานะ">
          <option value="pending">รอพิจารณา</option><option value="all">ทุกสถานะ</option>
          <option value="approved">อนุมัติ</option><option value="rejected">ไม่อนุมัติ</option>
        </select>
      </div>
      <div className="teacher-leaves__actions">
        {sheetUrl && <a href={sheetUrl} target="_blank" rel="noopener noreferrer"><FileSpreadsheet size={17} /> เปิด Sheet การลา <ExternalLink size={14} /></a>}
        <button type="button" onClick={() => void load()} disabled={busy}><RefreshCw size={17} /> รีเฟรช</button>
      </div>
    </div>
    {error && <p className="teacher-error" role="alert">{error}</p>}
    {notice && <p className="teacher-leaves__notice" role="status">{notice}</p>}
    <div className="teacher-leaves__list">
      {busy && requests.length === 0 ? <div className="teacher-leaves__empty">กำลังโหลดคำขอลา...</div> :
        visible.length === 0 ? <div className="teacher-leaves__empty">ไม่มีคำขอลาตามตัวกรองนี้</div> :
        visible.map((item) => <article className="teacher-leave-card" key={item.id}>
          <div className="teacher-leave-card__top">
            <span className="teacher-leave-card__avatar">{item.fullName.slice(0, 1) || "น"}</span>
            <div className="teacher-leave-card__person"><strong>{item.fullName}</strong><small>{item.studentId} · {item.className} · เลขที่ {item.number}</small></div>
            <span className={`teacher-leave-status teacher-leave-status--${item.status}`}>
              {item.status === "pending" ? "รอพิจารณา" : item.status === "approved" ? "อนุมัติ" : "ไม่อนุมัติ"}
            </span>
          </div>
          <div className="teacher-leave-card__details">
            <span><CalendarDays size={16} /> {typeLabels[item.type] ?? "ลาเรียน"} · {dateThai(item.startDate)}{item.endDate !== item.startDate ? ` – ${dateThai(item.endDate)}` : ""} · {periodText(item)}</span>
            <p>{item.reason}</p>
          </div>
          <div className="teacher-leave-card__bottom">
            <small>ส่งเมื่อ {timeThai(item.submittedAt)}</small>
            {item.status === "pending" ? <div>
              <button type="button" className="teacher-leave-card__approve" onClick={() => { setDecision({ id: item.id, status: "approved", reason: "" }); setError(""); }}>อนุมัติ</button>
              <button type="button" className="teacher-leave-card__reject" onClick={() => { setDecision({ id: item.id, status: "rejected", reason: "" }); setError(""); }}>ไม่อนุมัติ</button>
            </div> : <small>พิจารณาโดย {item.reviewer || "ครู"} · {timeThai(item.reviewedAt)}{item.teacherReason && <> · {item.teacherReason}</>}</small>}
          </div>
        </article>)}
    </div>
    {decision && <div className="teacher-decision-backdrop" role="presentation" onClick={() => setDecision(null)}>
      <div className="teacher-decision-dialog" role="dialog" aria-modal="true" aria-label="ยืนยันผลคำขอลา" onClick={(event) => event.stopPropagation()}>
        <span className="teacher-eyebrow">ตรวจสอบก่อนบันทึก</span>
        <h2>{decision.status === "approved" ? "อนุมัติคำขอลา" : "ไม่อนุมัติคำขอลา"}</h2>
        <p>ผลนี้จะบันทึกลง Sheet และระบบจะพยายามแจ้งนักเรียนผ่าน LINE OA</p>
        <label>เหตุผลจากครู {decision.status === "rejected" && <em>*</em>}
          <textarea value={decision.reason} onChange={(event) => setDecision({ ...decision, reason: event.target.value })} rows={4} maxLength={500} placeholder={decision.status === "rejected" ? "ระบุเหตุผลที่ไม่อนุมัติ" : "ระบุคำชี้แจงเพิ่มเติม (ถ้ามี)"} />
        </label>
        {error && <p className="teacher-error" role="alert">{error}</p>}
        <div><button type="button" onClick={() => setDecision(null)} disabled={busy}>ยกเลิก</button>
          <button type="button" className={decision.status === "approved" ? "teacher-leave-card__approve" : "teacher-leave-card__reject"} onClick={() => void submitDecision()} disabled={busy}>
            {busy ? "กำลังบันทึก..." : "ยืนยันผล"}
          </button></div>
      </div>
    </div>}
  </section>;
}
