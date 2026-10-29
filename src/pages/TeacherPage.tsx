import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import "./teacher.css";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: Record<string, string>,
      ) => void;
      disableAutoSelect: () => void;
    };
  };
};
declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

type Assessment = { score: number; total: number } | null;
type Student = {
  userId: string;
  displayName: string;
  className: string;
  updatedAt: string;
  progress: {
    completedLessons: string[];
    assessments: { pre: Assessment; post: Assessment };
    codeLabCompleted: string[];
    workshopChecked: string[];
  };
};
type Teacher = { name: string; email: string };

const apiOrigin = (import.meta.env.VITE_AI_API_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();
let googleScript: Promise<GoogleIdentity> | null = null;

function loadGoogle(): Promise<GoogleIdentity> {
  if (window.google) return Promise.resolve(window.google);
  if (!googleScript)
    googleScript = new Promise<GoogleIdentity>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () =>
        window.google
          ? resolve(window.google)
          : reject(new Error("โหลด Google Sign-In ไม่สำเร็จ"));
      script.onerror = () => reject(new Error("โหลด Google Sign-In ไม่สำเร็จ"));
      document.head.append(script);
    }).catch((error) => {
      googleScript = null;
      throw error;
    });
  return googleScript!;
}

export function TeacherPage() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef("");
  const [token, setToken] = useState("");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [draftClasses, setDraftClasses] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token || !clientId || !buttonRef.current) return;
    let active = true;
    void loadGoogle()
      .then((google) => {
        if (!active || !buttonRef.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            sessionRef.current = credential;
            setError("");
            setToken(credential);
          },
        });
        buttonRef.current.replaceChildren();
        google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
        });
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "โหลด Google Sign-In ไม่สำเร็จ",
          );
      });
    return () => {
      active = false;
    };
  }, [token]);

  const loadStudents = useCallback(async (idToken: string) => {
    if (!apiOrigin) throw new Error("ยังไม่ได้ตั้งค่า URL ของ API");
    const response = await fetch(`${apiOrigin}/api/teacher`, {
      headers: { Authorization: `Bearer ${idToken}` },
      signal: AbortSignal.timeout(20000),
    });
    const result = (await response.json().catch(() => null)) as {
      teacher?: Teacher;
      students?: Student[];
      error?: string;
    } | null;
    if (!response.ok)
      throw new Error(result?.error || "โหลดข้อมูลนักเรียนไม่ได้");
    if (sessionRef.current !== idToken) return;
    setTeacher(result?.teacher ?? null);
    setStudents(result?.students ?? []);
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    void loadStudents(token)
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "โหลดข้อมูลนักเรียนไม่ได้",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, loadStudents]);

  const classes = useMemo(
    () =>
      [
        ...new Set(
          students.map((student) => student.className.trim()).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, "th")),
    [students],
  );
  const visible = useMemo(
    () =>
      students.filter((student) => {
        const matchesClass =
          classFilter === "all" ||
          (classFilter === "unassigned"
            ? !student.className
            : student.className === classFilter);
        const text =
          `${student.displayName} ${student.className}`.toLocaleLowerCase("th");
        return (
          matchesClass && text.includes(query.trim().toLocaleLowerCase("th"))
        );
      }),
    [students, classFilter, query],
  );
  const completed = students.filter(
    (student) => student.progress.completedLessons.length >= 6,
  ).length;
  const withPreTest = students.filter(
    (student) => student.progress.assessments.pre,
  ).length;
  const withPostTest = students.filter(
    (student) => student.progress.assessments.post,
  ).length;

  async function saveClass(student: Student) {
    const className = (
      draftClasses[student.userId] ?? student.className
    ).trim();
    if (className === student.className) return;
    setBusy(student.userId);
    setError("");
    try {
      const response = await fetch(`${apiOrigin}/api/teacher`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: student.userId, className }),
        signal: AbortSignal.timeout(20000),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(result?.error || "บันทึกห้องเรียนไม่ได้");
      await loadStudents(token);
      setDraftClasses((current) => {
        const next = { ...current };
        delete next[student.userId];
        return next;
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "บันทึกห้องเรียนไม่ได้",
      );
    } finally {
      setBusy("");
    }
  }

  function signOut() {
    sessionRef.current = "";
    window.google?.accounts.id.disableAutoSelect();
    setToken("");
    setTeacher(null);
    setStudents([]);
    setError("");
  }

  return (
    <div className="teacher-shell">
      <header className="teacher-header">
        <div className="teacher-header__brand">
          <span className="teacher-header__icon">
            <GraduationCap size={24} />
          </span>
          <div>
            <strong>WEBQUEST STUDIO</strong>
            <small>พื้นที่สำหรับคุณครู</small>
          </div>
        </div>
        <div className="teacher-header__actions">
          <ThemeToggle compact />
          <a href={import.meta.env.BASE_URL} className="teacher-header__link">
            <ArrowLeft size={17} /> เว็บนักเรียน
          </a>
          {token && (
            <button type="button" onClick={signOut}>
              ออกจากระบบ
            </button>
          )}
        </div>
      </header>
      <main className="teacher-main">
        <div className="teacher-intro">
          <span className="teacher-eyebrow">
            21901-2002 · วิชา การสร้างเว็บไซต์
          </span>
          <h1>ภาพรวมการเรียนของนักเรียน</h1>
          <p>
            ติดตามบทเรียน ผลแบบทดสอบ และกิจกรรมของแต่ละห้องจากข้อมูลที่บันทึกใน
            Google Sheet
          </p>
        </div>
        {!clientId || !apiOrigin ? (
          <section className="teacher-card teacher-login">
            <h2>เว็บครูยังไม่พร้อมใช้งาน</h2>
            <p>ต้องตั้งค่า Google OAuth Client ID และ URL ของ API ก่อน</p>
          </section>
        ) : !token ? (
          <section className="teacher-card teacher-login">
            <GraduationCap size={32} />
            <h2>เข้าสู่ระบบสำหรับครู</h2>
            <p>ใช้บัญชี Google ที่ได้รับสิทธิ์เพื่อดูข้อมูลนักเรียน</p>
            <div ref={buttonRef} className="teacher-google-button" />
            {error && (
              <p className="teacher-error" role="alert">
                {error}
              </p>
            )}
          </section>
        ) : (
          <>
            <div className="teacher-toolbar">
              <div>
                <span>
                  เข้าสู่ระบบ:{" "}
                  <strong>{teacher?.name || "กำลังตรวจสอบ..."}</strong>
                </span>
                {teacher && <small>{teacher.email}</small>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError("");
                  void loadStudents(token)
                    .catch((cause) =>
                      setError(
                        cause instanceof Error
                          ? cause.message
                          : "โหลดข้อมูลนักเรียนไม่ได้",
                      ),
                    )
                    .finally(() => setLoading(false));
                }}
                disabled={loading}
              >
                <RefreshCw size={17} /> รีเฟรช
              </button>
            </div>
            {error && (
              <p className="teacher-error" role="alert">
                {error}
              </p>
            )}
            {teacher && (
              <>
                <div className="teacher-stats">
                  <div className="teacher-stat">
                    <Users />
                    <span>นักเรียนทั้งหมด</span>
                    <strong>{students.length}</strong>
                  </div>
                  <div className="teacher-stat">
                    <ClipboardCheck />
                    <span>ทำก่อนเรียนแล้ว</span>
                    <strong>{withPreTest}</strong>
                  </div>
                  <div className="teacher-stat">
                    <BookOpenCheck />
                    <span>เรียนครบบท</span>
                    <strong>{completed}</strong>
                  </div>
                  <div className="teacher-stat">
                    <ClipboardCheck />
                    <span>ทำหลังเรียนแล้ว</span>
                    <strong>{withPostTest}</strong>
                  </div>
                </div>
                <section className="teacher-card teacher-list">
                  <div className="teacher-list__heading">
                    <div>
                      <h2>รายชื่อนักเรียน</h2>
                      <p>
                        แก้ไขห้องเรียนได้ในแต่ละแถว
                        ข้อมูลความก้าวหน้าจะอัปเดตจากเว็บนักเรียน
                      </p>
                    </div>
                    <div className="teacher-filters">
                      <label>
                        <Search size={18} />
                        <input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="ค้นหาชื่อหรือห้อง"
                          aria-label="ค้นหานักเรียน"
                        />
                      </label>
                      <select
                        value={classFilter}
                        onChange={(event) => setClassFilter(event.target.value)}
                        aria-label="กรองห้องเรียน"
                      >
                        <option value="all">ทุกห้อง</option>
                        <option value="unassigned">ยังไม่ระบุห้อง</option>
                        {classes.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {loading ? (
                    <p className="teacher-empty">กำลังโหลดข้อมูล...</p>
                  ) : visible.length === 0 ? (
                    <p className="teacher-empty">
                      {students.length
                        ? "ไม่พบนักเรียนตามตัวกรอง"
                        : "ยังไม่มีข้อมูลนักเรียนใน Sheet"}
                    </p>
                  ) : (
                    <div className="teacher-table-wrap">
                      <table className="teacher-table">
                        <thead>
                          <tr>
                            <th>นักเรียน</th>
                            <th>ห้องเรียน</th>
                            <th>บทเรียน</th>
                            <th>ก่อนเรียน</th>
                            <th>หลังเรียน</th>
                            <th>Code Lab</th>
                            <th>Workshop</th>
                            <th>อัปเดต</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((student) => (
                            <tr key={student.userId}>
                              <td>
                                <strong>
                                  {student.displayName || "ไม่ระบุชื่อ"}
                                </strong>
                                <small>{student.userId.slice(0, 9)}…</small>
                              </td>
                              <td>
                                <div className="teacher-class-edit">
                                  <input
                                    value={
                                      draftClasses[student.userId] ??
                                      student.className
                                    }
                                    onChange={(event) =>
                                      setDraftClasses((current) => ({
                                        ...current,
                                        [student.userId]: event.target.value,
                                      }))
                                    }
                                    placeholder="ระบุห้อง"
                                    maxLength={50}
                                    aria-label={`ห้องเรียนของ ${student.displayName}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void saveClass(student)}
                                    disabled={
                                      busy === student.userId ||
                                      (
                                        draftClasses[student.userId] ??
                                        student.className
                                      ).trim() === student.className
                                    }
                                  >
                                    {busy === student.userId ? "..." : "บันทึก"}
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span className="teacher-progress">
                                  {student.progress.completedLessons.length}/6
                                </span>
                                <div className="teacher-progress-bar">
                                  <span
                                    style={{
                                      width: `${Math.min(100, (student.progress.completedLessons.length / 6) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </td>
                              <td>
                                {student.progress.assessments.pre
                                  ? `${student.progress.assessments.pre.score}/12`
                                  : "—"}
                              </td>
                              <td>
                                {student.progress.assessments.post
                                  ? `${student.progress.assessments.post.score}/12`
                                  : "—"}
                              </td>
                              <td>
                                {student.progress.codeLabCompleted.length}/5
                              </td>
                              <td>
                                {student.progress.workshopChecked.length}/12
                              </td>
                              <td>
                                <small>
                                  {student.updatedAt
                                    ? new Date(
                                        student.updatedAt,
                                      ).toLocaleString("th-TH", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })
                                    : "—"}
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
