import { createTeacherSession, teacherAuthConfigured, verifyTeacherCredentials } from "../../lib/teacher-auth.mjs";

const defaultOrigins = ["https://s6802041510015-cpu.github.io"];
const attempts = new Map();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 5;

function corsHeaders(origin) {
  const configured = (process.env.WEB_ORIGIN ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const allowed = defaultOrigins.includes(origin) || configured.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
  return allowed ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : null;
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
    if (request.method !== "POST") return json({ error: "ใช้ POST เท่านั้น" }, 405, cors ?? {});
    if (!teacherAuthConfigured()) return json({ error: "ยังไม่ได้ตั้งค่าบัญชีครูบน Vercel" }, 503, cors ?? {});
    if (!request.headers.get("Content-Type")?.includes("application/json")) return json({ error: "กรุณาส่ง JSON" }, 415, cors ?? {});
    const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim().slice(0, 64);
    const now = Date.now();
    const current = attempts.get(ip);
    if (current && current.until > now && current.count >= maxAttempts) {
      return json({ error: "ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที" }, 429, { ...(cors ?? {}), "Retry-After": String(Math.ceil((current.until - now) / 1000)) });
    }
    let input;
    try {
      const raw = await request.text();
      if (raw.length > 1000) return json({ error: "ข้อมูลยาวเกินไป" }, 413, cors ?? {});
      input = JSON.parse(raw);
    } catch { return json({ error: "ข้อมูลไม่ถูกต้อง" }, 400, cors ?? {}); }
    const username = typeof input?.username === "string" ? input.username : "";
    const password = typeof input?.password === "string" ? input.password : "";
    if (!username || username.length > 100 || !password || password.length > 256) return json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, 401, cors ?? {});
    let teacher;
    try {
      teacher = await verifyTeacherCredentials(username, password);
    } catch (error) {
      console.error("Teacher login failed:", error instanceof Error ? error.message : "unknown");
      return json({ error: "ระบบเข้าสู่ระบบขัดข้อง กรุณาลองอีกครั้ง" }, 502, cors ?? {});
    }
    if (!teacher) {
      attempts.set(ip, { count: current && current.until > now ? current.count + 1 : 1, until: current && current.until > now ? current.until : now + windowMs });
      if (attempts.size > 10000) attempts.clear();
      return json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, 401, cors ?? {});
    }
    attempts.delete(ip);
    return json({ teacher, ...createTeacherSession() }, 200, cors ?? {});
  },
};
