import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { JWT } from "google-auth-library";
import studentApi from "../api/student.mjs";
import { normalizeRegistration, readProgress } from "../lib/google-sheets.mjs";

const origin = "https://s6802041510015-cpu.github.io";
const firstUser = `U${"a".repeat(32)}`;
const secondUser = `U${"b".repeat(32)}`;
const firstToken = "x".repeat(120);
const secondToken = "y".repeat(120);
const heading = ["LINE User ID", ...Array(10).fill(""), "รหัสนักเรียน", "ชื่อ-นามสกุล", "เลขที่", "ชั้นที่นักเรียนระบุ"];
const registration = { studentId: "6802041510015", fullName: "สมชาย ใจดี", number: "12", className: "ปวช.1/1" };

function request(method = "GET", body, token = firstToken, requestOrigin = origin) {
  return new Request("https://example.vercel.app/api/student", {
    method,
    headers: { Origin: requestOrigin, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test("registration input requires identifiable fields", () => {
  assert.deepEqual(normalizeRegistration(registration), registration);
  assert.equal(normalizeRegistration({ ...registration, number: "01" }).number, "01");
  assert.throws(() => normalizeRegistration({ ...registration, studentId: "ABC" }), /INVALID_REGISTRATION/);
  assert.throws(() => normalizeRegistration({ ...registration, number: "0" }), /INVALID_REGISTRATION/);
  assert.throws(() => normalizeRegistration({ ...registration, fullName: "ทดสอบ\nสูตร" }), /INVALID_REGISTRATION/);
});

test("student API rejects unknown origins and missing LINE token", async () => {
  assert.equal((await studentApi.fetch(request("GET", undefined, null, "https://other.example"))).status, 403);
  const old = process.env.LINE_CHANNEL_ID;
  process.env.LINE_CHANNEL_ID = "2012268768";
  const oldId = process.env.GOOGLE_SHEET_ID;
  const oldCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  process.env.GOOGLE_SHEET_ID = "testspreadsheetid0123456789";
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = "{}";
  try { assert.equal((await studentApi.fetch(request("GET", undefined, null))).status, 401); }
  finally {
    if (old === undefined) delete process.env.LINE_CHANNEL_ID; else process.env.LINE_CHANNEL_ID = old;
    if (oldId === undefined) delete process.env.GOOGLE_SHEET_ID; else process.env.GOOGLE_SHEET_ID = oldId;
    if (oldCredentials === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON; else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = oldCredentials;
  }
});

test("first registration is saved once, returned on later login, and blocks duplicate student IDs", async () => {
  const savedEnv = Object.fromEntries(["LINE_CHANNEL_ID", "GOOGLE_SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_JSON"].map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  process.env.LINE_CHANNEL_ID = "2012268768";
  process.env.GOOGLE_SHEET_ID = "testspreadsheetid0123456789";
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "robot@example.iam.gserviceaccount.com", private_key: "test" });
  mock.method(JWT.prototype, "getAccessToken", async () => ({ token: "sheets-token" }));
  const rows = [];
  const writes = [];
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.includes("api.line.me")) {
      const idToken = new URLSearchParams(options.body).get("id_token");
      return Response.json({ aud: "2012268768", sub: idToken === secondToken ? secondUser : firstUser, name: "LINE Name" });
    }
    if (path.includes("fields=sheets.properties.title")) return Response.json({ sheets: [{ properties: { title: "Students" } }] });
    if (path.includes("A1%3AO1")) return Response.json({ values: [["LINE User ID"]] });
    if (path.includes("L1%3AO1") && options.method === "PUT") { writes.push(JSON.parse(options.body)); return Response.json({ updatedRows: 1 }); }
    if (path.includes("A2%3AO")) return Response.json({ values: rows });
    if (path.includes(":append") && options.method === "POST") { const body = JSON.parse(options.body); writes.push(body); rows.push(body.values[0]); return Response.json({ updates: { updatedRows: 1 } }); }
    if (path.includes("values:batchUpdate") && options.method === "POST") { const body = JSON.parse(options.body); writes.push(body); return Response.json({ totalUpdatedRows: 1 }); }
    throw new Error(`Unexpected request: ${path}`);
  };
  try {
    const initial = await studentApi.fetch(request());
    assert.equal(initial.status, 200);
    assert.equal((await initial.json()).registration, null);
    const saved = await studentApi.fetch(request("POST", registration));
    assert.equal(saved.status, 200);
    assert.deepEqual((await saved.json()).registration, registration);
    assert.equal(rows.length, 1);
    assert.equal(rows[0][0], firstUser);
    assert.equal(rows[0][2], registration.className);
    assert.deepEqual(rows[0].slice(11), [registration.studentId, registration.fullName, registration.number, registration.className]);
    assert.equal(await readProgress(firstUser), null);
    assert.equal(writes[0].range, "'Students'!L1:O1");
    assert.equal(writes[1].range, "'Students'!A:O");
    const repeat = await studentApi.fetch(request("POST", { ...registration, fullName: "เปลี่ยนชื่อ" }));
    assert.equal((await repeat.json()).registration.fullName, registration.fullName);
    assert.equal(rows.length, 1);
    const later = await studentApi.fetch(request());
    assert.deepEqual((await later.json()).registration, registration);
    assert.equal((await studentApi.fetch(request("POST", registration, secondToken))).status, 409);
    assert.equal(rows.length, 1);
    const savedProgress = JSON.stringify({ version: 1, completedLessons: ["00"], assessments: { pre: null, post: null }, codeLabCompleted: [], workshopChecked: [] });
    rows.push([secondUser, "Old LINE Name", "ปวช.2/1", "", "", 1, "00", 0, 0, "", savedProgress]);
    const migrated = await studentApi.fetch(request("POST", { ...registration, studentId: "6802041510016", className: "ปวช.2/2" }, secondToken));
    assert.equal(migrated.status, 200);
    const batch = writes.at(-1);
    assert.deepEqual(batch.data.map((entry) => entry.range), ["'Students'!A3:B3", "'Students'!L3:O3"]);
    assert.equal(rows[1][2], "ปวช.2/1");
    assert.equal(rows[1][10], savedProgress);
  } finally {
    globalThis.fetch = originalFetch;
    mock.restoreAll();
    for (const [key, value] of Object.entries(savedEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
