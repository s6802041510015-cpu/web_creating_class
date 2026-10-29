import { verifyLineIdToken } from "../../lib/line-auth.mjs";

const defaultOrigins = ["https://s6802041510015-cpu.github.io"];

function corsHeaders(origin) {
  const configured = (process.env.WEB_ORIGIN ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const allowed = defaultOrigins.includes(origin) || configured.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
  return allowed ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
    if (request.method !== "POST") return json({ error: "ใช้ POST เท่านั้น" }, 405, cors ?? {});
    if (!request.headers.get("Content-Type")?.includes("application/json")) return json({ error: "กรุณาส่งข้อมูลแบบ JSON" }, 415, cors ?? {});
    if (!process.env.LINE_CHANNEL_ID) return json({ error: "ระบบเข้าสู่ระบบยังไม่ได้ตั้งค่า LINE Channel ID" }, 503, cors ?? {});

    let input;
    try {
      const raw = await request.text();
      if (raw.length > 12_000) return json({ error: "ข้อมูลยาวเกินไป" }, 413, cors ?? {});
      input = JSON.parse(raw);
    } catch {
      return json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, 400, cors ?? {});
    }
    if (typeof input?.idToken !== "string") return json({ error: "ไม่พบ LINE ID token" }, 400, cors ?? {});

    try {
      const user = await verifyLineIdToken(input.idToken);
      if (!user) return json({ error: "ไม่สามารถยืนยันตัวตนกับ LINE ได้ กรุณาเข้าสู่ระบบใหม่" }, 401, cors ?? {});
      return json({ user }, 200, cors ?? {});
    } catch {
      return json({ error: "เชื่อมต่อ LINE ไม่สำเร็จ กรุณาลองอีกครั้ง" }, 502, cors ?? {});
    }
  },
};
