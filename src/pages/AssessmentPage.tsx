import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCheck, RotateCcw } from "lucide-react";
import {
  assessmentNames,
  assessmentQuestions,
  scoreAssessment,
} from "../data/assessment";
import { objectives } from "../data/lessons";
import type { AssessmentKind, AssessmentResult, Choice } from "../data/types";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";

type Props = {
  initialKind?: AssessmentKind;
  results: Partial<Record<AssessmentKind, AssessmentResult>>;
  onResult: (result: AssessmentResult) => void;
};

export function AssessmentPage({ initialKind, results, onResult }: Props) {
  const [view, setView] = useState<"landing" | "quiz" | "result">(initialKind ? "quiz" : "landing");
  const [kind, setKind] = useState<AssessmentKind>(initialKind ?? "pre");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Choice["id"]>>({});
  const [confirm, setConfirm] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const questions = assessmentQuestions[kind];
  const question = questions[index];
  const answered = Object.keys(answers).length;
  const result = results[kind];
  const visibleKinds: AssessmentKind[] = initialKind ? [initialKind] : ["pre", "post"];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirm && !dialog.open) dialog.showModal();
    if (!confirm && dialog.open) dialog.close();
  }, [confirm]);

  function start(nextKind: AssessmentKind) {
    setKind(nextKind);
    setIndex(0);
    setAnswers({});
    setView("quiz");
  }

  function submit() {
    onResult(scoreAssessment(kind, answers));
    setConfirm(false);
    setView("result");
  }

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
            <article className="assessment-card" key={item}>
              <div className="assessment-card__icon">
                <ClipboardCheck size={27} />
              </div>
              <StatusBadge tone="success">
                {results[item] ? `${results[item].score} / 12` : "พร้อมทำ"}
              </StatusBadge>
              <h2>{assessmentNames[item]}</h2>
              <p>12 ข้อ · 4 ตัวเลือก · วัตถุประสงค์ที่ 1–4</p>
              <button
                type="button"
                className="button button--primary"
                onClick={() => start(item)}
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
          ผลนี้อยู่ในหน่วยความจำของหน้าปัจจุบัน และจะไม่บันทึกหลังรีโหลด
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
      <fieldset className="quiz-question">
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
          หลังส่งคำตอบจะแสดงคะแนนและผลตามวัตถุประสงค์
        </p>
        <div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setConfirm(false)}
          >
            กลับไปตรวจคำตอบ
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={submit}
          >
            ยืนยันส่งคำตอบ
          </button>
        </div>
      </dialog>
    </div>
  );
}
