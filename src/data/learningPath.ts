import { Blocks, Code2, Globe2, Puzzle, Rocket, Tags } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { lessons, objectives } from "./lessons";
import type { ObjectiveId } from "./types";

export type LessonStatus = "completed" | "current" | "available" | "locked";
export type LearningPathItem = {
  id: string;
  number: string;
  title: string;
  icon: LucideIcon;
  objective?: ObjectiveId;
};

const icons: LucideIcon[] = [Globe2, Code2, Puzzle, Blocks, Tags, Rocket];

export const learningPath: LearningPathItem[] = lessons.map(
  (lesson, index) => ({
    id: lesson.id,
    number: lesson.id,
    title: lesson.title,
    icon: icons[index],
    objective: lesson.objective,
  }),
);

export function objectiveLabel(id: ObjectiveId): string {
  return `วัตถุประสงค์ที่ ${id}: ${objectives[id]}`;
}
