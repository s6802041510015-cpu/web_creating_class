import { verifyLineIdToken } from "../lib/line-auth.mjs";
import { createLeaveRequest, getLeaveProfile, listLeaveRequests } from "../lib/leave-sheets.mjs";
import { notifyLeave } from "../lib/line-messaging.mjs";

function corsHeaders(origin) {
  const configured = [process.env.LEAVE_WEB_ORIGIN, process.env.WEB_ORIGIN]
    .filter(Boolean).flatMap((value) => value.split(",").map((part) => part.trim()));
  const allowed = configured.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
  return allowed ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
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
    if (!["GET", "POST"].includes(request.method)) return json({ error: "ใช้ GET หรือ POST เท่านั้น" }, 405, cors ?? {});
    if (!process.env.LEAVE_GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.LINE_CHANNEL_ID) {
      return json({ error: "ระบบลาเรียนยังไม่ได้ตั้งค่า Google Sheet หรือ LINE" }, 503, cors ?? {});
    }
    const token = /^Bearer (\S+)$/i.exec(request.headers.get("Authorization") ?? "")?.[1];
    if (!token) return json({ error: "กรุณาเข้าสู่ระบบด้วย LINE" }, 401, cors ?? {});
    let user;
    try { user = await verifyLineIdToken(token); }
    catch { return json({ error: "ตรวจสอบ LINE ไม่สำเร็จ กรุณาลองอีกครั้ง" }, 502, cors ?? {}); }
    if (!user) return json({ error: "LINE Login หมดอายุ กรุณาเข้าใหม่" }, 401, cors ?? {});
    try {
      if (request.method === "GET") {
        const [profile, requests] = await Promise.all([
          getLeaveProfile(user.userId), listLeaveRequests(user.userId),
        ]);
        return json({ user: { displayName: user.displayName }, profile, requests }, 200, cors ?? {});
      }
      if (!request.headers.get("Content-Type")?.includes("application/json"))
        return json({ error: "กรุณาส่ง JSON" }, 415, cors ?? {});
      const raw = await request.text();
      if (raw.length > 3500) return json({ error: "ข้อมูลยาวเกินไป" }, 413, cors ?? {});
      let input;
      try { input = JSON.parse(raw); }
      catch { return json({ error: "ข้อมูลไม่ถูกต้อง" }, 400, cors ?? {}); }
      let result;
      try { result = await createLeaveRequest(user, input); }
      catch (error) {
        if (error?.message === "STUDENT_ID_TAKEN")
          return json({ error: "รหัสนักเรียนนี้ถูกใช้กับบัญชี LINE อื่นแล้ว กรุณาติดต่อครู" }, 409, cors ?? {});
        if (["INVALID_LEAVE", "INVALID_REGISTRATION"].includes(error?.message))
          return json({ error: "กรุณาตรวจข้อมูลนักเรียน วันที่ลา และเหตุผลให้ถูกต้อง" }, 400, cors ?? {});
        throw error;
      }
      let notificationRequested = false;
      if (result.created) {
        try { notificationRequested = await notifyLeave(result.request, "receipt"); }
        catch (error) { console.error("Leave receipt notification failed:", error instanceof Error ? error.message : "unknown"); }
      }
      return json({ ...result, notificationRequested }, result.created ? 201 : 200, cors ?? {});
    } catch (error) {
      console.error("Leave API failed:", error instanceof Error ? error.message : "unknown");
      return json({ error: "เชื่อมต่อข้อมูลการลาไม่ได้ กรุณาลองอีกครั้ง" }, 502, cors ?? {});
    }
  },
};
