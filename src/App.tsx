import { Route, Routes } from "react-router-dom";
import { useState } from "react";
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
import type { AssessmentKind, AssessmentResult } from "./data/types";

export default function App() {
  const [results, setResults] = useState<
    Partial<Record<AssessmentKind, AssessmentResult>>
  >({});
  const handleResult = (result: AssessmentResult) =>
    setResults((previous) => ({ ...previous, [result.kind]: result }));
  return (
    <LessonProgressProvider>
      <Routes>
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
        <Route path="progress" element={<ProgressPage />} />
        <Route path="web-city" element={<WebCityPage />} />
        <Route path="teacher" element={<TeacherPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </LessonProgressProvider>
  );
}
