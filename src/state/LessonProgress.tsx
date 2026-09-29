import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { lessons } from "../data/lessons";
import type { LessonStatus } from "../data/learningPath";

const storageKey = "webquest-completed-lessons-v1";

type LessonProgressValue = {
  completedIds: string[];
  isUnlocked: (id: string) => boolean;
  statusFor: (id: string) => LessonStatus;
  completeLesson: (id: string) => void;
};

const LessonProgressContext = createContext<LessonProgressValue | null>(null);

function readCompleted(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(saved)
      ? [...new Set(saved.filter((id): id is string =>
          typeof id === "string" && lessons.some((lesson) => lesson.id === id),
        ))]
      : [];
  } catch {
    return [];
  }
}

export function LessonProgressProvider({ children }: { children: ReactNode }) {
  const [completedIds, setCompletedIds] = useState<string[]>(readCompleted);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedIds));
    } catch {
      // Learning stays usable when browser storage is unavailable.
    }
  }, [completedIds]);

  function isUnlocked(id: string): boolean {
    const index = lessons.findIndex((lesson) => lesson.id === id);
    if (index < 0) return false;
    if (index < 2) return true;
    return lessons.slice(0, index).every((lesson) => completedIds.includes(lesson.id));
  }

  function statusFor(id: string): LessonStatus {
    if (!isUnlocked(id)) return "locked";
    if (completedIds.includes(id)) return "completed";
    const firstPending = lessons.find(
      (lesson) => isUnlocked(lesson.id) && !completedIds.includes(lesson.id),
    );
    return firstPending?.id === id ? "current" : "available";
  }

  function completeLesson(id: string) {
    if (!isUnlocked(id)) return;
    setCompletedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }

  return (
    <LessonProgressContext.Provider
      value={{ completedIds, isUnlocked, statusFor, completeLesson }}
    >
      {children}
    </LessonProgressContext.Provider>
  );
}

export function useLessonProgress(): LessonProgressValue {
  const value = useContext(LessonProgressContext);
  if (!value) throw new Error("LessonProgressProvider is missing");
  return value;
}
