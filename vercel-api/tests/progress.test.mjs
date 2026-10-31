import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { JWT } from "google-auth-library";
import progressApi from "../api/progress.mjs";
import { normalizeProgress } from "../lib/progress-schema.mjs";
import { readProgress, writeProgress } from "../lib/google-sheets.mjs";

const userId = `U${"a".repeat(32)}`;
const empty = { version: 1, completedLessons: [], assessments: { pre: null, post: null }, codeLabCompleted: [], workshopChecked: [] };
const heading = ["LINE User ID", ...Array(10).fill(""), "รหัสนักเรียน", "ชื่อ-นามสกุล", "เลขที่", "ชั้นที่นักเรียนระบุ"];

test("progress schema keeps known IDs and rejects a post-test without prerequisites", () => {
  assert.deepEqual(normalizeProgress({ ...empty, completedLessons: ["00", "00", "fake"], codeLabCompleted: ["heading", "unknown"] }), {
    ...empty, completedLessons: ["00"], codeLabCompleted: ["heading"],
  });
  const result = { kind: "post", score: 0, total: 12, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0 } };
  assert.throws(() => normalizeProgress({ ...empty, assessments: { ...empty.assessments, post: result } }), /prerequisites/);
});

test("progress API rejects unknown origins and reports missing Sheets setup", async () => {
  const blocked = await progressApi.fetch(new Request("https://api.example.com/api/progress", { headers: { Origin: "https://other.example" } }));
  assert.equal(blocked.status, 403);
  const missing = await progressApi.fetch(new Request("https://api.example.com/api/progress", { headers: { Origin: "https://s6802041510015-cpu.github.io" } }));
  assert.equal(missing.status, 503);
});

test("Google Sheets update preserves a teacher-assigned class and uses RAW values", async () => {
  const previousFetch = globalThis.fetch;
  const previousId = process.env.GOOGLE_SHEET_ID;
  const previousCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  process.env.GOOGLE_SHEET_ID = "testspreadsheetid0123456789";
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "robot@example.iam.gserviceaccount.com", private_key: "test" });
  mock.method(JWT.prototype, "getAccessToken", async () => ({ token: "test-token" }));
  let update;
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    if (options.method === "POST" && path.includes("values:batchUpdate")) { update = { url: path, options }; return Response.json({ totalUpdatedRows: 1 }); }
    if (path.includes("fields=sheets.properties.title")) return Response.json({ sheets: [{ properties: { title: "Students" } }] });
    if (path.includes("A1%3AO1")) return Response.json({ values: [heading] });
    if (path.includes("A2%3AO")) return Response.json({ values: [[userId, "Old name", "ปวช.1/1", "", "", 0, "", 0, 0, "", JSON.stringify(empty)]] });
    throw new Error(`Unexpected request: ${path}`);
  };
  try {
    await writeProgress({ userId, displayName: "New name" }, { ...empty, completedLessons: ["00"] });
    const body = JSON.parse(update.options.body);
    assert.equal(body.valueInputOption, "RAW");
    assert.deepEqual(body.data[0].values[0], [userId, "New name"]);
    assert.equal(body.data[0].range, "'Students'!A2:B2");
    assert.equal(body.data[1].range, "'Students'!D2:K2");
    assert.equal(body.data[1].values[0][2], 1);
    assert.equal(update.options.headers.Authorization, "Bearer test-token");
  } finally {
    globalThis.fetch = previousFetch;
    mock.restoreAll();
    if (previousId === undefined) delete process.env.GOOGLE_SHEET_ID; else process.env.GOOGLE_SHEET_ID = previousId;
    if (previousCredentials === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON; else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = previousCredentials;
  }
});

test("saved progress loads for the same LINE user and stays separate from another user", async () => {
  const previousFetch = globalThis.fetch;
  const previousId = process.env.GOOGLE_SHEET_ID;
  const previousCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  process.env.GOOGLE_SHEET_ID = "testspreadsheetid0123456789";
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({ client_email: "robot@example.iam.gserviceaccount.com", private_key: "test" });
  mock.method(JWT.prototype, "getAccessToken", async () => ({ token: "test-token" }));
  const rows = [];
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.includes("fields=sheets.properties.title")) return Response.json({ sheets: [{ properties: { title: "Students" } }] });
    if (path.includes("A1%3AO1")) return Response.json({ values: [heading] });
    if (path.includes("A2%3AO") && !options.method) return Response.json({ values: rows });
    if (options.method === "POST" && path.includes(":append")) {
      rows.push(JSON.parse(options.body).values[0]);
      return Response.json({ updates: { updatedRows: 1 } });
    }
    if (options.method === "POST" && path.includes("values:batchUpdate")) {
      for (const entry of JSON.parse(options.body).data) {
        const [, column, number] = /!([AD])(\d+):/.exec(entry.range);
        rows[Number(number) - 2].splice(column === "A" ? 0 : 3, entry.values[0].length, ...entry.values[0]);
      }
      return Response.json({ totalUpdatedRows: 1 });
    }
    throw new Error(`Unexpected request: ${path}`);
  };
  try {
    const otherUserId = `U${"b".repeat(32)}`;
    const firstProgress = { ...empty, completedLessons: ["00", "01"] };
    const secondProgress = { ...empty, codeLabCompleted: ["heading"] };
    await writeProgress({ userId, displayName: "Student A" }, firstProgress);
    assert.deepEqual(await readProgress(userId), firstProgress);
    assert.equal(await readProgress(otherUserId), null);
    await writeProgress({ userId: otherUserId, displayName: "Student B" }, secondProgress);
    rows[0][2] = "ปวช.1/1";
    await writeProgress({ userId, displayName: "Student A" }, firstProgress);
    assert.equal(rows[0][2], "ปวช.1/1");
    assert.deepEqual(await readProgress(userId), firstProgress);
    assert.deepEqual(await readProgress(otherUserId), secondProgress);
    assert.equal(rows.length, 2);
  } finally {
    globalThis.fetch = previousFetch;
    mock.restoreAll();
    if (previousId === undefined) delete process.env.GOOGLE_SHEET_ID; else process.env.GOOGLE_SHEET_ID = previousId;
    if (previousCredentials === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON; else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = previousCredentials;
  }
});
