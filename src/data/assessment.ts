import type {
  AssessmentKind,
  AssessmentResult,
  Choice,
  Question,
} from "./types";
import { preTest } from "./preTest";
import { postTest } from "./postTest";

export const assessmentQuestions: Record<AssessmentKind, Question[]> = {
  pre: preTest,
  post: postTest,
};
export const assessmentNames: Record<AssessmentKind, string> = {
  pre: "แบบทดสอบก่อนเรียน",
  post: "แบบทดสอบหลังเรียน",
};

export function scoreAssessment(
  kind: AssessmentKind,
  answers: Record<number, Choice["id"]>,
): AssessmentResult {
  const questions = assessmentQuestions[kind];
  const breakdown: AssessmentResult["breakdown"] = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let score = 0;
  for (const question of questions) {
    if (answers[question.id] === question.correctChoice) {
      score++;
      breakdown[question.objective]++;
    }
  }
  return { kind, score, total: questions.length, breakdown };
}
