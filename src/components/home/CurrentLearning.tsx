import { ArrowRight, BookOpen, Play } from "lucide-react";
import { Button } from "../ui/Button";
import { lessons } from "../../data/lessons";
import { useLessonProgress } from "../../state/LessonProgress";

export function CurrentLearning() {
  const { completedIds, isUnlocked } = useLessonProgress();
  const lesson = lessons.find((item) => isUnlocked(item.id) && !completedIds.includes(item.id)) ?? lessons[lessons.length - 1];
  const allCompleted = lessons.every((item) => completedIds.includes(item.id));
  const completedCount = lessons.filter((item) => completedIds.includes(item.id)).length;
  const percent = Math.round((completedCount / lessons.length) * 100);
  return (
    <section className="section-block" aria-labelledby="current-title">
      <div className="section-heading">
        <div>
          <span className="section-kicker">CONTINUE LEARNING</span>
          <h2 id="current-title">เรียนต่อจากตรงนี้</h2>
        </div>
        <span className="section-heading__hint">ก้าวต่อไปของคุณ</span>
      </div>
      <div className="current-learning">
        <div className="current-learning__icon">
          <BookOpen size={27} strokeWidth={1.8} />
        </div>
        <div className="current-learning__body">
          <span className="current-learning__eyebrow">
            บทที่ {lesson.id} <span>•</span> {allCompleted ? "เรียนครบแล้ว" : "บทถัดไปของคุณ"}
          </span>
          <h3>{lesson.title}</h3>
          <p>{allCompleted ? "คุณเรียนครบทุกบทแล้ว" : "เรียนรู้ทีละขั้น แล้วทำเครื่องหมายเมื่อเรียนจบบทนี้"}</p>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="ความก้าวหน้าของบทเรียน"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <small>{allCompleted ? "เรียนครบแล้ว" : `เรียนจบ ${completedCount} / ${lessons.length} บท (${percent}%)`}</small>
        </div>
        <Button
          to={`/lessons/${lesson.id}`}
          variant="secondary"
          className="current-learning__button"
        >
          <Play size={16} fill="currentColor" aria-hidden="true" /> {allCompleted ? "ทบทวน" : "เริ่มเรียน"}{" "}
          <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
