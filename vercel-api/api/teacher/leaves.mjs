import { teacherAuthConfigured, verifyTeacherSession } from "../../lib/teacher-auth.mjs";
import { leaveSheetUrl, listLeaveRequests, reviewLeaveRequest } from "../../lib/leave-sheets.mjs";
import { notifyLeave } from "../../lib/line-messaging.mjs";

function corsHeaders(origin) {
  const configured = (process.env.WEB_ORIGIN ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const allowed = origin === "https://s6802041510015-cpu.github.io" || configured.includes(origin) ||
    /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
  return allowed ? {
    "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type", Vary: "Origin",
  } : null;
}
const json = (data, status, headers = {}) => Response.json(data, {
  status, headers: { "Cache-Control": "no-store", ...headers },
});

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") ?? "";
    const cors = corsHeaders(origin);
    if (origin && !cors) return json({ error: "ไม่อนุญาตให้เว็บไซต์นี้เรียก API" }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors ?? {} });
    if (!["GET", "PUT"].includes(request.method)) return json({ error: "ใช้ GET หรือ PUT เท่านั้น" }, 405, cors ?? {});
    if (!teacherAuthConfigured()) return json({ error: "ยังไม่ได้ตั้งค่าบัญชีครู" }, 503, cors ?? {});
    const token = /^Bearer (\S+)$/i.exec(request.headers.get("Authorization") ?? "")?.[1];
    const teacher = token ? verifyTeacherSession(token) : null;
    if (!teacher) return json({ error: "กรุณาเข้าสู่ระบบสำหรับครูอีกครั้ง" }, 401, cors ?? {});
    if (!process.env.LEAVE_GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
      return json({ error: "ยังไม่ได้ตั้งค่า Google Sheet สำหรับการลา" }, 503, cors ?? {});
    try {
      if (request.method === "GET") return json({
        requests: await listLeaveRequests(), sheetUrl: leaveSheetUrl(),
      }, 200, cors ?? {});
      if (!request.headers.get("Content-Type")?.includes("application/json"))
        return json({ error: "กรุณาส่ง JSON" }, 415, cors ?? {});
      const raw = await request.text();
      if (raw.length > 1500) return json({ error: "ข้อมูลยาวเกินไป" }, 413, cors ?? {});
      let input;
      try { input = JSON.parse(raw); }
      catch { return json({ error: "ข้อมูลไม่ถูกต้อง" }, 400, cors ?? {}); }
      const id = typeof input?.id === "string" ? input.id : "";
      const status = input?.status;
      const teacherReason = typeof input?.teacherReason === "string" ? input.teacherReason.trim() : "";
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !["approved", "rejected"].includes(status) ||
        teacherReason.length > 500 || (status === "rejected" && teacherReason.length < 3))
        return json({ error: "กรุณาตรวจผลการพิจารณาและเหตุผล" }, 400, cors ?? {});
      const result = await reviewLeaveRequest(id, status, teacherReason, teacher.name);
      if (!result) return json({ error: "ไม่พบคำขอลานี้" }, 404, cors ?? {});
      if (!result.updated) return json({ error: "คำขอนี้ได้รับการพิจารณาแล้ว กรุณารีเฟรช" }, 409, cors ?? {});
      let notificationRequested = false;
      try { notificationRequested = await notifyLeave(result.request, "decision"); }
      catch (error) { console.error("Leave decision notification failed:", error instanceof Error ? error.message : "unknown"); }
      return json({ ...result, notificationRequested }, 200, cors ?? {});
    } catch (error) {
      console.error("Teacher leave API failed:", error instanceof Error ? error.message : "unknown");
      return json({ error: "โหลดหรือบันทึกคำขอลาไม่ได้" }, 502, cors ?? {});
    }
  },
};
