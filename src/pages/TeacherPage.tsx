import { GraduationCap } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";

export function TeacherPage() {
  return (
    <div className="inner-page">
      <PageHeader
        eyebrow="FOR EDUCATORS"
        title="สำหรับคุณครู"
        subtitle="พื้นที่สำหรับผู้สอน WebQuest Studio"
      />
      <EmptyState
        icon={<GraduationCap size={32} />}
        title="พื้นที่สำหรับคุณครู"
        description="พื้นที่ติดตามการเรียนรู้ของผู้เรียนจะพัฒนาในขั้นถัดไป"
      />
    </div>
  );
}
