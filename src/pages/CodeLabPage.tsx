import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { HtmlWorkspace } from "../components/lab/HtmlWorkspace";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { htmlStructureCode } from "../data/lessons";

const practices = ["Heading", "Paragraph", "Image", "Link", "List"];

export function CodeLabPage() {
  const [code, setCode] = useState(htmlStructureCode);
  const [practice, setPractice] = useState(0);
  return (
    <div className="inner-page">
      <PageHeader
        eyebrow="TRY & EXPERIMENT"
        title="Code Lab"
        subtitle="ลองเขียนโค้ด แล้วดูผลลัพธ์ทันที"
      />
      <div className="practice-strip" aria-label="หัวข้อฝึกฝน">
        {practices.map((item, index) => (
          <button
            key={item}
            type="button"
            className={practice === index ? "active" : ""}
            onClick={() => setPractice(index)}
            aria-pressed={practice === index}
          >
            <small>Practice {String(index + 1).padStart(2, "0")}</small>
            <strong>{item}</strong>
          </button>
        ))}
      </div>
      <HtmlWorkspace
        code={code}
        onChange={setCode}
        fileName="index.html"
        onReset={() => setCode(htmlStructureCode)}
        hint
      />
      <div className="lab-next">
        <p>ฝึกใช้ HTML แล้วไปสร้างเว็บไซต์แนะนำตัวเอง 3 หน้า</p>
        <Button to="/workshop" variant="secondary">
          เริ่ม Workshop <ArrowRight size={17} />
        </Button>
      </div>
    </div>
  );
}
