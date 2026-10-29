import { Route, Routes } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./pages/HomePage";
import { LessonsPage } from "./pages/LessonsPage";
import { LessonPage } from "./pages/LessonPage";
import { CodeLabPage } from "./pages/CodeLabPage";
import { WorkshopPage } from "./pages/WorkshopPage";
import { AssessmentPage } from "./pages/AssessmentPage";
import { ProgressPage } from "./pages/ProgressPage";
import { WebCityPage } from "./pages/WebCityPage";
import { TeacherPage } from "./pages/TeacherPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LessonProgressProvider } from "./state/LessonProgress";
import { ThemeProvider } from "./state/Theme";
import { TutorPageProvider } from "./state/TutorPage";
import { LineAuthProvider } from "./state/LineAuth";
import type { AssessmentKind, AssessmentResult } from "./data/types";
import { assessmentQuestions } from "./data/assessment";

const Cell3DDemoPage = lazy(() => import("./pages/Cell3DDemoPage").then((module) => ({ default: module.Cell3DDemoPage })));
const assessmentStorageKey = "webquest-assessment-results-v1";

function readAssessmentResults(): Partial<Record<AssessmentKind, AssessmentResult>> {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(assessmentStorageKey) ?? "{}");
    if (!saved || typeof saved !== "object") return {};

    const stored = saved as Record<string, unknown>;
    const results: Partial<Record<AssessmentKind, AssessmentResult>> = {};
    for (const kind of ["pre", "post"] as const) {
      const value = stored[kind];
      if (!value || typeof value !== "object") continue;
      const result = value as Partial<AssessmentResult>;
      const total = assessmentQuestions[kind].length;
      const score = result.score;
      if (
        result.kind === kind &&
        result.total === total &&
        typeof score === "number" &&
        Number.isInteger(score) &&
        score >= 0 &&
        score <= total &&
        result.breakdown &&
        [1, 2, 3, 4].every((id) => {
          const objectiveScore = result.breakdown?.[id as 1 | 2 | 3 | 4];
          return typeof objectiveScore === "number" && Number.isInteger(objectiveScore) && objectiveScore >= 0 && objectiveScore <= 3;
        })
      ) {
        results[kind] = result as AssessmentResult;
      }
    }
    return results;
  } catch {
    return {};
  }
}

export default function App() {
  const [results, setResults] = useState<
    Partial<Record<AssessmentKind, AssessmentResult>>
  >(readAssessmentResults);
  useEffect(() => {
    try {
      localStorage.setItem(assessmentStorageKey, JSON.stringify(results));
    } catch {
      // Assessment remains usable when browser storage is unavailable.
    }
  }, [results]);
  const handleResult = (result: AssessmentResult) =>
    setResults((previous) => ({ ...previous, [result.kind]: result }));
  return (
    <ThemeProvider>
    <LineAuthProvider>
    <LessonProgressProvider>
    <TutorPageProvider>
      <Routes>
      <Route path="cell-3d" element={<Suspense fallback={null}><Cell3DDemoPage /></Suspense>} />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="lessons/:lessonId" element={<LessonPage />} />
        <Route path="code-lab" element={<CodeLabPage />} />
        <Route path="workshop" element={<WorkshopPage />} />
        <Route
          path="assessment"
          element={
            <AssessmentPage results={results} onResult={handleResult} />
          }
        />
        <Route
          path="assessment/pre"
          element={<AssessmentPage key="pre" initialKind="pre" results={results} onResult={handleResult} />}
        />
        <Route
          path="assessment/post"
          element={<AssessmentPage key="post" initialKind="post" results={results} onResult={handleResult} />}
        />
        <Route path="progress" element={<ProgressPage results={results} />} />
        <Route path="web-city" element={<WebCityPage />} />
        <Route path="teacher" element={<TeacherPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </TutorPageProvider>
    </LessonProgressProvider>
    </LineAuthProvider>
    </ThemeProvider>
  );
}
