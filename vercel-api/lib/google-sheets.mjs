import { JWT } from "google-auth-library";
import { emptyProgress, normalizeProgress } from "./progress-schema.mjs";

const tab = "Students";
const headers = ["LINE User ID", "ชื่อ LINE", "ห้องเรียน", "ก่อนเรียน", "หลังเรียน", "บทที่เรียนจบ", "รหัสบท", "Code Lab", "Workshop", "อัปเดตล่าสุด", "ข้อมูลระบบ"];
let authClient;
let initialization;

function spreadsheetId() {
  const id = process.env.GOOGLE_SHEET_ID?.trim();
  if (!id || !/^[a-zA-Z0-9_-]{20,}$/.test(id)) throw new Error("GOOGLE_SHEET_ID is not configured");
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
  if (!response.ok) throw new Error(`Google Sheets API ${response.status}`);
  return response.json();
}

function range(a1) {
  return `/values/${encodeURIComponent(`'${tab}'!${a1}`)}`;
}

async function setupSheet() {
  const metadata = await sheets("?fields=sheets.properties.title");
  if (!metadata.sheets?.some((sheet) => sheet.properties?.title === tab)) {
    try {
      await sheets(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }) });
    } catch (error) {
      // A concurrent first request may already have created the tab.
      const refreshed = await sheets("?fields=sheets.properties.title");
      if (!refreshed.sheets?.some((sheet) => sheet.properties?.title === tab)) throw error;
    }
  }
  const heading = await sheets(`${range("A1:K1")}?valueRenderOption=UNFORMATTED_VALUE`);
  if (heading.values?.[0]?.[0] !== headers[0]) {
    await sheets(`${range("A1:K1")}?valueInputOption=RAW`, {
      method: "PUT", body: JSON.stringify({ range: `'${tab}'!A1:K1`, majorDimension: "ROWS", values: [headers] }),
    });
  }
}

async function initialize() {
  if (!initialization) initialization = setupSheet().catch((error) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
}

async function rows() {
  await initialize();
  const result = await sheets(`${range("A2:K")}?valueRenderOption=UNFORMATTED_VALUE`);
  return result.values ?? [];
}

function rowProgress(row) {
  if (typeof row?.[10] !== "string") return emptyProgress();
  try { return normalizeProgress(JSON.parse(row[10])); }
  catch { return emptyProgress(); }
}

export async function readProgress(userId) {
  const all = await rows();
  const index = all.findIndex((row) => row[0] === userId);
  return index < 0 ? null : rowProgress(all[index]);
}

export async function writeProgress(user, input) {
  const progress = normalizeProgress(input);
  const all = await rows();
  const index = all.findIndex((row) => row[0] === user.userId);
  const className = index < 0 ? "" : String(all[index][2] ?? "");
  const timestamp = new Date().toISOString();
  const values = [[
    user.userId, user.displayName, className,
    progress.assessments.pre?.score ?? "", progress.assessments.post?.score ?? "",
    progress.completedLessons.length, progress.completedLessons.join(", "),
    progress.codeLabCompleted.length, progress.workshopChecked.length,
    timestamp, JSON.stringify(progress),
  ]];
  if (index >= 0) {
    const rowNumber = index + 2;
    await sheets("/values:batchUpdate", {
      method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data: [
        { range: `'${tab}'!A${rowNumber}:B${rowNumber}`, majorDimension: "ROWS", values: [values[0].slice(0, 2)] },
        { range: `'${tab}'!D${rowNumber}:K${rowNumber}`, majorDimension: "ROWS", values: [values[0].slice(3)] },
      ] }),
    });
  } else {
    await sheets(`${range("A:K")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: "POST", body: JSON.stringify({ range: `'${tab}'!A:K`, majorDimension: "ROWS", values }),
    });
  }
  return progress;
}

export async function listStudents() {
  const all = await rows();
  return all.flatMap((row) => {
    if (typeof row[0] !== "string" || !row[0]) return [];
    const progress = rowProgress(row);
    return [{
      userId: row[0],
      displayName: String(row[1] ?? ""),
      className: String(row[2] ?? "").trim(),
      updatedAt: String(row[9] ?? ""),
      progress,
    }];
  });
}

export async function updateStudentClass(userId, className) {
  const all = await rows();
  const index = all.findIndex((row) => row[0] === userId);
  if (index < 0) return false;
  const rowNumber = index + 2;
  await sheets(`${range(`C${rowNumber}`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ range: `'${tab}'!C${rowNumber}`, majorDimension: "ROWS", values: [[className]] }),
  });
  return true;
}
