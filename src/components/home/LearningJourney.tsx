import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { learningPath } from "../../data/learningPath";
import { StatusBadge } from "../ui/StatusBadge";
import { useLessonProgress } from "../../state/LessonProgress";

export function LearningJourney() {
  const { statusFor } = useLessonProgress();
  return (
    <section className="section-block" aria-labelledby="journey-title">
      <div className="section-heading">
        <div>
          <span className="section-kicker">YOUR JOURNEY</span>
          <h2 id="journey-title">เส้นทางของคุณ</h2>
        </div>
        <Link className="text-link" to="/lessons">
          ดูบทเรียนทั้งหมด <ArrowRight size={16} />
        </Link>
      </div>
      <ol className="journey-list">
        {learningPath.map((lesson) => {
          const status = statusFor(lesson.id);
          const content = <>
              <span className="journey-item__node">
                {status === "completed" ? <Check size={22} /> : status === "locked" ? <LockKeyhole size={19} /> : <lesson.icon size={22} strokeWidth={1.9} />}
              </span>
              <span className="journey-item__content">
                <small>{lesson.number}</small>
                <strong>{lesson.title}</strong>
                {status === "current" && <StatusBadge tone="current">เริ่มที่นี่</StatusBadge>}
                {status === "locked" && <StatusBadge>ยังไม่ปลดล็อก</StatusBadge>}
              </span>
          </>;
          return (
          <li
            className={`journey-item journey-item--${status}`}
            key={lesson.id}
          >
            {status === "locked" ? <span className="journey-item__link" aria-label={`บทที่ ${lesson.number} ${lesson.title} ยังไม่ปลดล็อก`}>{content}</span> : <Link
              to={`/lessons/${lesson.id}`}
              aria-label={`บทที่ ${lesson.number} ${lesson.title}`}
            >
              {content}
            </Link>}
          </li>
          );
        })}
      </ol>
    </section>
  );
}
