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
import { StudentProgressSync } from "./state/StudentProgressSync";
import type { AssessmentKind, AssessmentResult } from "./data/types";
import { readAssessmentResults } from "./state/ProgressData";
import { assessmentStorageKey, setStudentItem } from "./state/StudentStorage";

const Cell3DDemoPage = lazy(() => import("./pages/Cell3DDemoPage").then((module) => ({ default: module.Cell3DDemoPage })));

function LearningApp() {
  const [results, setResults] = useState<
    Partial<Record<AssessmentKind, AssessmentResult>>
  >(readAssessmentResults);
  useEffect(() => {
    try {
      setStudentItem(assessmentStorageKey, JSON.stringify(results));
    } catch {
      // Assessment remains usable when browser storage is unavailable.
    }
  }, [results]);
  const handleResult = (result: AssessmentResult) =>
    setResults((previous) => ({ ...previous, [result.kind]: result }));
  return (
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
  );
}

export default function App() {
  return <ThemeProvider><LineAuthProvider><StudentProgressSync><LessonProgressProvider><TutorPageProvider><LearningApp /></TutorPageProvider></LessonProgressProvider></StudentProgressSync></LineAuthProvider></ThemeProvider>;
}
