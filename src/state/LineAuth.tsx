import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type liff from "@line/liff";
import { LoaderCircle, LogIn, RefreshCw } from "lucide-react";
import { StudentRegistrationForm } from "../components/auth/StudentRegistrationForm";
import type { StudentRegistration } from "../components/auth/StudentRegistrationForm";
import "../styles/line-auth.css";

type LineUser = { userId: string; displayName: string; fullName?: string; pictureUrl?: string };
type LineAuthState = {
  user: LineUser | null;
  isDemo: boolean;
  getIdToken: () => Promise<string | null>;
};

const getIdToken = async () => liffId ? (await initializeLiff()).getIDToken() : null;
const LineAuthContext = createContext<LineAuthState>({ user: null, isDemo: true, getIdToken });
const liffId = (import.meta.env.VITE_LIFF_ID ?? "").trim();
const apiOrigin = (import.meta.env.VITE_AI_API_URL ?? "").trim().replace(/\/+$/, "");
let liffInit: Promise<typeof liff> | null = null;

function initializeLiff() {
  if (!liffInit) {
    liffInit = import("@line/liff").then(async ({ default: sdk }) => {
      await sdk.init({ liffId });
      return sdk;
    }).catch((error: unknown) => {
      liffInit = null;
      throw error;
    });
  }
  return liffInit;
}

async function verifyUser(idToken: string, signal: AbortSignal): Promise<LineUser> {
  const response = await fetch(`${apiOrigin}/api/auth/line`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    signal,
  });
  const result = await response.json().catch(() => null) as { user?: LineUser; error?: string } | null;
  if (!response.ok || !result?.user?.userId) {
    throw new Error(result?.error || "ยืนยันตัวตนกับ LINE ไม่สำเร็จ");
  }
  return result.user;
}

async function studentRegistration(method: "GET" | "POST", input?: StudentRegistration, signal?: AbortSignal) {
  const token = await getIdToken();
  if (!token) throw new Error("LINE Login หมดอายุ กรุณาเปิดเว็บใหม่");
  const response = await fetch(`${apiOrigin}/api/student`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(input ? { "Content-Type": "application/json" } : {}) },
    ...(input ? { body: JSON.stringify(input) } : {}),
    signal: signal ?? AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => null) as { registration?: StudentRegistration | null; error?: string } | null;
  if (!response.ok) throw new Error(result?.error || "เชื่อมต่อข้อมูลนักเรียนไม่ได้");
  return result?.registration ?? null;
}

export function useLineAuth() {
  return useContext(LineAuthContext);
}

export function LineAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LineUser | null>(null);
  const [pendingUser, setPendingUser] = useState<LineUser | null>(null);
  const [status, setStatus] = useState<"loading" | "login" | "error">("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!liffId) return;
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setPendingUser(null);
    void (async () => {
      try {
        if (!apiOrigin) throw new Error("ยังไม่ได้ตั้งค่า VITE_AI_API_URL สำหรับ API ยืนยันตัวตน");
        const sdk = await initializeLiff();
        if (controller.signal.aborted) return;
        if (!sdk.isLoggedIn()) {
          if (sdk.isInClient()) throw new Error("LINE ยังไม่เข้าสู่ระบบ กรุณาปิดหน้านี้แล้วเปิดจากเมนู LINE อีกครั้ง");
          setStatus("login");
          return;
        }
        const idToken = sdk.getIDToken();
        if (!idToken) throw new Error("LIFF ไม่ได้รับ ID token กรุณาเปิด scope openid ใน LINE Developers");
        const verified = await verifyUser(idToken, controller.signal);
        if (controller.signal.aborted) return;
        const registration = await studentRegistration("GET", undefined, controller.signal);
        if (controller.signal.aborted) return;
        if (registration) setUser({ ...verified, fullName: registration.fullName });
        else setPendingUser(verified);
        // The photo is display-only. A missing photo or denied profile scope must not block login.
        void sdk.getProfile().then((profile) => {
          if (!controller.signal.aborted && profile.userId === verified.userId && profile.pictureUrl) {
            setUser((current) => current?.userId === verified.userId ? { ...current, pictureUrl: profile.pictureUrl } : current);
            setPendingUser((current) => current?.userId === verified.userId ? { ...current, pictureUrl: profile.pictureUrl } : current);
          }
        }).catch(() => {});
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "เชื่อมต่อ LINE ไม่สำเร็จ");
        setStatus("error");
      }
    })();
    return () => controller.abort();
  }, [attempt]);

  if (!liffId) {
    return <LineAuthContext.Provider value={{ user: null, isDemo: true, getIdToken }}>{children}</LineAuthContext.Provider>;
  }
  if (user) {
    return <LineAuthContext.Provider value={{ user, isDemo: false, getIdToken }}>{children}</LineAuthContext.Provider>;
  }
  if (pendingUser) {
    return <StudentRegistrationForm onSubmit={async (input) => {
      const registration = await studentRegistration("POST", input);
      if (!registration) throw new Error("บันทึกข้อมูลนักเรียนไม่สำเร็จ");
      setUser({ ...pendingUser, fullName: registration.fullName });
      setPendingUser(null);
    }} />;
  }

  return (
    <main className="line-auth">
      <section className="line-auth__card" aria-live="polite">
        <span className="line-auth__mark">W</span>
        <p className="line-auth__eyebrow">WEBQUEST STUDIO</p>
        <h1>เข้าสู่ระบบเพื่อเริ่มเรียน</h1>
        <p>ใช้บัญชี LINE ของคุณเพื่อเข้าสู่บทเรียนวิชา การสร้างเว็บไซต์</p>
        {status === "loading" && <div className="line-auth__status"><LoaderCircle className="line-auth__spinner" size={22} /> กำลังตรวจสอบการเข้าสู่ระบบ...</div>}
        {status === "login" && (
          <button className="line-auth__button" type="button" onClick={() => {
            void initializeLiff().then((sdk) => sdk.login({ redirectUri: window.location.href })).catch((cause: unknown) => {
              setError(cause instanceof Error ? cause.message : "เปิด LINE Login ไม่สำเร็จ");
              setStatus("error");
            });
          }}><LogIn size={20} /> เข้าสู่ระบบด้วย LINE</button>
        )}
        {status === "error" && <>
          <p className="line-auth__error" role="alert">{error}</p>
          <button className="line-auth__button" type="button" onClick={() => setAttempt((value) => value + 1)}><RefreshCw size={19} /> ลองอีกครั้ง</button>
        </>}
      </section>
    </main>
  );
}
