import {
  BookOpen,
  ClipboardCheck,
  Code2,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { codeLabPractices } from "../data/codeLabPractices";
import { projectChecklist } from "../data/finalProject";
import { lessons } from "../data/lessons";
import type { AssessmentKind, AssessmentResult } from "../data/types";
import { useLessonProgress } from "../state/LessonProgress";
import { readCodeLabCompletedCount, readWorkshopSummary, workshopFiles } from "../state/StudentWork";

export function ProgressPage({ results }: { results: Partial<Record<AssessmentKind, AssessmentResult>> }) {
  const { completedIds } = useLessonProgress();
  const completedCount = lessons.filter((lesson) => completedIds.includes(lesson.id)).length;
  const codeLabCount = readCodeLabCompletedCount();
  const workshop = readWorkshopSummary();
  const workshopStarted = workshop.editedPages > 0 || workshop.checkedCount > 0;
  const items = [
    { label: "บทเรียน", icon: BookOpen, description: "เส้นทางบทเรียนของคุณ", status: `${completedCount} / ${lessons.length} บท` },
    { label: "Code Lab", icon: Code2, description: "แบบฝึกที่ตรวจผ่าน", status: `${codeLabCount} / ${codeLabPractices.length} หัวข้อ` },
    { label: "Workshop", icon: Wrench, description: "เว็บไซต์ 3 หน้าของคุณ", status: workshopStarted ? `แก้ไข ${workshop.editedPages} / ${workshopFiles.length} หน้า · ตรวจ ${workshop.checkedCount} / ${projectChecklist.length}` : "ยังไม่เริ่ม" },
    { label: "แบบทดสอบก่อนเรียน", icon: ClipboardCheck, description: "คะแนนก่อนเริ่มเรียน", status: results.pre ? `${results.pre.score} / ${results.pre.total} คะแนน` : "ยังไม่ทำ" },
    { label: "แบบทดสอบหลังเรียน", icon: ClipboardCheck, description: "คะแนนหลังเรียนครบทุกบท", status: results.post ? `${results.post.score} / ${results.post.total} คะแนน` : "ยังไม่ทำ" },
  ];
  return (
    <div className="inner-page">
      <PageHeader
        eyebrow="YOUR PATH"
        title="เรียนไปถึงไหนแล้ว?"
        subtitle="ติดตามบทเรียน แบบฝึก และผลการทดสอบของคุณ"
      />
      <section className="progress-overview">
        <div className="progress-overview__icon">
          <TrendingUp size={26} />
        </div>
        <div>
          <span className="section-kicker">LESSON PROGRESS</span>
          <h2>ความก้าวหน้าบทเรียน</h2>
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
            <span>{item.status}</span>
          </div>
        ))}
      </div>
      <p className="supporting-note">ข้อมูลในหน้านี้บันทึกไว้ในเบราว์เซอร์เครื่องนี้ ยังไม่ซิงก์ข้ามอุปกรณ์</p>
    </div>
  );
}
