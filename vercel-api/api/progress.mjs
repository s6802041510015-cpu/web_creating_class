import { verifyLineIdToken } from "../lib/line-auth.mjs";
import { normalizeProgress } from "../lib/progress-schema.mjs";
import { readProgress, writeProgress } from "../lib/google-sheets.mjs";

const defaultOrigins = ["https://s6802041510015-cpu.github.io"];
function corsHeaders(origin) {
  const configured = (process.env.WEB_ORIGIN ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const allowed = defaultOrigins.includes(origin) || configured.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
  return allowed ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
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
    if (request.method !== "GET" && request.method !== "PUT") return json({ error: "ใช้ GET หรือ PUT เท่านั้น" }, 405, cors ?? {});
    if (!process.env.LINE_CHANNEL_ID || !process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return json({ error: "ระบบบันทึกความก้าวหน้ายังไม่ได้ตั้งค่า Google Sheets" }, 503, cors ?? {});
    }
    const token = /^Bearer (\S+)$/i.exec(request.headers.get("Authorization") ?? "")?.[1];
    if (!token) return json({ error: "กรุณาเข้าสู่ระบบด้วย LINE" }, 401, cors ?? {});
    let user;
    try { user = await verifyLineIdToken(token); }
    catch { return json({ error: "ตรวจสอบ LINE ไม่สำเร็จ กรุณาลองอีกครั้ง" }, 502, cors ?? {}); }
    if (!user) return json({ error: "LINE ID token ไม่ถูกต้องหรือหมดอายุ" }, 401, cors ?? {});

    try {
      if (request.method === "GET") return json({ progress: await readProgress(user.userId) }, 200, cors ?? {});
      if (!request.headers.get("Content-Type")?.includes("application/json")) return json({ error: "กรุณาส่ง JSON" }, 415, cors ?? {});
      const raw = await request.text();
      if (raw.length > 12000) return json({ error: "ข้อมูลยาวเกินไป" }, 413, cors ?? {});
      let progress;
      try { progress = normalizeProgress(JSON.parse(raw)); }
      catch { return json({ error: "ข้อมูลความก้าวหน้าไม่ถูกต้อง" }, 400, cors ?? {}); }
      return json({ progress: await writeProgress(user, progress) }, 200, cors ?? {});
    } catch (error) {
      console.error("Progress storage failed:", error instanceof Error ? error.message : "unknown");
      return json({ error: "บันทึกข้อมูลลง Google Sheets ไม่สำเร็จ กรุณาลองอีกครั้ง" }, 502, cors ?? {});
    }
  },
};
