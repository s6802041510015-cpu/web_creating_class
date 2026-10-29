import { codeLabPractices } from "../data/codeLabPractices";
import { projectChecklist, projectWorkflow } from "../data/finalProject";
import { htmlStructureCode } from "../data/lessons";

export const codeLabStorageKey = "webquest-code-lab-v2";
export const workshopStorageKey = "webquest-workshop-v1";
export const workshopFiles = ["page1.html", "page2.html", "page3.html"] as const;

export type WorkshopDraft = {
  codes: Record<string, string>;
  checked: string[];
  activePage: number;
  activeStep: number;
};

export function readWorkshopDraft(): WorkshopDraft {
  const codes = Object.fromEntries(workshopFiles.map((file) => [file, htmlStructureCode]));
  const initial: WorkshopDraft = { codes, checked: [], activePage: 0, activeStep: 0 };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(workshopStorageKey) ?? "null");
    if (!saved || typeof saved !== "object") return initial;
    const draft = saved as Partial<WorkshopDraft>;
    for (const file of workshopFiles) {
      if (typeof draft.codes?.[file] === "string") codes[file] = draft.codes[file];
    }
    const validChecks = new Set(projectChecklist.map((item) => item.id));
    return {
      codes,
      checked: Array.isArray(draft.checked)
        ? [...new Set(draft.checked.filter((id): id is string => typeof id === "string" && validChecks.has(id)))]
        : [],
      activePage: Number.isInteger(draft.activePage) && draft.activePage! >= 0 && draft.activePage! < workshopFiles.length ? draft.activePage! : 0,
      activeStep: Number.isInteger(draft.activeStep) && draft.activeStep! >= 0 && draft.activeStep! < projectWorkflow.length ? draft.activeStep! : 0,
    };
  } catch {
    return initial;
  }
}

export function readCodeLabCompletedCount(): number {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(codeLabStorageKey) ?? "null");
    if (!saved || typeof saved !== "object") return 0;
    const validIds = new Set<string>(codeLabPractices.map((item) => item.id));
    const completed = (saved as { completed?: unknown }).completed;
    return Array.isArray(completed)
      ? new Set(completed.filter((id): id is string => typeof id === "string" && validIds.has(id))).size
      : 0;
  } catch {
    return 0;
  }
}

export function readWorkshopSummary() {
  const draft = readWorkshopDraft();
  const editedPages = workshopFiles.filter((file) => draft.codes[file] !== htmlStructureCode).length;
  return { editedPages, checkedCount: draft.checked.length };
}
