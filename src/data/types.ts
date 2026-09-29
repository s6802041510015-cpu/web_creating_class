export type ObjectiveId = 1 | 2 | 3 | 4 | 5;

export type Example = { label: string; code: string };
export type QuickCheck = { question: string; expectedConcept: string };
export type LessonSection = {
  title: string;
  paragraphs: string[];
  example?: Example;
};
export type Lesson = {
  id: string;
  title: string;
  kind: "preparation" | "knowledge" | "project";
  objective?: ObjectiveId;
  intro: string[];
  learn: LessonSection[];
  examples: Example[];
  quickCheck?: QuickCheck;
  summary: string[];
};

export type Choice = { id: "ก" | "ข" | "ค" | "ง"; text: string };
export type Question = {
  id: number;
  objective: 1 | 2 | 3 | 4;
  prompt: string;
  choices: Choice[];
  correctChoice: Choice["id"];
};
export type AssessmentKind = "pre" | "post";
export type AssessmentResult = {
  kind: AssessmentKind;
  score: number;
  total: number;
  breakdown: Record<1 | 2 | 3 | 4, number>;
};

export type ChecklistItem = { id: string; label: string };
export type FinalProjectPage = {
  id: string;
  title: string;
  heading: string;
  requirements: string[];
};
