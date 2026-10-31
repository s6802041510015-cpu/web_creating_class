import { JWT } from "google-auth-library";
import { listStudents, normalizeRegistration, readStudentRegistration } from "./google-sheets.mjs";

const profileTab = "LeaveStudents";
const requestTab = "LeaveRequests";
const profileHeaders = ["LINE User ID", "รหัสนักเรียน", "ชื่อ-นามสกุล", "เลขที่", "ห้องเรียน", "อัปเดตล่าสุด"];
const requestHeaders = [
  "รหัสคำขอ", "LINE User ID", "รหัสนักเรียน", "ชื่อ-นามสกุล", "เลขที่", "ห้องเรียน",
  "ประเภท", "วันที่เริ่ม", "วันที่สิ้นสุด", "ช่วงเวลา", "เหตุผล", "สถานะ",
  "ส่งคำขอเมื่อ", "พิจารณาเมื่อ", "ครูผู้พิจารณา", "เหตุผลจากครู",
  "เวลาเริ่ม", "เวลาสิ้นสุด",
];
let authClient;
let initialization;

function spreadsheetId() {
  const id = process.env.LEAVE_GOOGLE_SHEET_ID?.trim();
  if (!id || !/^[A-Za-z0-9_-]{20,}$/.test(id)) throw new Error("LEAVE_GOOGLE_SHEET_ID is not configured");
  return id;
}

async function accessToken() {
  if (!authClient) {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
    const credentials = JSON.parse(raw);
    authClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  const result = await authClient.getAccessToken();
  if (!result.token) throw new Error("Google access token unavailable");
  return result.token;
}

async function sheets(path, options = {}) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Leave Google Sheets API ${response.status}`);
  return response.json();
}

const range = (tab, a1) => `/values/${encodeURIComponent(`'${tab}'!${a1}`)}`;

async function setupSheet() {
  const metadata = await sheets("?fields=sheets.properties.title");
  for (const [title, headers] of [[profileTab, profileHeaders], [requestTab, requestHeaders]]) {
    if (!metadata.sheets?.some((sheet) => sheet.properties?.title === title)) {
      try {
        await sheets(":batchUpdate", { method: "POST", body: JSON.stringify({
          requests: [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }],
        }) });
      } catch (error) {
        const refreshed = await sheets("?fields=sheets.properties.title");
        if (!refreshed.sheets?.some((sheet) => sheet.properties?.title === title)) throw error;
      }
    }
    const last = title === profileTab ? "F" : "R";
    const heading = await sheets(`${range(title, `A1:${last}1`)}?valueRenderOption=UNFORMATTED_VALUE`);
    if (headers.some((value, index) => heading.values?.[0]?.[index] !== value)) {
      await sheets(`${range(title, `A1:${last}1`)}?valueInputOption=RAW`, {
        method: "PUT",
        body: JSON.stringify({ range: `'${title}'!A1:${last}1`, majorDimension: "ROWS", values: [headers] }),
      });
    }
  }
}

async function initialize() {
  if (!initialization) initialization = setupSheet().catch((error) => { initialization = undefined; throw error; });
  await initialization;
}

async function readRows(tab, last) {
  await initialize();
  const result = await sheets(`${range(tab, `A2:${last}`)}?valueRenderOption=UNFORMATTED_VALUE`);
  return result.values ?? [];
}

const profileFromRow = (row) => row?.[0] ? ({
  studentId: String(row[1] ?? ""), fullName: String(row[2] ?? ""),
  number: String(row[3] ?? ""), className: String(row[4] ?? ""),
}) : null;

export async function getLeaveProfile(userId) {
  const profiles = await readRows(profileTab, "F");
  const saved = profileFromRow(profiles.find((row) => row[0] === userId));
  if (saved) return saved;
  // Existing learners can use their registration without opening the learning website.
  if (!process.env.GOOGLE_SHEET_ID) return null;
  return readStudentRegistration(userId);
}

async function persistProfile(userId, profile) {
  const rows = await readRows(profileTab, "F");
  if (rows.some((row) => row[0] === userId)) return;
  if (rows.some((row) => row[0] !== userId && String(row[1] ?? "") === profile.studentId))
    throw new Error("STUDENT_ID_TAKEN");
  if (process.env.GOOGLE_SHEET_ID) {
    const existing = await listStudents();
    if (existing.some((student) => student.userId !== userId && student.studentId === profile.studentId))
      throw new Error("STUDENT_ID_TAKEN");
  }
  await sheets(`${range(profileTab, "A:F")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ range: `'${profileTab}'!A:F`, majorDimension: "ROWS", values: [[
      userId, profile.studentId, profile.fullName, profile.number, profile.className, new Date().toISOString(),
    ]] }),
  });
}

function dateValue(input) {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const date = new Date(`${input}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === input ? date : null;
}

export function normalizeLeave(input) {
  const type = typeof input?.type === "string" ? input.type.trim() : "";
  const startDate = typeof input?.startDate === "string" ? input.startDate : "";
  const endDate = typeof input?.endDate === "string" ? input.endDate : "";
  const period = typeof input?.period === "string" ? input.period : "";
  const startTime = typeof input?.startTime === "string" ? input.startTime : "";
  const endTime = typeof input?.endTime === "string" ? input.endTime : "";
  const reason = typeof input?.reason === "string" ? input.reason.trim() : "";
  const start = dateValue(startDate);
  const end = dateValue(endDate);
  if (!["sick", "personal", "other"].includes(type) || !start || !end ||
      end < start || end.getTime() - start.getTime() > 29 * 86400000 ||
      !["full", "morning", "afternoon", "custom"].includes(period) ||
      (period !== "full" && startDate !== endDate) ||
      (period === "custom" && (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(startTime) ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime)) ||
      reason.length < 5 || reason.length > 1000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(reason)) {
    throw new Error("INVALID_LEAVE");
  }
  return { type, startDate, endDate, period, reason,
    startTime: period === "custom" ? startTime : "", endTime: period === "custom" ? endTime : "" };
}

function requestFromRow(row) {
  return {
    id: String(row[0] ?? ""), userId: String(row[1] ?? ""), studentId: String(row[2] ?? ""),
    fullName: String(row[3] ?? ""), number: String(row[4] ?? ""), className: String(row[5] ?? ""),
    type: String(row[6] ?? ""), startDate: String(row[7] ?? ""), endDate: String(row[8] ?? ""),
    period: String(row[9] ?? ""), reason: String(row[10] ?? ""), status: String(row[11] ?? ""),
    submittedAt: String(row[12] ?? ""), reviewedAt: String(row[13] ?? ""),
    reviewer: String(row[14] ?? ""), teacherReason: String(row[15] ?? ""),
    startTime: String(row[16] ?? ""), endTime: String(row[17] ?? ""),
  };
}

export async function listLeaveRequests(userId) {
  const rows = await readRows(requestTab, "R");
  return rows.filter((row) => row[0] && (!userId || row[1] === userId))
    .map(requestFromRow).reverse();
}

export async function createLeaveRequest(user, input) {
  const leave = normalizeLeave(input);
  const requestKey = typeof input?.requestKey === "string" ? input.requestKey : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey))
    throw new Error("INVALID_LEAVE");
  const existing = (await listLeaveRequests(user.userId)).find((item) => item.id === requestKey);
  if (existing) return { request: existing, created: false };
  const all = await readRows(requestTab, "R");
  if (all.some((row) => row[0] === requestKey)) throw new Error("INVALID_LEAVE");
  const profile = await getLeaveProfile(user.userId) ?? normalizeRegistration(input?.profile);
  await persistProfile(user.userId, profile);
  const submittedAt = new Date().toISOString();
  const id = requestKey;
  await sheets(`${range(requestTab, "A:R")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ range: `'${requestTab}'!A:R`, majorDimension: "ROWS", values: [[
      id, user.userId, profile.studentId, profile.fullName, profile.number, profile.className,
      leave.type, leave.startDate, leave.endDate, leave.period, leave.reason, "pending",
      submittedAt, "", "", "", leave.startTime, leave.endTime,
    ]] }),
  });
  return { request: { id, userId: user.userId, ...profile, ...leave, status: "pending", submittedAt, reviewedAt: "", reviewer: "", teacherReason: "" }, created: true };
}

export async function reviewLeaveRequest(id, status, teacherReason, reviewer) {
  const rows = await readRows(requestTab, "R");
  const index = rows.findIndex((row) => row[0] === id);
  if (index < 0) return null;
  const existing = requestFromRow(rows[index]);
  if (existing.status !== "pending") return { request: existing, updated: false };
  const reviewedAt = new Date().toISOString();
  await sheets(`${range(requestTab, `L${index + 2}:P${index + 2}`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ range: `'${requestTab}'!L${index + 2}:P${index + 2}`, majorDimension: "ROWS", values: [[
      status, existing.submittedAt, reviewedAt, reviewer, teacherReason,
    ]] }),
  });
  return { request: { ...existing, status, reviewedAt, reviewer, teacherReason }, updated: true };
}

export const leaveSheetUrl = () => `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId())}/edit`;
