import { JWT } from "google-auth-library";
import { createHash } from "node:crypto";
import { emptyProgress, normalizeProgress } from "./progress-schema.mjs";

const tab = "Students";
const headers = ["LINE User ID", "ชื่อ LINE", "ห้องเรียน", "ก่อนเรียน", "หลังเรียน", "บทที่เรียนจบ", "รหัสบท", "Code Lab", "Workshop", "อัปเดตล่าสุด", "ข้อมูลระบบ", "รหัสนักเรียน", "ชื่อ-นามสกุล", "เลขที่", "ชั้นที่นักเรียนระบุ"];
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
  const heading = await sheets(`${range("A1:O1")}?valueRenderOption=UNFORMATTED_VALUE`);
  if (heading.values?.[0]?.[0] !== headers[0]) {
    await sheets(`${range("A1:O1")}?valueInputOption=RAW`, {
      method: "PUT", body: JSON.stringify({ range: `'${tab}'!A1:O1`, majorDimension: "ROWS", values: [headers] }),
    });
  } else if (headers.slice(11).some((value, index) => heading.values?.[0]?.[index + 11] !== value)) {
    await sheets(`${range("L1:O1")}?valueInputOption=RAW`, {
      method: "PUT", body: JSON.stringify({ range: `'${tab}'!L1:O1`, majorDimension: "ROWS", values: [headers.slice(11)] }),
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
  const result = await sheets(`${range("A2:O")}?valueRenderOption=UNFORMATTED_VALUE`);
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
  return index < 0 || !all[index][10] ? null : rowProgress(all[index]);
}

function registrationFromRow(row) {
  if (!row?.[11] || !row?.[12] || !row?.[13] || !row?.[14]) return null;
  return {
    studentId: String(row[11]), fullName: String(row[12]),
    number: String(row[13]), className: String(row[14]),
  };
}

export function normalizeRegistration(input) {
  const studentId = typeof input?.studentId === "string" ? input.studentId.trim() : "";
  const rawName = typeof input?.fullName === "string" ? input.fullName.trim() : "";
  const fullName = rawName.replace(/ +/g, " ");
  const number = typeof input?.number === "string" ? input.number.trim() : "";
  const className = typeof input?.className === "string" ? input.className.trim() : "";
  if (!/^\d{5,20}$/.test(studentId) || fullName.length < 2 || fullName.length > 100 || /[\r\n\t]/.test(rawName) ||
      !/^\d{1,3}$/.test(number) || Number(number) < 1 || className.length < 2 || className.length > 50 || /[\r\n\t]/.test(className)) {
    throw new Error("INVALID_REGISTRATION");
  }
  return { studentId, fullName, number, className };
}

export async function readStudentRegistration(userId) {
  const all = await rows();
  return registrationFromRow(all.find((row) => row[0] === userId));
}

export async function registerStudent(user, input) {
  const registration = normalizeRegistration(input);
  const all = await rows();
  const index = all.findIndex((row) => row[0] === user.userId);
  const existing = registrationFromRow(all[index]);
  if (existing) return existing;
  if (all.some((row, rowIndex) => rowIndex !== index && String(row[11] ?? "") === registration.studentId)) {
    throw new Error("STUDENT_ID_TAKEN");
  }
  if (index >= 0) {
    const rowNumber = index + 2;
    const data = [
      { range: `'${tab}'!A${rowNumber}:B${rowNumber}`, majorDimension: "ROWS", values: [[user.userId, user.displayName]] },
      { range: `'${tab}'!L${rowNumber}:O${rowNumber}`, majorDimension: "ROWS", values: [[registration.studentId, registration.fullName, registration.number, registration.className]] },
    ];
    if (!all[index][2]) data.push({ range: `'${tab}'!C${rowNumber}`, majorDimension: "ROWS", values: [[registration.className]] });
    await sheets("/values:batchUpdate", { method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data }) });
  } else {
    await sheets(`${range("A:O")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: "POST", body: JSON.stringify({ range: `'${tab}'!A:O`, majorDimension: "ROWS", values: [[
        user.userId, user.displayName, registration.className,
        "", "", "", "", "", "", "", "",
        registration.studentId, registration.fullName, registration.number, registration.className,
      ]] }),
    });
  }
  return registration;
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
      studentId: String(row[11] ?? ""),
      fullName: String(row[12] ?? ""),
      number: String(row[13] ?? ""),
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

export async function createClassSheet(className) {
  const name = typeof className === "string" ? className.trim() : "";
  if (!name || name.length > 50 || /[\x00-\x1f\x7f]/.test(name)) throw new Error("INVALID_CLASS_NAME");
  const all = await rows();
  if (!all.some((row) => String(row[2] ?? "").trim() === name)) return null;

  const safeName = name.replace(/[\\/?*\[\]:'"]/g, "-").replace(/\s+/g, " ").slice(0, 65);
  const suffix = createHash("sha256").update(name).digest("hex").slice(0, 8);
  const title = `ห้อง ${safeName}-${suffix}`;
  const findTab = async () => (await sheets("?fields=sheets.properties"))
    .sheets?.find((sheet) => sheet.properties?.title === title)?.properties;

  let properties = await findTab();
  const created = !properties;
  if (!properties) {
    try {
      const added = await sheets(":batchUpdate", {
        method: "POST",
        body: JSON.stringify({ requests: [{ addSheet: { properties: {
          title,
          gridProperties: { rowCount: 2000, columnCount: headers.length, frozenRowCount: 1 },
        } } }] }),
      });
      properties = added.replies?.[0]?.addSheet?.properties ?? await findTab();
    } catch (error) {
      // Another request may have created the tab at the same time.
      properties = await findTab();
      if (!properties) throw error;
    }
  }
  if (!Number.isInteger(properties?.sheetId)) throw new Error("Class sheet ID unavailable");

  const formula = `=IFNA(FILTER(Students!A2:O,Students!C2:C="${name.replace(/"/g, '""')}"),"")`;
  await sheets("/values:batchUpdate", {
    method: "POST",
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: [
      { range: `'${title}'!A1:O1`, majorDimension: "ROWS", values: [headers] },
      { range: `'${title}'!A2`, majorDimension: "ROWS", values: [[formula]] },
    ] }),
  });
  return {
    title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId()}/edit#gid=${properties.sheetId}`,
    created,
  };
}
