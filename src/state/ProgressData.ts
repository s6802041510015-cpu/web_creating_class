import { codeLabPractices } from "../data/codeLabPractices";
import { projectChecklist } from "../data/finalProject";
import { lessons } from "../data/lessons";
import { assessmentQuestions } from "../data/assessment";
import type { AssessmentKind, AssessmentResult } from "../data/types";
import { codeLabStorageKey, workshopStorageKey } from "./StudentWork";
import { assessmentStorageKey, getStudentItem, lessonStorageKey, setStudentItem } from "./StudentStorage";

export type ProgressSnapshot = {
  version: 1;
  completedLessons: string[];
  assessments: { pre: AssessmentResult | null; post: AssessmentResult | null };
  codeLabCompleted: string[];
  workshopChecked: string[];
};

function parse(raw: string | null): unknown {
  try { return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function validIds(value: unknown, allowed: string[]): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string" && allowed.includes(id)))]
    : [];
}

function validResult(value: unknown, kind: AssessmentKind): AssessmentResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Partial<AssessmentResult>;
  const total = assessmentQuestions[kind].length;
  if (result.kind !== kind || result.total !== total || !Number.isInteger(result.score) || result.score! < 0 || result.score! > total) return null;
  if (!result.breakdown || ![1, 2, 3, 4].every((id) => Number.isInteger(result.breakdown?.[id as 1 | 2 | 3 | 4]) && result.breakdown![id as 1 | 2 | 3 | 4] >= 0 && result.breakdown![id as 1 | 2 | 3 | 4] <= 3)) return null;
  if ([1, 2, 3, 4].reduce((sum, id) => sum + result.breakdown![id as 1 | 2 | 3 | 4], 0) !== result.score) return null;
  return result as AssessmentResult;
}

export function readAssessmentResults(): Partial<Record<AssessmentKind, AssessmentResult>> {
  const saved = parse(getStudentItem(assessmentStorageKey));
  if (!saved || typeof saved !== "object") return {};
  const data = saved as Record<string, unknown>;
  const pre = validResult(data.pre, "pre");
  const post = validResult(data.post, "post");
  return { ...(pre ? { pre } : {}), ...(post ? { post } : {}) };
}

function fromValues(get: (key: string) => string | null): ProgressSnapshot {
  const results = parse(get(assessmentStorageKey)) as Record<string, unknown> | null;
  const lab = parse(get(codeLabStorageKey)) as { completed?: unknown } | null;
  const workshop = parse(get(workshopStorageKey)) as { checked?: unknown } | null;
  return {
    version: 1,
    completedLessons: validIds(parse(get(lessonStorageKey)), lessons.map((lesson) => lesson.id)),
    assessments: { pre: validResult(results?.pre, "pre"), post: validResult(results?.post, "post") },
    codeLabCompleted: validIds(lab?.completed, codeLabPractices.map((item) => item.id)),
    workshopChecked: validIds(workshop?.checked, projectChecklist.map((item) => item.id)),
  };
}

export function readProgressSnapshot(): ProgressSnapshot {
  return fromValues(getStudentItem);
}

export function readLegacySnapshot(): ProgressSnapshot {
  return fromValues((key) => localStorage.getItem(key));
}

export function hasProgress(snapshot: ProgressSnapshot) {
  return snapshot.completedLessons.length > 0 || Boolean(snapshot.assessments.pre || snapshot.assessments.post) || snapshot.codeLabCompleted.length > 0 || snapshot.workshopChecked.length > 0;
}

export function importLegacyStorage() {
  for (const key of [assessmentStorageKey, lessonStorageKey, codeLabStorageKey, workshopStorageKey]) {
    const raw = localStorage.getItem(key);
    if (raw !== null) setStudentItem(key, raw, false);
  }
}

export function hydrateProgress(snapshot: ProgressSnapshot) {
  setStudentItem(lessonStorageKey, JSON.stringify(snapshot.completedLessons), false);
  setStudentItem(assessmentStorageKey, JSON.stringify(snapshot.assessments), false);
  const lab = parse(getStudentItem(codeLabStorageKey));
  const labData = lab && typeof lab === "object" ? lab as Record<string, unknown> : {};
  setStudentItem(codeLabStorageKey, JSON.stringify({ ...labData, completed: snapshot.codeLabCompleted }), false);
  const workshop = parse(getStudentItem(workshopStorageKey));
  const workshopData = workshop && typeof workshop === "object" ? workshop as Record<string, unknown> : {};
  setStudentItem(workshopStorageKey, JSON.stringify({ ...workshopData, checked: snapshot.workshopChecked }), false);
}

export function mergeProgress(remote: ProgressSnapshot, local: ProgressSnapshot): ProgressSnapshot {
  return {
    version: 1,
    completedLessons: [...new Set([...remote.completedLessons, ...local.completedLessons])],
    assessments: { pre: local.assessments.pre ?? remote.assessments.pre, post: local.assessments.post ?? remote.assessments.post },
    codeLabCompleted: [...new Set([...remote.codeLabCompleted, ...local.codeLabCompleted])],
    workshopChecked: getStudentItem(workshopStorageKey) === null ? remote.workshopChecked : local.workshopChecked,
  };
}
