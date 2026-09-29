import { useState } from "react";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { HtmlWorkspace } from "../components/lab/HtmlWorkspace";
import { PageHeader } from "../components/ui/PageHeader";
import {
  finalProjectPages,
  projectChecklist,
  projectWorkflow,
} from "../data/finalProject";
import { htmlStructureCode } from "../data/lessons";

const files = ["page1.html", "page2.html", "page3.html"] as const;
const initialCode = Object.fromEntries(
  files.map((file) => [file, htmlStructureCode]),
) as Record<string, string>;

export function WorkshopPage() {
  const [activePage, setActivePage] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [codes, setCodes] = useState<Record<string, string>>(initialCode);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const currentFile = files[activePage];
  const currentPage = finalProjectPages[activePage];

  function toggleChecklist(id: string) {
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function followLink(href: string): boolean {
    const index = files.findIndex((file) => href.replace(/^\.\//, "") === file);
    if (index === -1) return false;
    setActivePage(index);
    return true;
  }

  function downloadPage() {
    const url = URL.createObjectURL(
      new Blob([codes[currentFile]], { type: "text/html;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = currentFile;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="inner-page workshop-page">
      <PageHeader
        eyebrow="BUILD YOUR OWN"
        title="Workshop"
        subtitle="สร้างเว็บไซต์แนะนำตัวเองจำนวน 3 หน้า"
      />
      <section className="workshop-flow" aria-labelledby="workflow-title">
        <div className="workshop-flow__heading">
          <div>
            <span className="section-kicker">WORKFLOW</span>
            <h2 id="workflow-title">ทำทีละขั้น</h2>
          </div>
          <span>
            {activeStep + 1} / {projectWorkflow.length}
          </span>
        </div>
        <nav className="workshop-flow__steps" aria-label="ขั้นตอน Workshop">
          {projectWorkflow.map((item, index) => (
            <button
              key={item}
              type="button"
              aria-label={`ขั้นตอน ${index + 1}: ${item}`}
              aria-current={activeStep === index ? "step" : undefined}
              className={activeStep === index ? "active" : ""}
              onClick={() => setActiveStep(index)}
            >
              {index + 1}
            </button>
          ))}
        </nav>
        <p>{projectWorkflow[activeStep]}</p>
        <div className="workshop-flow__controls">
          <button
            type="button"
            onClick={() => setActiveStep((value) => Math.max(0, value - 1))}
            disabled={activeStep === 0}
          >
            <ArrowLeft size={15} /> ก่อนหน้า
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveStep((value) =>
                Math.min(projectWorkflow.length - 1, value + 1),
              )
            }
            disabled={activeStep === projectWorkflow.length - 1}
          >
            ถัดไป <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <div
        className="workshop-tabs"
        role="tablist"
        aria-label="เว็บไซต์ 3 หน้า"
      >
        {finalProjectPages.map((page, index) => (
          <button
            key={page.id}
            role="tab"
            type="button"
            aria-selected={activePage === index}
            className={activePage === index ? "active" : ""}
            onClick={() => setActivePage(index)}
          >
            <small>PAGE {index + 1}</small>
            <strong>{page.title}</strong>
          </button>
        ))}
      </div>
      <section
        className="workshop-page-detail"
        aria-label={`ข้อกำหนด ${currentPage.title}`}
      >
        <div>
          <span className="section-kicker">{currentFile}</span>
          <h2>{currentPage.title}</h2>
          <p>หัวข้อ: “{currentPage.heading}”</p>
        </div>
        <ul>
          {currentPage.requirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <HtmlWorkspace
        key={currentFile}
        code={codes[currentFile]}
        onChange={(value) =>
          setCodes((previous) => ({ ...previous, [currentFile]: value }))
        }
        fileName={currentFile}
        onInternalLink={followLink}
      />
      <div className="workshop-save">
        <p>
          ใช้ <code>page1.html</code>, <code>page2.html</code> และ{" "}
          <code>page3.html</code> เมื่อต้องการเชื่อมลิงก์ระหว่าง 3 หน้า
        </p>
        <button
          type="button"
          className="button button--secondary"
          onClick={downloadPage}
        >
          <Download size={16} /> ดาวน์โหลดหน้านี้
        </button>
      </div>
      <section
        className="workshop-checklist-section"
        aria-labelledby="final-checklist-title"
      >
        <div className="section-heading">
          <div>
            <span className="section-kicker">SELF CHECK</span>
            <h2 id="final-checklist-title">ตรวจผลงานของคุณ</h2>
          </div>
          <span className="section-heading__hint">
            {checked.size} / {projectChecklist.length}
          </span>
        </div>
        <div className="self-check-grid">
          {projectChecklist.map((item) => (
            <label
              key={item.id}
              className={checked.has(item.id) ? "checked" : ""}
            >
              <input
                type="checkbox"
                checked={checked.has(item.id)}
                onChange={() => toggleChecklist(item.id)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        <p className="supporting-note">
          Checklist นี้สำหรับตรวจด้วยตนเอง
          ยังไม่มีการให้คะแนนหรือบันทึกข้อมูลหลังรีโหลด
        </p>
      </section>
    </div>
  );
}
