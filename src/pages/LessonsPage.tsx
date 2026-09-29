import { ArrowRight, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { LearningJourney } from "../components/home/LearningJourney";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { learningPath } from "../data/learningPath";
import { objectiveLabel } from "../data/learningPath";
import { useLessonProgress } from "../state/LessonProgress";

export function LessonsPage() {
  const { statusFor } = useLessonProgress();
  return (
    <div className="inner-page">
      <PageHeader
        eyebrow="LEARNING PATH"
        title="บทเรียน"
        subtitle="เรียนทีละขั้น แล้วลองทำด้วยตัวเอง"
      />
      <LearningJourney />
      <section className="section-block" aria-labelledby="lessons-list-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">ALL LESSONS</span>
            <h2 id="lessons-list-title">บทเรียนทั้งหมด</h2>
          </div>
        </div>
        <div className="lesson-list">
          {learningPath.map((lesson) => {
            const status = statusFor(lesson.id);
            const content = <>
              <span className="lesson-row__number">{lesson.number}</span>
              <span className="lesson-row__text">
                <strong>{lesson.title}</strong>
                <small>
                  {status === "locked"
                    ? "เรียนบทก่อนหน้าให้จบเพื่อปลดล็อก"
                    : lesson.objective
                    ? objectiveLabel(lesson.objective)
                    : "เชื่อมโยงประสบการณ์กับเว็บไซต์ในชีวิตประจำวัน"}
                </small>
              </span>
              <StatusBadge
                tone={status === "current" ? "current" : status === "completed" ? "success" : "neutral"}
              >
                {status === "current" ? "เริ่มที่นี่" : status === "completed" ? "เรียนจบแล้ว" : status === "locked" ? "ยังไม่ปลดล็อก" : "พร้อมเรียน"}
              </StatusBadge>
              {status === "locked" ? <LockKeyhole className="lesson-row__arrow" size={18} /> : <ArrowRight className="lesson-row__arrow" size={18} />}
            </>;
            return status === "locked" ? (
              <div className="lesson-row lesson-row--locked" key={lesson.id} aria-label={`บทที่ ${lesson.number} ${lesson.title} ยังไม่ปลดล็อก`}>{content}</div>
            ) : (
              <Link className="lesson-row" to={`/lessons/${lesson.id}`} key={lesson.id}>{content}</Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
