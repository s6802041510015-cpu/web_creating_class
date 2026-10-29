const lessonIds = new Set(["00", "01", "02", "03", "04", "05"]);
const labIds = new Set(["heading", "paragraph", "image", "link", "list"]);
const checklistIds = new Set([
  "pages", "structure", "intro-information", "intro-image", "hobbies-three",
  "hobbies-detail", "hobbies-image", "more-information", "contact",
  "external-link", "internal-links", "tags",
]);

function ids(value, allowed) {
  return Array.isArray(value)
    ? [...new Set(value.filter((id) => typeof id === "string" && allowed.has(id)))]
    : [];
}

function assessment(value, kind) {
  if (!value || typeof value !== "object" || value.kind !== kind || value.total !== 12) return null;
  if (!Number.isInteger(value.score) || value.score < 0 || value.score > 12) return null;
  const breakdown = value.breakdown;
  if (!breakdown || ![1, 2, 3, 4].every((id) => Number.isInteger(breakdown[id]) && breakdown[id] >= 0 && breakdown[id] <= 3)) return null;
  if ([1, 2, 3, 4].reduce((sum, id) => sum + breakdown[id], 0) !== value.score) return null;
  return { kind, score: value.score, total: 12, breakdown: { 1: breakdown[1], 2: breakdown[2], 3: breakdown[3], 4: breakdown[4] } };
}

export function normalizeProgress(input) {
  if (!input || typeof input !== "object" || input.version !== 1) throw new Error("Invalid progress version");
  const progress = {
    version: 1,
    completedLessons: ids(input.completedLessons, lessonIds),
    assessments: {
      pre: assessment(input.assessments?.pre, "pre"),
      post: assessment(input.assessments?.post, "post"),
    },
    codeLabCompleted: ids(input.codeLabCompleted, labIds),
    workshopChecked: ids(input.workshopChecked, checklistIds),
  };
  if (progress.assessments.post && (!progress.assessments.pre || progress.completedLessons.length !== lessonIds.size)) {
    throw new Error("Post-test prerequisites are incomplete");
  }
  return progress;
}

export function emptyProgress() {
  return normalizeProgress({ version: 1 });
}
