import { teacherAuthConfigured, verifyTeacherSession } from "../lib/teacher-auth.mjs";
import { listStudents, updateStudentClass } from "../lib/google-sheets.mjs";

const defaultOrigins = ["https://s6802041510015-cpu.github.io"];
function corsHeaders(origin) {
  const configured = (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed =
    defaultOrigins.includes(origin) ||
    configured.includes(origin) ||
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
  return allowed
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        Vary: "Origin",
      }
    : null;
}
function json(data, status, headers = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") ?? "";
    const cors = corsHeaders(origin);
    if (origin && !cors)
      return json({ error: "ไม่อนุญาตให้เว็บไซต์นี้เรียก API" }, 403);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors ?? {} });
    if (request.method !== "GET" && request.method !== "PUT")
      return json({ error: "ใช้ GET หรือ PUT เท่านั้น" }, 405, cors ?? {});
    if (!teacherAuthConfigured())
      return json({ error: "ยังไม่ได้ตั้งค่าบัญชีครู" }, 503, cors ?? {});
    const token = /^Bearer (\S+)$/i.exec(
      request.headers.get("Authorization") ?? "",
    )?.[1];
    if (!token)
      return json({ error: "กรุณาเข้าสู่ระบบสำหรับครู" }, 401, cors ?? {});
    const teacher = verifyTeacherSession(token);
    if (!teacher)
      return json(
        { error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง" },
        401,
        cors ?? {},
      );
    try {
      if (request.method === "GET")
        return json(
          {
            teacher,
            students: await listStudents(),
          },
          200,
          cors ?? {},
        );
      if (!request.headers.get("Content-Type")?.includes("application/json"))
        return json({ error: "กรุณาส่ง JSON" }, 415, cors ?? {});
      const raw = await request.text();
      if (raw.length > 500)
        return json({ error: "ข้อมูลยาวเกินไป" }, 413, cors ?? {});
      let input;
      try {
        input = JSON.parse(raw);
      } catch {
        return json({ error: "ข้อมูลไม่ถูกต้อง" }, 400, cors ?? {});
      }
      const userId =
        typeof input?.userId === "string" ? input.userId.trim() : "";
      const className =
        typeof input?.className === "string" ? input.className.trim() : "";
      if (
        !/^U[a-fA-F0-9]{32}$/.test(userId) ||
        className.length > 50 ||
        /[\r\n]/.test(className)
      )
        return json(
          { error: "รหัสนักเรียนหรือห้องเรียนไม่ถูกต้อง" },
          400,
          cors ?? {},
        );
      const updated = await updateStudentClass(userId, className);
      if (!updated) return json({ error: "ไม่พบนักเรียน" }, 404, cors ?? {});
      return json({ ok: true }, 200, cors ?? {});
    } catch (error) {
      console.error(
        "Teacher API failed:",
        error instanceof Error ? error.message : "unknown",
      );
      return json(
        { error: "โหลดหรือบันทึกข้อมูลนักเรียนไม่ได้" },
        502,
        cors ?? {},
      );
    }
  },
};
