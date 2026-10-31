import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { JWT, OAuth2Client } from "google-auth-library";
import teacherApi from "../api/teacher.mjs";

const origin = "https://s6802041510015-cpu.github.io";
const userId = `U${"a".repeat(32)}`;
const heading = ["LINE User ID", ...Array(10).fill(""), "รหัสนักเรียน", "ชื่อ-นามสกุล", "เลขที่", "ชั้นที่นักเรียนระบุ"];
const progress = {
  version: 1,
  completedLessons: ["00"],
  assessments: { pre: null, post: null },
  codeLabCompleted: [],
  workshopChecked: [],
};
const request = (method = "GET", body, token = "google-token") =>
  new Request("https://example.vercel.app/api/teacher", {
    method,
    headers: {
      Origin: origin,
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

test("teacher API requires configured Google login", async () => {
  const response = await teacherApi.fetch(request());
  assert.equal(response.status, 503);
});

test("teacher API verifies allowlisted account, returns students, and updates only class column", async () => {
  const savedEnv = Object.fromEntries(
    [
      "GOOGLE_OAUTH_CLIENT_ID",
      "TEACHER_EMAILS",
      "GOOGLE_SHEET_ID",
      "GOOGLE_SERVICE_ACCOUNT_JSON",
    ].map((key) => [key, process.env[key]]),
  );
  const originalFetch = globalThis.fetch;
  process.env.GOOGLE_OAUTH_CLIENT_ID =
    "teacher-client.apps.googleusercontent.com";
  process.env.TEACHER_EMAILS = "teacher@example.com";
  process.env.GOOGLE_SHEET_ID = "testspreadsheetid0123456789";
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: "robot@example.iam.gserviceaccount.com",
    private_key: "test",
  });
  let email = "other@example.com";
  mock.method(OAuth2Client.prototype, "verifyIdToken", async ({ audience }) => {
    assert.equal(audience, process.env.GOOGLE_OAUTH_CLIENT_ID);
    return {
      getPayload: () => ({
        sub: "google-user",
        email,
        email_verified: true,
        name: "Teacher",
      }),
    };
  });
  mock.method(JWT.prototype, "getAccessToken", async () => ({
    token: "sheets-token",
  }));
  const rows = [
    [
      userId,
      "Student",
      "",
      "",
      "",
      1,
      "00",
      0,
      0,
      "2026-10-29T00:00:00.000Z",
      JSON.stringify(progress),
    ],
  ];
  let classWrite;
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    if (path.includes("fields=sheets.properties.title"))
      return Response.json({ sheets: [{ properties: { title: "Students" } }] });
    if (path.includes("A1%3AO1"))
      return Response.json({ values: [heading] });
    if (path.includes("A2%3AO")) return Response.json({ values: rows });
    if (options.method === "PUT") {
      classWrite = { path, body: JSON.parse(options.body) };
      return Response.json({ updatedRows: 1 });
    }
    throw new Error(`Unexpected request: ${path}`);
  };
  try {
    assert.equal((await teacherApi.fetch(request())).status, 403);
    email = "teacher@example.com";
    const listResponse = await teacherApi.fetch(request());
    assert.equal(listResponse.status, 200);
    const list = await listResponse.json();
    assert.equal(list.teacher.email, email);
    assert.deepEqual(list.students[0].progress, progress);
    const updateResponse = await teacherApi.fetch(
      request("PUT", { userId, className: "ปวช.1/1" }),
    );
    assert.equal(updateResponse.status, 200);
    assert.match(classWrite.path, /C2/);
    assert.deepEqual(classWrite.body.values, [["ปวช.1/1"]]);
    assert.equal(classWrite.body.range, "'Students'!C2");
    assert.equal(
      (
        await teacherApi.fetch(
          request("PUT", { userId, className: "x".repeat(51) }),
        )
      ).status,
      400,
    );
  } finally {
    globalThis.fetch = originalFetch;
    mock.restoreAll();
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
