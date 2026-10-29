import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CircleCheck, ClipboardCheck, LockKeyhole, RotateCcw } from "lucide-react";
import {
  assessmentNames,
  assessmentQuestions,
  scoreAssessment,
} from "../data/assessment";
import { lessons, objectives } from "../data/lessons";
import type { AssessmentKind, AssessmentResult, Choice } from "../data/types";
import { useLessonProgress } from "../state/LessonProgress";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";

type Props = {
  initialKind?: AssessmentKind;
  results: Partial<Record<AssessmentKind, AssessmentResult>>;
  onResult: (result: AssessmentResult) => void;
};

export function AssessmentPage({ initialKind, results, onResult }: Props) {
  const { completedIds } = useLessonProgress();
  const missingLessons = lessons.filter((lesson) => !completedIds.includes(lesson.id));
  const hasPreTest = Boolean(results.pre);
  const canTakePostTest = hasPreTest && missingLessons.length === 0;
  const [view, setView] = useState<"landing" | "quiz" | "result">(initialKind ? "quiz" : "landing");
  const [kind, setKind] = useState<AssessmentKind>(initialKind ?? "pre");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Choice["id"]>>({});
  const [confirm, setConfirm] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const questions = assessmentQuestions[kind];
  const question = questions[index];
  const answered = Object.keys(answers).length;
  const firstUnanswered = questions.findIndex((item) => !answers[item.id]);
  const result = results[kind];
  const visibleKinds: AssessmentKind[] = initialKind ? [initialKind] : ["pre", "post"];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirm && !dialog.open) dialog.showModal();
    if (!confirm && dialog.open) dialog.close();
  }, [confirm]);

  function start(nextKind: AssessmentKind) {
    if (nextKind === "post" && !canTakePostTest) return;
    setKind(nextKind);
    setIndex(0);
    setAnswers({});
    setView("quiz");
  }

  function submit() {
    if (kind === "post" && !canTakePostTest) return;
    if (firstUnanswered !== -1) return;
    onResult(scoreAssessment(kind, answers));
    setConfirm(false);
    setView("result");
  }

  if (kind === "post" && !canTakePostTest)
    return (
      <div className="inner-page">
        <PageHeader
          eyebrow="POST-TEST"
          title="แบบทดสอบหลังเรียนยังไม่ปลดล็อก"
          subtitle="ทำแบบทดสอบก่อนเรียนและเรียนครบทุกบทก่อน จึงจะเริ่มแบบทดสอบหลังเรียนได้"
        />
        <section className="assessment-gate">
          <div className="assessment-gate__heading">
            <LockKeyhole size={25} aria-hidden="true" />
            <h2>สิ่งที่ต้องทำก่อน</h2>
          </div>
          <ol className="assessment-gate__steps">
            <li className={hasPreTest ? "is-complete" : ""}>
              {hasPreTest ? <CircleCheck size={20} aria-hidden="true" /> : <span className="assessment-gate__number">1</span>}
              <span>ทำแบบทดสอบก่อนเรียนให้เสร็จ</span>
              <strong>{hasPreTest ? "เสร็จแล้ว" : "ยังไม่เสร็จ"}</strong>
            </li>
            <li className={missingLessons.length === 0 ? "is-complete" : ""}>
              {missingLessons.length === 0 ? <CircleCheck size={20} aria-hidden="true" /> : <span className="assessment-gate__number">2</span>}
              <span>เรียนและกดจบทุกบทเรียน</span>
              <strong>{lessons.length - missingLessons.length} / {lessons.length} บท</strong>
            </li>
          </ol>
          {missingLessons[0] && <p>บทถัดไป: {missingLessons[0].title}</p>}
          <div className="assessment-gate__actions">
            {!hasPreTest && <Link className="button button--primary" to="/assessment/pre">ไปทำแบบทดสอบก่อนเรียน <ArrowRight size={17} /></Link>}
            {missingLessons[0] && <Link className="button button--secondary" to={`/lessons/${missingLessons[0].id}`}>ไปที่บทเรียน <ArrowRight size={17} /></Link>}
          </div>
        </section>
      </div>
    );

  if (view === "landing")
    return (
      <div className="inner-page">
        <PageHeader
          eyebrow="CHECK YOUR LEARNING"
          title={initialKind ? assessmentNames[initialKind] : "แบบทดสอบ"}
          subtitle="เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว"
        />
        <div className="assessment-grid">
          {visibleKinds.map((item) => (
            <article className={`assessment-card${item === "post" && !canTakePostTest ? " assessment-card--muted" : ""}`} key={item}>
              <div className="assessment-card__icon">
                <ClipboardCheck size={27} />
              </div>
              <StatusBadge tone={item === "post" && !canTakePostTest ? "neutral" : "success"}>
                {item === "post" && !canTakePostTest ? "ยังไม่ปลดล็อก" : results[item] ? `${results[item].score} / 12` : "พร้อมทำ"}
              </StatusBadge>
              <h2>{assessmentNames[item]}</h2>
              <p>12 ข้อ · 4 ตัวเลือก · วัตถุประสงค์ที่ 1–4</p>
              {item === "post" && !canTakePostTest && <small>ทำแบบทดสอบก่อนเรียนและเรียนครบ {lessons.length} บทก่อน</small>}
              <button
                type="button"
                className="button button--primary"
                onClick={() => start(item)}
                disabled={item === "post" && !canTakePostTest}
              >
                {results[item] ? "ทำอีกครั้ง" : "เริ่มทำ"}{" "}
                <ArrowRight size={17} />
              </button>
            </article>
          ))}
        </div>
        {results.pre && results.post && (
          <section className="assessment-comparison">
            <span className="section-kicker">COMPARISON</span>
            <h2>เปรียบเทียบผลในครั้งนี้</h2>
            <div>
              <p>
                ก่อนเรียน <strong>{results.pre.score} / 12</strong>
              </p>
              <p>
                หลังเรียน <strong>{results.post.score} / 12</strong>
              </p>
            </div>
          </section>
        )}
      </div>
    );

  if (view === "result" && result)
    return (
      <div className="inner-page">
        <PageHeader
          eyebrow="RESULT"
          title={assessmentNames[kind]}
          subtitle="ผลการทำแบบทดสอบในครั้งนี้"
        />
        <section className="result-hero">
          <span className="section-kicker">SCORE</span>
          <strong>
            {result.score} <small>/ {result.total}</small>
          </strong>
          <p>คะแนนของคุณ</p>
        </section>
        <section className="result-breakdown">
          <h2>ผลตามวัตถุประสงค์</h2>
          {([1, 2, 3, 4] as const).map((id) => (
            <div key={id}>
              <span>วัตถุประสงค์ที่ {id}</span>
              <p>{objectives[id]}</p>
              <strong>{result.breakdown[id]} / 3</strong>
            </div>
          ))}
        </section>
        {results.pre && results.post && (
          <section className="assessment-comparison">
            <span className="section-kicker">COMPARISON</span>
            <h2>ก่อนเรียน / หลังเรียน</h2>
            <div>
              <p>
                ก่อนเรียน <strong>{results.pre.score} / 12</strong>
              </p>
              <p>
                หลังเรียน <strong>{results.post.score} / 12</strong>
              </p>
            </div>
          </section>
        )}
        <div className="result-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setView("landing")}
          >
            <ArrowLeft size={16} /> กลับไปแบบทดสอบ
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => start(kind)}
          >
            <RotateCcw size={16} /> ทำอีกครั้ง
          </button>
        </div>
        <p className="supporting-note">
          ผลนี้บันทึกไว้ในเบราว์เซอร์ของอุปกรณ์นี้
        </p>
      </div>
    );

  return (
    <div className="inner-page assessment-quiz">
      <button
        type="button"
        className="back-link assessment-back"
        onClick={() => setView("landing")}
      >
        <ArrowLeft size={16} /> กลับไปแบบทดสอบ
      </button>
      <PageHeader
        eyebrow={kind === "pre" ? "PRE-TEST" : "POST-TEST"}
        title={assessmentNames[kind]}
        subtitle={`ข้อ ${index + 1} จาก ${questions.length}`}
      />
      <div className="quiz-progress">
        <div>
          <span>
            ตอบแล้ว {answered} / {questions.length}
          </span>
          <span>วัตถุประสงค์ที่ {question.objective}</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="ความคืบหน้าแบบทดสอบ"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={questions.length}
        >
          <span style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
      </div>
      <fieldset className="quiz-question" key={`${kind}-${question.id}`}>
        <legend>
          <span>QUESTION {String(question.id).padStart(2, "0")}</span>
          {question.prompt}
        </legend>
        <div className="quiz-choices">
          {question.choices.map((choice) => (
            <label
              key={choice.id}
              className={answers[question.id] === choice.id ? "selected" : ""}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={choice.id}
                checked={answers[question.id] === choice.id}
                onChange={() =>
                  setAnswers((previous) => ({
                    ...previous,
                    [question.id]: choice.id,
                  }))
                }
              />
              <strong>{choice.id}</strong>
              <span>{choice.text}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="quiz-controls">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
        >
          <ArrowLeft size={16} /> ก่อนหน้า
        </button>
        {index < questions.length - 1 ? (
          <button
            type="button"
            className="button button--primary"
            onClick={() => setIndex((value) => value + 1)}
          >
            ถัดไป <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            onClick={() => setConfirm(true)}
          >
            ส่งคำตอบ <ArrowRight size={16} />
          </button>
        )}
      </div>
      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        onCancel={() => setConfirm(false)}
        aria-labelledby="submit-title"
      >
        <h2 id="submit-title">ส่งคำตอบแบบทดสอบ?</h2>
        <p>
          ตอบแล้ว {answered} จาก {questions.length} ข้อ
          {firstUnanswered === -1
            ? " หลังส่งคำตอบจะแสดงคะแนนและผลตามวัตถุประสงค์"
            : " กรุณาตอบให้ครบทุกข้อก่อนส่งคำตอบ"}
        </p>
        <div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setConfirm(false);
              if (firstUnanswered !== -1) setIndex(firstUnanswered);
            }}
          >
            {firstUnanswered === -1 ? "กลับไปตรวจคำตอบ" : `ไปข้อที่ ${firstUnanswered + 1} ที่ยังไม่ตอบ`}
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={submit}
            disabled={firstUnanswered !== -1}
          >
            ยืนยันส่งคำตอบ
          </button>
        </div>
      </dialog>
    </div>
  );
}
