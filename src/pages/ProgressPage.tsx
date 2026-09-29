import {
  BookOpen,
  ClipboardCheck,
  MessageSquareText,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { lessons } from "../data/lessons";
import { useLessonProgress } from "../state/LessonProgress";

const items = [
  { label: "บทเรียน", icon: BookOpen, description: "เส้นทางบทเรียนของคุณ" },
  { label: "Workshop", icon: Wrench, description: "ผลงานที่คุณกำลังสร้าง" },
  {
    label: "แบบทดสอบ",
    icon: ClipboardCheck,
    description: "ทบทวนความรู้ของคุณ",
  },
  {
    label: "Reflection",
    icon: MessageSquareText,
    description: "บันทึกสิ่งที่ได้เรียนรู้",
  },
];

export function ProgressPage() {
  const { completedIds } = useLessonProgress();
  const completedCount = lessons.filter((lesson) => completedIds.includes(lesson.id)).length;
  return (
    <div className="inner-page">
      <PageHeader
        eyebrow="YOUR PATH"
        title="เรียนไปถึงไหนแล้ว?"
        subtitle="พื้นที่ติดตามเส้นทางการเรียนรู้ของคุณ"
      />
      <section className="progress-overview">
        <div className="progress-overview__icon">
          <TrendingUp size={26} />
        </div>
        <div>
          <span className="section-kicker">OVERALL PROGRESS</span>
          <h2>ความก้าวหน้ารวม</h2>
          <p>เรียนจบแล้ว {completedCount} จาก {lessons.length} บทเรียน</p>
        </div>
        <span className="progress-overview__value">{Math.round(completedCount / lessons.length * 100)}%</span>
      </section>
      <div className="progress-list">
        {items.map((item) => (
          <div className="progress-list__item" key={item.label}>
            <item.icon size={21} />
            <div>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </div>
            <span>{item.label === "บทเรียน" ? `${completedCount} / ${lessons.length} บท` : "รอการเริ่มต้น"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
