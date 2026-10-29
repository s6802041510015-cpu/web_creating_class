import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { HtmlWorkspace } from "../components/lab/HtmlWorkspace";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { checkPractice, codeLabPractices, type CheckResult, type PracticeId } from "../data/codeLabPractices";
import { codeLabStorageKey } from "../state/StudentWork";
import { getStudentItem, setStudentItem } from "../state/StudentStorage";
import { useTutorPage } from "../state/TutorPage";
import { useStudentSync } from "../state/StudentProgressSync";

type LabState = { drafts: Partial<Record<PracticeId, string>>; completed: PracticeId[] };

function readLabState(): LabState {
  try {
    const saved = JSON.parse(getStudentItem(codeLabStorageKey) ?? "null") as Partial<LabState> | null;
    const ids = codeLabPractices.map((item) => item.id);
    const drafts: LabState["drafts"] = {};
    for (const id of ids) {
      if (typeof saved?.drafts?.[id] === "string") drafts[id] = saved.drafts[id];
    }
    return {
      drafts,
      completed: Array.isArray(saved?.completed)
        ? saved.completed.filter((id): id is PracticeId => ids.includes(id as PracticeId))
        : [],
    };
  } catch {
    return { drafts: {}, completed: [] };
  }
}

function ExpectedPreview({ id }: { id: PracticeId }) {
  return (
    <div className="code-lab-expected__preview" aria-label="ตัวอย่างผลลัพธ์ที่คาดหวัง">
      {id === "heading" && <><h4>ยินดีต้อนรับ</h4><h5>เกี่ยวกับฉัน</h5><p>นี่คือเว็บไซต์ของฉัน</p></>}
      {id === "paragraph" && <><h4>เกี่ยวกับฉัน</h4><p>ฉันกำลังเรียนรู้การสร้างเว็บไซต์</p><p>ฉันอยากสร้างเว็บไซต์แนะนำตัวเอง</p></>}
      {id === "image" && <><h4>ภาพของฉัน</h4><img src={`${import.meta.env.BASE_URL}assets/webquest-student.png`} alt="ตัวละครนักเรียนกำลังเรียนเขียนเว็บไซต์" /></>}
      {id === "link" && <><h4>เว็บไซต์ของฉัน</h4><span className="code-lab-expected__link">ไปที่ช่องทางติดต่อ</span><p>ยินดีต้อนรับสู่เว็บไซต์ของฉัน</p><h5>ช่องทางติดต่อ</h5></>}
      {id === "list" && <><h4>สิ่งที่อยากเรียนรู้</h4><ul><li>เขียน HTML</li><li>ตกแต่งด้วย CSS</li><li>สร้างเว็บไซต์ของตัวเอง</li></ul></>}
    </div>
  );
}

export function CodeLabPage() {
  const { status } = useStudentSync();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get("practice");
  const practiceIndex = codeLabPractices.findIndex((item) => item.id === requestedId);
  const index = practiceIndex >= 0 ? practiceIndex : 0;
  const practice = codeLabPractices[index];
  const [labState, setLabState] = useState(readLabState);
  const [feedback, setFeedback] = useState<{ id: PracticeId; results: CheckResult[] } | null>(null);
  const code = labState.drafts[practice.id] ?? practice.starterCode;
  const results = feedback?.id === practice.id ? feedback.results : null;
  const passed = results?.every((result) => result.passed) ?? false;
  const nextPractice = codeLabPractices[index + 1];
  const { setPage } = useTutorPage();

  useEffect(() => {
    setPage({ path: "/code-lab", kind: "code-lab", title: `Code Lab: ${practice.title}`, detail: practice.task, code });
    return () => setPage(null);
  }, [practice, code, setPage]);

  useEffect(() => {
    try {
      setStudentItem(codeLabStorageKey, JSON.stringify(labState));
    } catch {
      // The editor remains usable when browser storage is unavailable.
    }
  }, [labState]);

  function selectPractice(id: PracticeId) {
    setSearchParams({ practice: id });
    setFeedback(null);
  }

  function updateCode(value: string) {
    setLabState((current) => ({ ...current, drafts: { ...current.drafts, [practice.id]: value } }));
    setFeedback(null);
  }

  function resetCode() {
    setLabState((current) => ({
      ...current,
      drafts: { ...current.drafts, [practice.id]: practice.starterCode },
    }));
    setFeedback(null);
  }

  function checkAnswer() {
    const checked = checkPractice(practice, code);
    setFeedback({ id: practice.id, results: checked });
    if (checked.every((result) => result.passed)) {
      setLabState((current) => ({
        ...current,
        completed: current.completed.includes(practice.id)
          ? current.completed
          : [...current.completed, practice.id],
      }));
    }
  }

  return (
    <div className="inner-page">
      <PageHeader
        eyebrow="TRY & EXPERIMENT"
        title="Code Lab"
        subtitle="เลือกโจทย์ เขียน HTML ดูผลลัพธ์ แล้วตรวจคำตอบทีละขั้น"
      />
      <div className="code-lab-progress" aria-live="polite">
        <span>ทำผ่านแล้ว {labState.completed.length}/{codeLabPractices.length} หัวข้อ</span>
        <span>{status === "synced" ? "ผลการฝึกซิงก์แล้ว · โค้ดร่างอยู่ในเครื่องนี้" : "โค้ดของคุณบันทึกในเบราว์เซอร์นี้อัตโนมัติ"}</span>
      </div>
      <div className="practice-strip" aria-label="หัวข้อฝึกฝน">
        {codeLabPractices.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            className={practice.id === item.id ? "active" : ""}
            onClick={() => selectPractice(item.id)}
            aria-pressed={practice.id === item.id}
          >
            <small>Practice {String(itemIndex + 1).padStart(2, "0")}</small>
            <strong>{item.title} {labState.completed.includes(item.id) && <CheckCircle2 size={15} aria-label="ทำผ่านแล้ว" />}</strong>
          </button>
        ))}
      </div>
      <section className="code-lab-task" key={practice.id} aria-labelledby="code-lab-task-title">
        <div>
          <span className="section-kicker">YOUR CHALLENGE · {String(index + 1).padStart(2, "0")}</span>
          <h2 id="code-lab-task-title">ฝึก {practice.title}</h2>
          <p>{practice.task}</p>
          <div className="code-lab-expected">
            <strong>ผลลัพธ์ที่คาดหวัง</strong>
            <span>{practice.expected}</span>
            <ExpectedPreview id={practice.id} />
          </div>
        </div>
        <div className="code-lab-criteria">
          <h3>เกณฑ์ตรวจคำตอบ</h3>
          <ul>
            {practice.criteria.map((criterion, criterionIndex) => {
              const result = results?.[criterionIndex];
              return (
                <li key={criterion.label} className={result ? (result.passed ? "passed" : "needs-work") : ""}>
                  {result?.passed ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                  <span>{criterion.label}{result && !result.passed && <small>{result.guidance}</small>}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <HtmlWorkspace
        key={practice.id}
        code={code}
        onChange={updateCode}
        fileName="index.html"
        onReset={resetCode}
        hints={practice.hints}
      />
      <div className="code-lab-check-row">
        <button type="button" className="code-lab-check-button" onClick={checkAnswer}>
          <ClipboardCheck size={19} /> ตรวจคำตอบ
        </button>
        <span>ตรวจโครงสร้าง HTML จากโค้ดที่เขียน</span>
      </div>
      {results && (
        <div className={`code-lab-feedback ${passed ? "code-lab-feedback--success" : ""}`} role="status">
          <strong>{passed ? "ผ่านแล้ว! โครงสร้าง HTML ครบตามโจทย์" : `ผ่านแล้ว ${results.filter((result) => result.passed).length}/${results.length} ข้อ`}</strong>
          <p>{passed ? "ลองเลือกโจทย์ถัดไปเพื่อฝึกแท็กอื่น" : "ดูข้อที่ยังไม่ผ่านด้านบน แก้โค้ด แล้วกดตรวจคำตอบอีกครั้ง"}</p>
          {passed && nextPractice && (
            <button type="button" onClick={() => selectPractice(nextPractice.id)}>
              ไปโจทย์ {nextPractice.title} <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
      <div className="lab-next">
        <p>ฝึกใช้ HTML แล้วไปสร้างเว็บไซต์แนะนำตัวเอง 3 หน้า</p>
        <Button to="/workshop" variant="secondary">
          เริ่ม Workshop <ArrowRight size={17} />
        </Button>
      </div>
    </div>
  );
}
