import { useState } from "react";
import { ArrowRight, Eye, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import {
  htmlTerms,
  introQuestions,
  mockWebsiteParts,
  structureParts,
  tagReference,
} from "../../data/lessons";
import { finalProjectPages } from "../../data/finalProject";
import type { TagReference } from "../../data/lessons";
import type { Example, QuickCheck } from "../../data/types";

export function CodeExample({ example }: { example: Example }) {
  return (
    <figure className="lesson-code">
      <figcaption>{example.label}</figcaption>
      <pre>
        <code>
          {example.code.split(/(<[^>]+>)/g).map((part, index) =>
            part.startsWith("<") && part.endsWith(">") ? (
              <span className="code-token" key={index}>
                {part}
              </span>
            ) : (
              part
            ),
          )}
        </code>
      </pre>
    </figure>
  );
}

export function IntroQuestions() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="explorer-grid">
      {introQuestions.map((item, index) => (
        <article className="reveal-card" key={item.question}>
          <span className="section-kicker">คำถาม {index + 1}</span>
          <h3>{item.question}</h3>
          <button
            type="button"
            className="text-link"
            onClick={() => setOpen(open === index ? null : index)}
            aria-expanded={open === index}
          >
            {open === index ? "ซ่อนแนวคำตอบ" : "ดูแนวคำตอบ"} <Eye size={15} />
          </button>
          {open === index && (
            <p className="reveal-card__answer">{item.answer}</p>
          )}
        </article>
      ))}
    </div>
  );
}

export function TermExplorer() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="interactive-block">
      <div className="term-options">
        {htmlTerms.map((term, index) => (
          <button
            key={term.letter}
            type="button"
            className={`term-option ${selected === index ? "term-option--selected" : ""}`}
            onClick={() => setSelected(index)}
            aria-pressed={selected === index}
          >
            <strong>{term.letter}</strong>
            <span>{term.title}</span>
          </button>
        ))}
      </div>
      <div className="explorer-detail" aria-live="polite">
        {selected === null ? (
          <p>เลือก H, M หรือ L เพื่อดูความหมาย</p>
        ) : (
          <>
            <span className="section-kicker">
              {htmlTerms[selected].letter} · {htmlTerms[selected].title}
            </span>
            <p>{htmlTerms[selected].description}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function MockWebsiteExplorer() {
  const [selected, setSelected] = useState<string | null>(null);
  const active = mockWebsiteParts.find((part) => part.id === selected);
  return (
    <div className="interactive-block mock-explorer">
      <div className="mock-site">
        <div className="mock-site__bar">เว็บไซต์แนะนำตัว</div>
        <button
          type="button"
          className="mock-site__image"
          onClick={() => setSelected("image")}
        >
          รูปภาพ
        </button>
        <button
          type="button"
          className="mock-site__name"
          onClick={() => setSelected("name")}
        >
          ชื่อของฉัน
        </button>
        <button type="button" onClick={() => setSelected("intro")}>
          ข้อความแนะนำตัว
        </button>
        <button type="button" onClick={() => setSelected("hobby")}>
          งานอดิเรก
        </button>
        <button
          type="button"
          className="mock-site__link"
          onClick={() => setSelected("contact")}
        >
          Contact
        </button>
      </div>
      <div className="explorer-detail" aria-live="polite">
        {active ? (
          <>
            <span className="section-kicker">{active.label}</span>
            <h3>{active.role}</h3>
            <p>HTML กำหนดโครงสร้างขององค์ประกอบนี้</p>
          </>
        ) : (
          <p>เลือกส่วนหนึ่งของหน้าเว็บไซต์เพื่อดูว่าเป็นองค์ประกอบใด</p>
        )}
      </div>
    </div>
  );
}

export function StructureExplorer() {
  const [selected, setSelected] = useState("html");
  const active = structureParts.find((part) => part.id === selected)!;
  return (
    <div className="interactive-block structure-explorer">
      <div className="structure-tree" role="group" aria-label="โครงสร้าง HTML">
        {structureParts.map((part) => (
          <button
            key={part.id}
            type="button"
            onClick={() => setSelected(part.id)}
            className={`structure-node structure-node--depth-${part.depth} ${selected === part.id ? "structure-node--selected" : ""}`}
            aria-pressed={selected === part.id}
          >
            {part.label}
          </button>
        ))}
      </div>
      <div className="explorer-detail" aria-live="polite">
        <span className="section-kicker">ELEMENT</span>
        <h3>{active.label}</h3>
        <p>{active.description}</p>
      </div>
    </div>
  );
}

const tagCategories = ["Heading", "Text", "Image", "Link", "List"] as const;

export function TagExplorer() {
  const [category, setCategory] =
    useState<(typeof tagCategories)[number]>("Heading");
  const [selected, setSelected] = useState(tagReference[0].tag);
  const tags = tagReference.filter((item) => item.category === category);
  const active: TagReference =
    tagReference.find((item) => item.tag === selected) ?? tags[0];
  function selectCategory(next: typeof category) {
    setCategory(next);
    setSelected(tagReference.find((item) => item.category === next)!.tag);
  }
  return (
    <div className="tag-explorer">
      <div className="tag-categories" role="tablist" aria-label="หมวดหมู่ Tag">
        {tagCategories.map((item) => (
          <button
            key={item}
            role="tab"
            type="button"
            aria-selected={category === item}
            className={category === item ? "active" : ""}
            onClick={() => selectCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="tag-explorer__body">
        <div className="tag-list" aria-label="รายการ Tag">
          {tags.map((item) => (
            <button
              type="button"
              key={item.tag}
              className={selected === item.tag ? "selected" : ""}
              onClick={() => setSelected(item.tag)}
              aria-pressed={selected === item.tag}
            >
              <code>{item.tag}</code>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        <div className="tag-detail" aria-live="polite">
          <span className="section-kicker">HTML TAG EXPLORER</span>
          <h3>
            <code>{active.tag}</code> <span>{active.name}</span>
          </h3>
          <p>{active.role}</p>
          {active.attributes && (
            <ul>
              {active.attributes.map((attribute) => (
                <li key={attribute}>{attribute}</li>
              ))}
            </ul>
          )}
          {active.examples?.map((example) => (
            <div key={example.label}>
              <CodeExample example={example} />
              <div className="tag-preview">
                <span>PREVIEW</span>
                <iframe
                  title={`ตัวอย่าง ${active.name}`}
                  sandbox=""
                  srcDoc={example.code}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QuickCheckPanel({ check }: { check: QuickCheck }) {
  const [answer, setAnswer] = useState("");
  const [show, setShow] = useState(false);
  return (
    <div className="quick-check">
      <span className="section-kicker">QUICK CHECK · ไม่บันทึกคะแนน</span>
      <h2>{check.question}</h2>
      <label htmlFor="quick-answer">ลองตอบด้วยคำของตัวเอง</label>
      <textarea
        id="quick-answer"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        rows={4}
        placeholder="พิมพ์คำตอบของคุณที่นี่"
      />
      <button
        type="button"
        className="button button--secondary"
        onClick={() => setShow((value) => !value)}
        aria-expanded={show}
      >
        <Lightbulb size={16} /> {show ? "ซ่อนแนวคิด" : "ดูแนวคิด"}
      </button>
      {show && <p className="quick-check__concept">{check.expectedConcept}</p>}
    </div>
  );
}

export function FinalProjectOverview() {
  return (
    <div className="project-overview">
      {finalProjectPages.map((page, index) => (
        <article key={page.id}>
          <span className="section-kicker">PAGE {index + 1}</span>
          <h3>{page.title}</h3>
          <strong>{page.heading}</strong>
          <ul>
            {page.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
      <Link className="button button--primary" to="/workshop">
        เริ่ม Workshop <ArrowRight size={17} />
      </Link>
    </div>
  );
}
