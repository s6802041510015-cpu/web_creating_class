import { useState } from "react";
import type { FormEvent } from "react";
import { GraduationCap, LoaderCircle } from "lucide-react";
import "./student-registration.css";

export type StudentRegistration = {
  studentId: string;
  fullName: string;
  number: string;
  className: string;
};

export function StudentRegistrationForm({ onSubmit }: { onSubmit: (data: StudentRegistration) => Promise<void> }) {
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [number, setNumber] = useState("");
  const [className, setClassName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({ studentId: studentId.trim(), fullName: fullName.trim(), number: number.trim(), className: className.trim() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "บันทึกข้อมูลไม่ได้ กรุณาลองอีกครั้ง");
      setSaving(false);
    }
  }

  return (
    <main className="line-auth">
      <section className="line-auth__card student-registration" aria-labelledby="student-registration-title">
        <span className="line-auth__mark"><GraduationCap size={28} aria-hidden="true" /></span>
        <p className="line-auth__eyebrow">ลงทะเบียนครั้งแรก</p>
        <h1 id="student-registration-title">ระบุข้อมูลนักเรียน</h1>
        <p>กรอกข้อมูลตามทะเบียนเรียนเพื่อให้ครูรู้ว่าใครเป็นเจ้าของผลการเรียน แม้ชื่อ LINE จะไม่ใช่ชื่อจริง</p>
        <form onSubmit={(event) => void submit(event)}>
          <label>
            รหัสนักเรียน
            <input type="text" inputMode="numeric" pattern="[0-9]{5,20}" minLength={5} maxLength={20} autoComplete="off" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="ตัวเลข 5–20 หลัก" required disabled={saving} />
          </label>
          <label>
            ชื่อ-นามสกุล
            <input type="text" autoComplete="name" minLength={2} maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="ชื่อ-นามสกุลตามทะเบียนเรียน" required disabled={saving} />
          </label>
          <div className="student-registration__row">
            <label>
              เลขที่
              <input type="text" inputMode="numeric" pattern="[0-9]{1,3}" maxLength={3} autoComplete="off" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="เช่น 12" required disabled={saving} />
            </label>
            <label>
              ชั้น / ห้อง
              <input type="text" minLength={2} maxLength={50} autoComplete="off" value={className} onChange={(event) => setClassName(event.target.value)} placeholder="เช่น ปวช.1/1" required disabled={saving} />
            </label>
          </div>
          <p className="student-registration__note">ข้อมูลนี้จะบันทึกใน Google Sheet ที่ครูเข้าถึงได้ เมื่อบันทึกแล้วนักเรียนแก้เองไม่ได้ หากกรอกผิดให้แจ้งครู</p>
          {error && <p className="line-auth__error" role="alert">{error}</p>}
          <button className="line-auth__button" type="submit" disabled={saving}>{saving && <LoaderCircle className="line-auth__spinner" size={18} />} บันทึกและเริ่มเรียน</button>
        </form>
      </section>
    </main>
  );
}
