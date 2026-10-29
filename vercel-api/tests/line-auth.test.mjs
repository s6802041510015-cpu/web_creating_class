import test from "node:test";
import assert from "node:assert/strict";
import lineAuth from "../api/auth/line.mjs";

const origin = "https://s6802041510015-cpu.github.io";
const channelId = "2000000000";
const idToken = "a".repeat(120);
const userId = `U${"a".repeat(32)}`;
const request = (body, requestOrigin = origin) => new Request("https://api.example.com/api/auth/line", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: requestOrigin },
  body: JSON.stringify(body),
});

test("rejects unknown web origins and missing LINE configuration", async () => {
  const previous = process.env.LINE_CHANNEL_ID;
  delete process.env.LINE_CHANNEL_ID;
  try {
    assert.equal((await lineAuth.fetch(request({ idToken }, "https://other.example"))).status, 403);
    assert.equal((await lineAuth.fetch(request({ idToken }))).status, 503);
  } finally {
    if (previous === undefined) delete process.env.LINE_CHANNEL_ID;
    else process.env.LINE_CHANNEL_ID = previous;
  }
});

test("verifies raw ID token with LINE and returns only verified identity", async () => {
  const previousChannel = process.env.LINE_CHANNEL_ID;
  const previousFetch = globalThis.fetch;
  process.env.LINE_CHANNEL_ID = channelId;
  let outgoing;
  globalThis.fetch = async (url, options) => {
    outgoing = { url, options };
    return Response.json({ aud: channelId, sub: userId, name: "ผู้เรียนตัวอย่าง", email: "hidden@example.com" });
  };
  try {
    const response = await lineAuth.fetch(request({ idToken, userId: "fake" }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
    assert.deepEqual(await response.json(), { user: { userId, displayName: "ผู้เรียนตัวอย่าง" } });
    assert.equal(outgoing.url, "https://api.line.me/oauth2/v2.1/verify");
    const form = new URLSearchParams(outgoing.options.body);
    assert.equal(form.get("id_token"), idToken);
    assert.equal(form.get("client_id"), channelId);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousChannel === undefined) delete process.env.LINE_CHANNEL_ID;
    else process.env.LINE_CHANNEL_ID = previousChannel;
  }
});

test("does not trust an ID token for another LINE channel", async () => {
  const previousChannel = process.env.LINE_CHANNEL_ID;
  const previousFetch = globalThis.fetch;
  process.env.LINE_CHANNEL_ID = channelId;
  globalThis.fetch = async () => Response.json({ aud: "another-channel", sub: userId });
  try {
    const response = await lineAuth.fetch(request({ idToken }));
    assert.equal(response.status, 401);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousChannel === undefined) delete process.env.LINE_CHANNEL_ID;
    else process.env.LINE_CHANNEL_ID = previousChannel;
  }
});
