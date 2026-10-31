import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const workFactor = { N: 16384, r: 8, p: 5, maxmem: 64 * 1024 * 1024 };
const sessionSeconds = 8 * 60 * 60;

function configuredUsername() {
  return process.env.TEACHER_USERNAME?.trim().normalize("NFKC").toLowerCase() ?? "";
}

function passwordParts() {
  const match = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([a-f0-9]{32})\$([a-f0-9]{128})$/i.exec(process.env.TEACHER_PASSWORD_HASH ?? "");
  if (!match) return null;
  const [, n, r, p, salt, hash] = match;
  if (Number(n) !== workFactor.N || Number(r) !== workFactor.r || Number(p) !== workFactor.p) return null;
  return { salt, hash: Buffer.from(hash, "hex") };
}

export function teacherAuthConfigured() {
  return Boolean(configuredUsername() && passwordParts() && (process.env.TEACHER_SESSION_SECRET?.length ?? 0) >= 32);
}

export async function createTeacherPasswordHash(password) {
  if (typeof password !== "string" || password.length < 16 || password.length > 256) throw new Error("Password must be 16-256 characters");
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, Buffer.from(salt, "hex"), 64, workFactor);
  return `scrypt$${workFactor.N}$${workFactor.r}$${workFactor.p}$${salt}$${hash.toString("hex")}`;
}

export async function verifyTeacherCredentials(username, password) {
  const parts = passwordParts();
  if (!parts || typeof username !== "string" || typeof password !== "string" || password.length > 256) return null;
  const actual = await scrypt(password, Buffer.from(parts.salt, "hex"), 64, workFactor);
  const nameMatches = username.trim().normalize("NFKC").toLowerCase() === configuredUsername();
  return nameMatches && timingSafeEqual(actual, parts.hash) ? { name: process.env.TEACHER_USERNAME.trim() } : null;
}

function signature(payload) {
  return createHmac("sha256", process.env.TEACHER_SESSION_SECRET).update(payload).digest();
}

export function createTeacherSession() {
  if (!teacherAuthConfigured()) throw new Error("Teacher authentication is not configured");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: configuredUsername(), iat: now, exp: now + sessionSeconds })).toString("base64url");
  return { token: `${payload}.${signature(payload).toString("base64url")}`, expiresAt: new Date((now + sessionSeconds) * 1000).toISOString() };
}

export function verifyTeacherSession(token) {
  if (!teacherAuthConfigured() || typeof token !== "string" || token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  const [encoded, supplied] = token.split(".");
  const expected = signature(encoded);
  const actual = Buffer.from(supplied, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (data.sub !== configuredUsername() || !Number.isInteger(data.iat) || !Number.isInteger(data.exp) || data.iat > now + 30 || data.exp <= now || data.exp - data.iat !== sessionSeconds) return null;
    return { name: process.env.TEACHER_USERNAME.trim() };
  } catch { return null; }
}
