import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { JWT } from "google-auth-library";
import leaveApi from "../api/leave.mjs";
import teacherLeavesApi from "../api/teacher/leaves.mjs";
import { createTeacherPasswordHash, createTeacherSession } from "../lib/teacher-auth.mjs";
import { normalizeLeave } from "../lib/leave-sheets.mjs";

const userId = `U${"a".repeat(32)}`;
const idToken = "x".repeat(120);
const requestKey = "ed7bda13-8b0a-4e82-9234-f5405d178650";
const profile = { studentId: "6802041510015", fullName: "สมชาย ใจดี", number: "12", className: "ปวช.1/1" };
const leave = { requestKey, profile, type: "sick", startDate: "2026-10-31", endDate: "2026-10-31",
  period: "custom", startTime: "09:00", endTime: "11:00", reason: "มีอาการป่วยและต้องพักรักษาตัว" };
const leaveOrigin = "https://webhtml-leave.vercel.app";
const teacherOrigin = "https://s6802041510015-cpu.github.io";

function request(path, method, body, token, origin) {
  return new Request(`https://api.example.test${path}`, {
    method,
    headers: {
      Origin: origin,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test("leave input rejects invalid dates, long ranges and partial multi-day requests", () => {
  assert.equal(normalizeLeave(leave).type, "sick");
  assert.throws(() => normalizeLeave({ ...leave, startDate: "2026-02-30" }), /INVALID_LEAVE/);
  assert.throws(() => normalizeLeave({ ...leave, endDate: "2026-12-31" }), /INVALID_LEAVE/);
  assert.throws(() => normalizeLeave({ ...leave, endDate: "2026-11-01", period: "morning" }), /INVALID_LEAVE/);
  assert.throws(() => normalizeLeave({ ...leave, endDate: "2026-11-01" }), /INVALID_LEAVE/);
  assert.throws(() => normalizeLeave({ ...leave, startTime: "11:00" }), /INVALID_LEAVE/);
  assert.throws(() => normalizeLeave({ ...leave, endTime: "25:00" }), /INVALID_LEAVE/);
  assert.throws(() => normalizeLeave({ ...leave, startTime: "" }), /INVALID_LEAVE/);
  assert.deepEqual(normalizeLeave({ ...leave, period: "full" }).startTime, "");
});

test("separate leave sheet receives request, teacher decision and LINE notices", async () => {
  const keys = ["LEAVE_GOOGLE_SHEET_ID", "GOOGLE_SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_JSON",
    "LINE_CHANNEL_ID", "LINE_MESSAGING_CHANNEL_ACCESS_TOKEN", "LEAVE_WEB_ORIGIN",
    "TEACHER_USERNAME", "TEACHER_PASSWORD_HASH", "TEACHER_SESSION_SECRET"];
  const savedEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  process.env.LEAVE_GOOGLE_SHEET_ID = "leave-spreadsheet-id-0123456789";
  delete process.env.GOOGLE_SHEET_ID;
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "robot@example.test", private_key: "test" });
  process.env.LINE_CHANNEL_ID = "2012268768";
  process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN = "test-line-token";
  process.env.LEAVE_WEB_ORIGIN = leaveOrigin;
  process.env.TEACHER_USERNAME = "katawut";
  process.env.TEACHER_PASSWORD_HASH = await createTeacherPasswordHash("testpassword");
  process.env.TEACHER_SESSION_SECRET = "s".repeat(43);
  mock.method(JWT.prototype, "getAccessToken", async () => ({ token: "sheets-token" }));
  const profiles = [];
  const requests = [];
  const pushes = [];
  const sheetWrites = [];
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.includes("oauth2/v2.1/verify")) return Response.json({
      aud: "2012268768", sub: userId, name: "LINE Name",
    });
    if (path.includes("/v2/bot/message/push")) {
      pushes.push(JSON.parse(options.body));
      return Response.json({});
    }
    if (!path.includes("leave-spreadsheet-id-0123456789")) throw new Error(`Unexpected spreadsheet: ${path}`);
    if (path.includes("fields=sheets.properties.title")) return Response.json({ sheets: [
      { properties: { title: "LeaveStudents" } }, { properties: { title: "LeaveRequests" } },
    ] });
    if (path.includes("A1%3AF1") || path.includes("A1%3AR1")) return Response.json({ values: [] });
    if (options.method === "PUT" && path.includes("A1%3A")) return Response.json({ updatedRows: 1 });
    if (path.includes("A2%3AF")) return Response.json({ values: profiles });
    if (path.includes("A2%3AR")) return Response.json({ values: requests });
    if (options.method === "POST" && path.includes(":append")) {
      const data = JSON.parse(options.body);
      sheetWrites.push(data);
      if (path.includes("LeaveStudents")) profiles.push(data.values[0]);
      else requests.push(data.values[0]);
      return Response.json({ updates: { updatedRows: 1 } });
    }
    if (options.method === "PUT" && path.includes("L2%3AP2")) {
      const data = JSON.parse(options.body);
      requests[0].splice(11, 5, ...data.values[0]);
      return Response.json({ updatedRows: 1 });
    }
    throw new Error(`Unexpected request: ${path}`);
  };
  try {
    const teacherToken = createTeacherSession("katawut").token;
    assert.equal((await leaveApi.fetch(request("/api/leave", "GET", null, idToken, "https://other.example"))).status, 403);
    assert.equal((await leaveApi.fetch(request("/api/leave", "GET", null, "", leaveOrigin))).status, 401);
    assert.equal((await teacherLeavesApi.fetch(request("/api/teacher/leaves", "GET", null, "", teacherOrigin))).status, 401);
    assert.equal((await leaveApi.fetch(request("/api/leave", "POST", { ...leave, endDate: "2026-02-30" }, idToken, leaveOrigin))).status, 400);
    const submitted = await leaveApi.fetch(request("/api/leave", "POST", leave, idToken, leaveOrigin));
    assert.equal(submitted.status, 201);
    const result = await submitted.json();
    assert.equal(result.request.status, "pending");
    assert.equal(result.request.startTime, "09:00");
    assert.equal(result.request.endTime, "11:00");
    assert.equal(result.notificationRequested, true);
    assert.equal(profiles.length, 1);
    assert.equal(requests.length, 1);
    assert.equal(sheetWrites[1].range, "'LeaveRequests'!A:R");
    assert.equal(sheetWrites[1].values[0][11], "pending");
    assert.deepEqual(sheetWrites[1].values[0].slice(16), ["09:00", "11:00"]);
    assert.equal(pushes[0].to, userId);
    assert.match(JSON.stringify(pushes[0]), /09:00–11:00 น\./);
    const repeated = await leaveApi.fetch(request("/api/leave", "POST", leave, idToken, leaveOrigin));
    assert.equal(repeated.status, 200);
    assert.equal(requests.length, 1);
    assert.equal(pushes.length, 1);
    const inbox = await teacherLeavesApi.fetch(request("/api/teacher/leaves", "GET", null, teacherToken, teacherOrigin));
    assert.equal(inbox.status, 200);
    const inboxData = await inbox.json();
    assert.equal(inboxData.sheetUrl, "https://docs.google.com/spreadsheets/d/leave-spreadsheet-id-0123456789/edit");
    assert.equal(inboxData.requests[0].startTime, "09:00");
    const decision = await teacherLeavesApi.fetch(request("/api/teacher/leaves", "PUT", {
      id: requestKey, status: "rejected", teacherReason: "กรุณาแจ้งครูประจำชั้นก่อน",
    }, teacherToken, teacherOrigin));
    assert.equal(decision.status, 200);
    assert.equal((await decision.json()).notificationRequested, true);
    assert.equal(pushes.length, 2);
    assert.match(JSON.stringify(pushes[1]), /09:00–11:00 น\./);
    assert.equal((await teacherLeavesApi.fetch(request("/api/teacher/leaves", "PUT", {
      id: requestKey, status: "approved", teacherReason: "",
    }, teacherToken, teacherOrigin))).status, 409);
    const mine = await leaveApi.fetch(request("/api/leave", "GET", null, idToken, leaveOrigin));
    assert.equal((await mine.json()).requests[0].teacherReason, "กรุณาแจ้งครูประจำชั้นก่อน");
  } finally {
    globalThis.fetch = originalFetch;
    mock.restoreAll();
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
