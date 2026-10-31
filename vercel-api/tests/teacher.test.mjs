import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { JWT } from "google-auth-library";
import teacherApi from "../api/teacher.mjs";
import loginApi from "../api/teacher/login.mjs";
import { createTeacherPasswordHash, verifyTeacherSession } from "../lib/teacher-auth.mjs";

const origin = "https://s6802041510015-cpu.github.io";
const userId = `U${"a".repeat(32)}`;
const heading = ["LINE User ID", ...Array(10).fill(""), "รหัสนักเรียน", "ชื่อ-นามสกุล", "เลขที่", "ชั้นที่นักเรียนระบุ"];
const progress = { version: 1, completedLessons: ["00"], assessments: { pre: null, post: null }, codeLabCompleted: [], workshopChecked: [] };

const request = (method = "GET", body, token = "") => new Request("https://example.vercel.app/api/teacher", {
  method,
  headers: { Origin: origin, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
});
const loginRequest = (username, password, requestOrigin = origin) => new Request("https://example.vercel.app/api/teacher/login", {
  method: "POST", headers: { Origin: requestOrigin, "Content-Type": "application/json", "x-forwarded-for": "192.0.2.10" },
  body: JSON.stringify({ username, password }),
});

test("teacher endpoints stay closed until password credentials are configured", async () => {
  assert.equal((await teacherApi.fetch(request())).status, 503);
  assert.equal((await loginApi.fetch(loginRequest("teacher", "any"))).status, 503);
});

test("teacher password setup accepts six characters and rejects shorter passwords", async () => {
  await assert.rejects(createTeacherPasswordHash("12345"), /6-256/);
  assert.match(await createTeacherPasswordHash("123456"), /^scrypt\$16384\$8\$5\$/);
});

test("teacher password login issues a signed short-lived session for student data", async () => {
  const keys = ["TEACHER_USERNAME", "TEACHER_PASSWORD_HASH", "TEACHER_SESSION_SECRET", "GOOGLE_SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_JSON"];
  const savedEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const password = "correct-horse-battery-staple";
  process.env.TEACHER_USERNAME = "Katawut";
  process.env.TEACHER_PASSWORD_HASH = await createTeacherPasswordHash(password);
  process.env.TEACHER_SESSION_SECRET = "s".repeat(43);
  process.env.GOOGLE_SHEET_ID = "testspreadsheetid0123456789";
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "robot@example.iam.gserviceaccount.com", private_key: "test" });
  mock.method(JWT.prototype, "getAccessToken", async () => ({ token: "sheets-token" }));
  const rows = [[userId, "LINE nickname", "ปวช.1/1", "", "", 1, "00", 0, 0, "2026-10-29T00:00:00.000Z", JSON.stringify(progress), "6802041510015", "สมชาย ใจดี", "12", "ปวช.1/1"]];
  const tabs = [{ properties: { title: "Students", sheetId: 0 } }];
  let classWrite;
  let classSheetWrite;
  let addCount = 0;
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.includes("fields=sheets.properties")) return Response.json({ sheets: tabs });
    if (path.includes("A1%3AO1")) return Response.json({ values: [heading] });
    if (path.includes("A2%3AO")) return Response.json({ values: rows });
    if (options.method === "POST" && path.includes("/values:batchUpdate")) {
      classSheetWrite = JSON.parse(options.body);
      return Response.json({ totalUpdatedRows: 2 });
    }
    if (options.method === "POST" && path.endsWith(":batchUpdate")) {
      const title = JSON.parse(options.body).requests[0].addSheet.properties.title;
      const properties = { title, sheetId: 70 + ++addCount };
      tabs.push({ properties });
      return Response.json({ replies: [{ addSheet: { properties } }] });
    }
    if (options.method === "PUT") { classWrite = JSON.parse(options.body); return Response.json({ updatedRows: 1 }); }
    throw new Error(`Unexpected request: ${path}`);
  };
  try {
    assert.equal((await loginApi.fetch(loginRequest("Katawut", password, "https://other.example"))).status, 403);
    assert.equal((await loginApi.fetch(loginRequest("wrong", password))).status, 401);
    assert.equal((await loginApi.fetch(loginRequest("Katawut", "wrong-password"))).status, 401);
    const signedIn = await loginApi.fetch(loginRequest("katawut", password));
    assert.equal(signedIn.status, 200);
    const login = await signedIn.json();
    assert.equal(login.teacher.name, "Katawut");
    assert.equal(typeof login.token, "string");
    assert.equal(verifyTeacherSession(login.token)?.name, "Katawut");
    assert.equal(verifyTeacherSession(`${login.token}x`), null);
    assert.equal((await teacherApi.fetch(request())).status, 401);
    assert.equal((await teacherApi.fetch(request("GET", undefined, "invalid"))).status, 401);
    const listResponse = await teacherApi.fetch(request("GET", undefined, login.token));
    assert.equal(listResponse.status, 200);
    const list = await listResponse.json();
    assert.equal(list.teacher.name, "Katawut");
    assert.equal(list.sheetUrl, "https://docs.google.com/spreadsheets/d/testspreadsheetid0123456789/edit");
    assert.equal(list.students[0].fullName, "สมชาย ใจดี");
    assert.equal(list.students[0].studentId, "6802041510015");
    assert.deepEqual(list.students[0].progress, progress);
    assert.equal((await teacherApi.fetch(request("POST", { action: "createClassSheet", className: "ปวช.1/1" }))).status, 401);
    assert.equal((await teacherApi.fetch(request("POST", { action: "createClassSheet", className: "ไม่มีห้องนี้" }, login.token))).status, 404);
    const createdResponse = await teacherApi.fetch(request("POST", { action: "createClassSheet", className: "ปวช.1/1" }, login.token));
    assert.equal(createdResponse.status, 200);
    const created = await createdResponse.json();
    assert.equal(created.created, true);
    assert.equal(created.url, "https://docs.google.com/spreadsheets/d/testspreadsheetid0123456789/edit#gid=71");
    assert.equal(created.title.includes("/"), false);
    assert.equal(classSheetWrite.valueInputOption, "USER_ENTERED");
    assert.equal(classSheetWrite.data[1].values[0][0], '=IFNA(FILTER(Students!A2:O,Students!C2:C="ปวช.1/1"),"")');
    const existing = await teacherApi.fetch(request("POST", { action: "createClassSheet", className: "ปวช.1/1" }, login.token));
    assert.equal((await existing.json()).created, false);
    assert.equal(addCount, 1);
    rows[0][2] = 'A"B';
    const quoted = await teacherApi.fetch(request("POST", { action: "createClassSheet", className: 'A"B' }, login.token));
    assert.equal(quoted.status, 200);
    assert.equal(classSheetWrite.data[1].values[0][0], '=IFNA(FILTER(Students!A2:O,Students!C2:C="A""B"),"")');
    rows[0][2] = "ปวช.1/1";
    assert.equal((await teacherApi.fetch(request("PUT", { userId, className: "ปวช.2/1" }, login.token))).status, 200);
    assert.equal(classWrite.range, "'Students'!C2");
    assert.deepEqual(classWrite.values, [["ปวช.2/1"]]);
    assert.equal((await teacherApi.fetch(request("PUT", { userId, className: "x".repeat(51) }, login.token))).status, 400);
    const now = Date.now();
    mock.method(Date, "now", () => now + 8 * 60 * 60 * 1000 + 1000);
    assert.equal(verifyTeacherSession(login.token), null);
  } finally {
    globalThis.fetch = originalFetch;
    mock.restoreAll();
    for (const [key, value] of Object.entries(savedEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
