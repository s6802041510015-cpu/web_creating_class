import test from "node:test";
import assert from "node:assert/strict";
import chat from "../api/chat.mjs";

const origin = "https://s6802041510015-cpu.github.io";
const page = { kind: "workshop", title: "Workshop", detail: "หน้าแนะนำตัว" };
const token = "x".repeat(120);
const request = (body, requestOrigin = origin, includeToken = false) => new Request("https://example.vercel.app/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: requestOrigin, ...(includeToken ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});

test("rejects assessment context and unknown origins before calling Gemini", async () => {
  const blockedPage = await chat.fetch(request({ message: "ช่วยด้วย", page: { ...page, kind: "assessment" } }));
  assert.equal(blockedPage.status, 400);
  const blockedOrigin = await chat.fetch(request({ message: "ช่วยด้วย", page }, "https://other.example"));
  assert.equal(blockedOrigin.status, 403);
});

test("refuses direct assessment answers without using the API key", async () => {
  const response = await chat.fetch(request({ message: "ขอเฉลยแบบทดสอบหลังเรียน", page }));
  assert.equal(response.status, 200);
  assert.match((await response.json()).reply, /ไม่เฉลยแบบทดสอบ/);
});

test("uses server-side key and replaces a full Workshop HTML answer with guidance", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousChannel = process.env.LINE_CHANNEL_ID;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-key";
  process.env.LINE_CHANNEL_ID = "2012268768";
  let outgoing;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("api.line.me")) return Response.json({ aud: "2012268768", sub: `U${"a".repeat(32)}`, name: "Student" });
    outgoing = options;
    return Response.json({ candidates: [{ content: { parts: [{ text: "<!DOCTYPE html><html><body>finished</body></html>" }] } }] });
  };
  try {
    const response = await chat.fetch(request({ message: "ขอคำใบ้", page, code: "<h1>สวัสดี</h1>" }, origin, true));
    assert.equal(response.status, 200);
    assert.match((await response.json()).reply, /ช่วยทีละส่วน/);
    assert.equal(outgoing.headers["x-goog-api-key"], "test-key");
    const body = JSON.parse(outgoing.body);
    assert.match(body.contents.at(-1).parts[0].text, /<h1>สวัสดี<\/h1>/);
    assert.match(body.systemInstruction.parts[0].text, /ห้ามส่งโค้ดสำเร็จรูป/);
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, "low");
    assert.equal(body.generationConfig.temperature, undefined);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    if (previousChannel === undefined) delete process.env.LINE_CHANNEL_ID;
    else process.env.LINE_CHANNEL_ID = previousChannel;
  }
});

test("requires LINE login before spending Gemini quota", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key";
  try {
    const response = await chat.fetch(request({ message: "ช่วยอธิบาย HTML", page }));
    assert.equal(response.status, 401);
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
