export const assessmentStorageKey = "webquest-assessment-results-v1";
export const lessonStorageKey = "webquest-completed-lessons-v1";
export const progressChangedEvent = "webquest-progress-changed";

let namespace = "";

export async function setStudentNamespace(userId: string | null) {
  if (!userId) { namespace = ""; return; }
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  namespace = `student-${Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function scopedKey(key: string) {
  return namespace ? `${namespace}:${key}` : key;
}

export function getStudentItem(key: string) {
  return localStorage.getItem(scopedKey(key));
}

export function setStudentItem(key: string, value: string, notify = true) {
  const name = scopedKey(key);
  if (localStorage.getItem(name) === value) return;
  localStorage.setItem(name, value);
  if (notify) window.dispatchEvent(new Event(progressChangedEvent));
}

export function removeStudentItem(key: string) {
  localStorage.removeItem(scopedKey(key));
}

export function getStudentMeta(key: string) {
  return localStorage.getItem(scopedKey(`meta:${key}`));
}

export function setStudentMeta(key: string, value: string) {
  localStorage.setItem(scopedKey(`meta:${key}`), value);
}

export function clearStudentMeta(key: string) {
  localStorage.removeItem(scopedKey(`meta:${key}`));
}
