import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const workFactor = { N: 16384, r: 8, p: 5, maxmem: 64 * 1024 * 1024 };
const sessionSeconds = 8 * 60 * 60;

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().normalize("NFKC").toLowerCase() : "";
}

function passwordParts(value) {
  const match = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([a-f0-9]{32})\$([a-f0-9]{128})$/i.exec(value ?? "");
  if (!match) return null;
  const [, n, r, p, salt, hash] = match;
  if (Number(n) !== workFactor.N || Number(r) !== workFactor.r || Number(p) !== workFactor.p) return null;
  return { salt, hash: Buffer.from(hash, "hex") };
}

function configuredAccounts() {
  const accounts = [];
  const primaryName = process.env.TEACHER_USERNAME?.trim() ?? "";
  const primaryHash = process.env.TEACHER_PASSWORD_HASH?.trim() ?? "";
  if (primaryName || primaryHash) {
    if (!primaryName || !primaryHash) return null;
    accounts.push({ name: primaryName, passwordHash: primaryHash });
  }

  const rawExtras = process.env.TEACHER_EXTRA_ACCOUNTS_JSON?.trim();
  if (rawExtras) {
    let extras;
    try { extras = JSON.parse(rawExtras); }
    catch { return null; }
    if (!Array.isArray(extras) || extras.length > 10) return null;
    accounts.push(...extras);
  }

  if (accounts.length === 0) return null;
  const seen = new Set();
  const configured = [];
  for (const account of accounts) {
    if (!account || typeof account.name !== "string" || typeof account.passwordHash !== "string") return null;
    const username = normalizeUsername(account.name);
    const passwordHash = account.passwordHash.trim();
    const parts = passwordParts(passwordHash);
    if (!username || username.length > 100 || /[\x00-\x1f\x7f]/.test(account.name) || seen.has(username) || !parts) return null;
    seen.add(username);
    configured.push({ name: account.name.trim(), username, passwordHash, parts });
  }
  return configured;
}

export function teacherAuthConfigured() {
  return Boolean(configuredAccounts() && (process.env.TEACHER_SESSION_SECRET?.length ?? 0) >= 32);
}

export async function createTeacherPasswordHash(password) {
  if (typeof password !== "string" || password.length < 6 || password.length > 256) throw new Error("Password must be 6-256 characters");
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, Buffer.from(salt, "hex"), 64, workFactor);
  return `scrypt$${workFactor.N}$${workFactor.r}$${workFactor.p}$${salt}$${hash.toString("hex")}`;
}

export async function verifyTeacherCredentials(username, password) {
  const accounts = configuredAccounts();
  if (!accounts || typeof username !== "string" || typeof password !== "string" || password.length > 256) return null;
  const account = accounts.find((entry) => entry.username === normalizeUsername(username));
  // Unknown usernames still perform one password derivation to limit username enumeration by timing.
  const parts = (account ?? accounts[0]).parts;
  const actual = await scrypt(password, Buffer.from(parts.salt, "hex"), 64, workFactor);
  return account && timingSafeEqual(actual, parts.hash) ? { name: account.name } : null;
}

function signature(payload) {
  return createHmac("sha256", process.env.TEACHER_SESSION_SECRET).update(payload).digest();
}

function accountVersion(account) {
  return createHmac("sha256", process.env.TEACHER_SESSION_SECRET).update(account.passwordHash).digest("base64url").slice(0, 16);
}

export function createTeacherSession(username) {
  const accounts = configuredAccounts();
  if (!accounts || !teacherAuthConfigured()) throw new Error("Teacher authentication is not configured");
  const account = accounts.find((entry) => entry.username === normalizeUsername(username));
  if (!account) throw new Error("Teacher account is not configured");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: account.username, ver: accountVersion(account), iat: now, exp: now + sessionSeconds })).toString("base64url");
  return { token: `${payload}.${signature(payload).toString("base64url")}`, expiresAt: new Date((now + sessionSeconds) * 1000).toISOString() };
}

export function verifyTeacherSession(token) {
  const accounts = configuredAccounts();
  if (!accounts || !teacherAuthConfigured() || typeof token !== "string" || token.length > 2048 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  const [encoded, supplied] = token.split(".");
  const expected = signature(encoded);
  const actual = Buffer.from(supplied, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    const account = accounts.find((entry) => entry.username === data.sub);
    if (!account || data.ver !== accountVersion(account) || !Number.isInteger(data.iat) || !Number.isInteger(data.exp) || data.iat > now + 30 || data.exp <= now || data.exp - data.iat !== sessionSeconds) return null;
    return { name: account.name };
  } catch { return null; }
}
