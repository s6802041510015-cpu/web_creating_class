import { verifyLineIdToken } from "../lib/line-auth.mjs";
import { normalizeRegistration, readStudentRegistration, registerStudent } from "../lib/google-sheets.mjs";

const defaultOrigins = ["https://s6802041510015-cpu.github.io"];

function corsHeaders(origin) {
  const configured = (process.env.WEB_ORIGIN ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const allowed = defaultOrigins.includes(origin) || configured.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
  return allowed ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  } : null;
}

function json(data, status, headers = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") ?? "";
    const cors = corsHeaders(origin);
    if (origin && !cors) return json({ error: "ไม่อนุญาตให้เว็บไซต์นี้เรียก API" }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors ?? {} });
    if (request.method !== "GET" && request.method !== "POST") return json({ error: "ใช้ GET หรือ POST เท่านั้น" }, 405, cors ?? {});
    if (!process.env.LINE_CHANNEL_ID || !process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return json({ error: "ระบบข้อมูลนักเรียนยังไม่ได้ตั้งค่า Google Sheets" }, 503, cors ?? {});
    }
    const token = /^Bearer (\S+)$/i.exec(request.headers.get("Authorization") ?? "")?.[1];
    if (!token) return json({ error: "กรุณาเข้าสู่ระบบด้วย LINE" }, 401, cors ?? {});
    let user;
    try { user = await verifyLineIdToken(token); }
    catch { return json({ error: "ตรวจสอบ LINE ไม่สำเร็จ กรุณาลองอีกครั้ง" }, 502, cors ?? {}); }
    if (!user) return json({ error: "LINE ID token ไม่ถูกต้องหรือหมดอายุ" }, 401, cors ?? {});

    try {
      if (request.method === "GET") return json({ registration: await readStudentRegistration(user.userId) }, 200, cors ?? {});
      if (!request.headers.get("Content-Type")?.includes("application/json")) return json({ error: "กรุณาส่ง JSON" }, 415, cors ?? {});
      const raw = await request.text();
      if (raw.length > 1000) return json({ error: "ข้อมูลยาวเกินไป" }, 413, cors ?? {});
      let registration;
      try { registration = normalizeRegistration(JSON.parse(raw)); }
      catch { return json({ error: "กรุณาตรวจรหัสนักเรียน ชื่อ เลขที่ และชั้นให้ถูกต้อง" }, 400, cors ?? {}); }
      return json({ registration: await registerStudent(user, registration) }, 200, cors ?? {});
    } catch (error) {
      if (error instanceof Error && error.message === "STUDENT_ID_TAKEN") {
        return json({ error: "รหัสนักเรียนนี้ถูกลงทะเบียนกับบัญชี LINE อื่นแล้ว กรุณาติดต่อครู" }, 409, cors ?? {});
      }
      console.error("Student registration failed:", error instanceof Error ? error.message : "unknown");
      return json({ error: "บันทึกข้อมูลนักเรียนไม่ได้ กรุณาลองอีกครั้ง" }, 502, cors ?? {});
    }
  },
};
