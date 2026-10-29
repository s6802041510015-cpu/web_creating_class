import { useEffect, useLayoutEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, CircleCheck, LockKeyhole } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CharacterMascot } from "../components/mascot/CharacterMascot";
import { Lesson3DExplorer } from "../components/lesson/Lesson3DExplorer";
import {
  CodeExample,
  FinalProjectOverview,
  IntroQuestions,
  MockWebsiteExplorer,
  QuickCheckPanel,
  StructureExplorer,
  TagExplorer,
  TermExplorer,
} from "../components/lesson/LessonInteractions";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { projectRequiredTags, projectWorkflow } from "../data/finalProject";
import {
  htmlRoles,
  htmlStructureCode,
  lessons,
  structureComparison,
} from "../data/lessons";
import { objectiveLabel } from "../data/learningPath";
import type { Lesson } from "../data/types";
import { NotFoundPage } from "./NotFoundPage";
import { useLessonProgress } from "../state/LessonProgress";
import { useTutorPage } from "../state/TutorPage";

const steps = ["เริ่มต้น", "เรียนรู้", "ตัวอย่าง", "ลองทำ", "สรุป"];

function LessonNotes({ lesson }: { lesson: Lesson }) {
  if (lesson.learn.length === 0) return null;
  return (
    <section className="lesson-notes" aria-label="เนื้อหาเพิ่มเติม">
      <h3 className="lesson-subheading">อ่านให้เข้าใจทีละส่วน</h3>
      <div className="content-card-grid">
        {lesson.learn.map((section, index) => (
          <article className="content-card" key={section.title}>
            <span className="content-card__number">{String(index + 1).padStart(2, "0")}</span>
            <h3>{section.title}</h3>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.example && <CodeExample example={section.example} />}
          </article>
        ))}
      </div>
    </section>
  );
}

function LessonExamples({ lesson }: { lesson: Lesson }) {
  if (lesson.examples.length === 0) return null;
  return (
    <section className="lesson-examples" aria-label="ตัวอย่างเพิ่มเติม">
      <h3 className="lesson-subheading">ดูตัวอย่างและสังเกตผล</h3>
      {lesson.examples.map((example) => <CodeExample key={example.label} example={example} />)}
    </section>
  );
}

function Lesson3DStage({ lesson, title, children }: { lesson: Lesson; title: string; children: ReactNode }) {
  return (
    <div className="lesson-stage lesson-stage--with-3d">
      <section className="lesson-stage__learning-panel">
        <span className="section-kicker">EXAMPLE</span>
        <h2>{title}</h2>
        {children}
      </section>
      <Lesson3DExplorer lessonId={lesson.id} />
    </div>
  );
}

function LessonStage({ lesson, step }: { lesson: Lesson; step: number }) {
  if (step === 0)
    return (
      <div className="lesson-stage">
        <span className="section-kicker">INTRO</span>
        <h2>{lesson.title}</h2>
        {lesson.objective && (
          <p className="objective-note">{objectiveLabel(lesson.objective)}</p>
        )}
        {lesson.intro.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
    );

  if (step === 1) {
    if (lesson.id === "00")
      return (
        <div className="lesson-stage">
          <span className="section-kicker">LEARN</span>
          <h2>เว็บไซต์ในชีวิตประจำวัน</h2>
          <LessonNotes lesson={lesson} />
        </div>
      );
    if (lesson.id === "01")
      return (
        <div className="lesson-stage">
          <span className="section-kicker">LEARN</span>
          <h2>HTML มาจากคำ 3 ส่วน</h2>
          <TermExplorer />
          <LessonNotes lesson={lesson} />
        </div>
      );
    if (lesson.id === "02")
      return (
        <div className="lesson-stage">
          <span className="section-kicker">LEARN</span>
          <h2>HTML = โครงสร้างของเว็บไซต์</h2>
          <div className="content-card-grid">
            {htmlRoles.map((role, index) => (
              <article className="content-card" key={role.title}>
                <span className="content-card__number">0{index + 1}</span>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
              </article>
            ))}
          </div>
          <LessonNotes lesson={lesson} />
        </div>
      );
    if (lesson.id === "03")
      return (
        <div className="lesson-stage">
          <span className="section-kicker">LEARN</span>
          <h2>ส่วนประกอบของเอกสาร HTML</h2>
          <div className="content-card-grid">
            {lesson.learn.map((section) => (
              <article className="content-card" key={section.title}>
                <h3>
                  <code>{section.title}</code>
                </h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.example && <CodeExample example={section.example} />}
              </article>
            ))}
          </div>
          <h3 className="lesson-subheading">HEAD, BODY, TITLE และ META</h3>
          <div className="comparison-grid">
            {structureComparison.map((item) => (
              <article key={item.tag}>
                <code>{item.tag}</code>
                <p>{item.role}</p>
                <small>{item.display}</small>
              </article>
            ))}
          </div>
        </div>
      );
    if (lesson.id === "04")
      return (
        <div className="lesson-stage">
          <span className="section-kicker">LEARN</span>
          <h2>Tag พื้นฐาน</h2>
          {lesson.intro.map((text) => (
            <p key={text}>{text}</p>
          ))}
          <div className="tag-summary">
            {lesson.summary.map((text) => (
              <span key={text}>{text}</span>
            ))}
          </div>
          <LessonNotes lesson={lesson} />
        </div>
      );
    return (
      <div className="lesson-stage">
        <span className="section-kicker">LEARN</span>
        <h2>งานที่ต้องสร้าง</h2>
        <p>
          สร้างเว็บไซต์แนะนำตัวเองจำนวน 3 หน้า และสร้าง Link
          เชื่อมโยงระหว่างทั้ง 3 หน้า
        </p>
        <h3 className="lesson-subheading">Tag ที่ใช้</h3>
        <ul className="lesson-bullets">
          {projectRequiredTags.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3 className="lesson-subheading">ลำดับการทำงาน</h3>
        <ol className="lesson-bullets">
          {projectWorkflow.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <LessonNotes lesson={lesson} />
      </div>
    );
  }

  if (step === 2) {
    if (lesson.id === "00")
      return (
        <div className="lesson-stage">
          <span className="section-kicker">EXAMPLE</span>
          <h2>องค์ประกอบบนหน้าเว็บไซต์</h2>
          <div className="tag-summary">
            {["ข้อความ", "รูปภาพ", "เมนู", "ปุ่ม", "ลิงก์"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <LessonExamples lesson={lesson} />
        </div>
      );
    if (lesson.id === "01")
      return (
        <Lesson3DStage lesson={lesson} title="HyperText + Markup + Language">
          <div className="html-formula">
            <strong>HTML</strong>
            <span>=</span>
            <span>HyperText</span>
            <b>+</b>
            <span>Markup</span>
            <b>+</b>
            <span>Language</span>
          </div>
          <LessonExamples lesson={lesson} />
        </Lesson3DStage>
      );
    if (lesson.id === "02")
      return (
        <Lesson3DStage lesson={lesson} title="องค์ประกอบของหน้าเว็บไซต์">
          <MockWebsiteExplorer />
          <LessonExamples lesson={lesson} />
        </Lesson3DStage>
      );
    if (lesson.id === "03")
      return (
        <Lesson3DStage lesson={lesson} title="โครงสร้างเอกสาร HTML">
          <CodeExample
            example={{ label: "โครงสร้างเอกสาร HTML", code: htmlStructureCode }}
          />
          <h3 className="lesson-subheading">สำรวจโครงสร้าง</h3>
          <StructureExplorer />
          <LessonExamples lesson={lesson} />
        </Lesson3DStage>
      );
    if (lesson.id === "04")
      return (
        <Lesson3DStage lesson={lesson} title="HTML TAG EXPLORER">
          <TagExplorer />
          <LessonExamples lesson={lesson} />
        </Lesson3DStage>
      );
    return (
      <Lesson3DStage lesson={lesson} title="เว็บไซต์ 3 หน้า">
        <FinalProjectOverview />
        <LessonExamples lesson={lesson} />
      </Lesson3DStage>
    );
  }

  if (step === 3) {
    if (lesson.id === "00")
      return (
        <div className="lesson-stage">
          <span className="section-kicker">TRY</span>
          <h2>ลองคิดจากสิ่งที่เคยเห็น</h2>
          <IntroQuestions />
        </div>
      );
    if (lesson.quickCheck)
      return (
        <div className="lesson-stage">
          <span className="section-kicker">TRY</span>
          <QuickCheckPanel key={lesson.id} check={lesson.quickCheck} />
        </div>
      );
    return (
      <div className="lesson-stage">
        <span className="section-kicker">TRY</span>
        <h2>ลงมือสร้างเว็บไซต์แนะนำตัวเอง</h2>
        <p>เปิดพื้นที่ Workshop เพื่อสร้างและดูตัวอย่างเว็บไซต์ทั้ง 3 หน้า</p>
        <Button to="/workshop">
          เริ่ม Workshop <ArrowRight size={17} />
        </Button>
      </div>
    );
  }

  return (
    <div className="lesson-stage">
      <span className="section-kicker">SUMMARY</span>
      <h2>สรุปบทเรียน</h2>
      <ul className="lesson-bullets">
        {lesson.summary.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {lesson.id === "04" && (
        <Button to="/code-lab?practice=heading">
          ไปลองเขียนโค้ด <ArrowRight size={17} />
        </Button>
      )}
      {lesson.id === "05" && (
        <Button to="/workshop">
          เริ่ม Workshop <ArrowRight size={17} />
        </Button>
      )}
    </div>
  );
}

export function LessonPage() {
  const { lessonId } = useParams();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const { completedIds, isUnlocked, completeLesson } = useLessonProgress();
  const { setPage } = useTutorPage();
  useLayoutEffect(() => { setStep(0); setMaxStep(0); }, [lessonId]);
  const lesson = lessons.find((item) => item.id === lessonId);
  const lessonTitle = lesson?.title ?? "";
  const lessonIntro = lesson?.intro[0] ?? "";
  useEffect(() => {
    if (!lesson || !isUnlocked(lesson.id)) return;
    setPage({ path: `/lessons/${lesson.id}`, kind: "lesson", title: `บทที่ ${lesson.id} ${lessonTitle}`, detail: `ขั้นตอน ${step + 1}/5: ${steps[step]}. ${lessonIntro}` });
    return () => setPage(null);
  }, [lesson, lessonIntro, lessonTitle, step, isUnlocked, setPage]);
  if (!lesson) return <NotFoundPage />;
  if (!isUnlocked(lesson.id)) return (
    <div className="inner-page">
      <PageHeader eyebrow={`บทที่ ${lesson.id}`} title="บทเรียนนี้ยังไม่ปลดล็อก" subtitle="เรียนบทก่อนหน้าให้จบก่อน แล้วบทนี้จะเปิดให้อัตโนมัติ" />
      <Link className="button button--primary" to="/lessons"><ArrowLeft size={16} /> กลับไปที่บทเรียน</Link>
    </div>
  );
  const index = lessons.findIndex((item) => item.id === lesson.id);
  const percent = (step + 1) * 20;
  const completed = completedIds.includes(lesson.id);
  const nextLesson = lessons[index + 1];
  const show3D = step === 2 && lesson.id !== "00";

  function goNextStep() {
    const next = Math.min(4, step + 1);
    setStep(next);
    setMaxStep((visited) => Math.max(visited, next));
  }

  return (
    <div className="inner-page lesson-page">
      <Link className="back-link" to="/lessons">
        <ArrowLeft size={16} /> กลับไปที่บทเรียน
      </Link>
      <PageHeader
        eyebrow={`บทที่ ${lesson.id}`}
        title={lesson.title}
        subtitle={
          lesson.objective
            ? objectiveLabel(lesson.objective)
            : "เชื่อมโยงประสบการณ์กับเว็บไซต์ที่พบในชีวิตประจำวัน"
        }
      />
      <div className="lesson-progress">
        <span>ขั้นตอนในบทนี้</span>
        <strong>{step + 1} / 5</strong>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="ขั้นตอนในบทนี้"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>
      <nav className="step-nav" aria-label="ขั้นตอนบทเรียน">
        {steps.map((name, index) => (
          <button
            type="button"
            className={`step-nav__item ${index === step ? "step-nav__item--active" : ""}`}
            key={name}
            aria-current={index === step ? "step" : undefined}
            disabled={index > maxStep}
            onClick={() => setStep(index)}
          >
            <span>{index + 1}</span>
            {name}
          </button>
        ))}
      </nav>
      <div className={`lesson-body ${show3D ? "lesson-body--with-3d" : ""}`}>
        <div>
          <LessonStage key={`${lesson.id}-${step}`} lesson={lesson} step={step} />
          <div className="lesson-stage-controls">
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
            >
              <ArrowLeft size={16} /> ก่อนหน้า
            </button>
            {step < 4 ? <button className="button button--primary" type="button" onClick={goNextStep}>
              ถัดไป <ArrowRight size={16} />
            </button> : completed ? <span className="lesson-complete"><CircleCheck size={19} /> เรียนจบบทนี้แล้ว</span> : <button className="button button--primary" type="button" onClick={() => completeLesson(lesson.id)}>
              <CircleCheck size={17} /> เรียนจบบทนี้
            </button>}
          </div>
        </div>
        {!show3D && <aside className="guide-box">
          <CharacterMascot variant="guide" />
          <div>
            <span className="guide-box__label">
              <CircleCheck size={15} /> เพื่อนร่วมทาง
            </span>
            <p>“ลองเรียนทีละขั้น แล้วค่อยไปทดลองเขียนโค้ดนะ”</p>
          </div>
        </aside>}
      </div>
      <nav className="lesson-neighbors" aria-label="เปลี่ยนบทเรียน">
        {index > 0 && (
          <Link className="lesson-neighbors__card lesson-neighbors__card--previous" to={`/lessons/${lessons[index - 1].id}`}>
            <span className="lesson-neighbors__icon"><ArrowLeft size={20} aria-hidden="true" /></span>
            <span className="lesson-neighbors__text">
              <span className="lesson-neighbors__direction">บทเรียนก่อนหน้า</span>
              <strong>{lessons[index - 1].title}</strong>
            </span>
          </Link>
        )}
        {nextLesson ? (
          isUnlocked(nextLesson.id) ? (
            <Link className="lesson-neighbors__card lesson-neighbors__card--next lesson-neighbors__next" to={`/lessons/${nextLesson.id}`}>
              <span className="lesson-neighbors__text">
                <span className="lesson-neighbors__direction">บทเรียนถัดไป</span>
                <strong>{nextLesson.title}</strong>
              </span>
              <span className="lesson-neighbors__icon"><ArrowRight size={20} aria-hidden="true" /></span>
            </Link>
          ) : (
            <span className="lesson-neighbors__card lesson-neighbors__card--locked lesson-neighbors__next">
              <span className="lesson-neighbors__text">
                <span className="lesson-neighbors__direction">บทเรียนถัดไปยังไม่ปลดล็อก</span>
                <strong>เรียนจบบทนี้ก่อนเพื่อไปต่อ</strong>
              </span>
              <span className="lesson-neighbors__icon"><LockKeyhole size={20} aria-hidden="true" /></span>
            </span>
          )
        ) : (
          <Link className="lesson-neighbors__card lesson-neighbors__card--next lesson-neighbors__next" to="/workshop">
            <span className="lesson-neighbors__text">
              <span className="lesson-neighbors__direction">เรียนครบทุกบทแล้ว</span>
              <strong>เริ่ม Workshop</strong>
            </span>
            <span className="lesson-neighbors__icon"><ArrowRight size={20} aria-hidden="true" /></span>
          </Link>
        )}
      </nav>
    </div>
  );
}
