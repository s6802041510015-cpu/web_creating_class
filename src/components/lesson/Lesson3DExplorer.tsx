import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { Minus, Plus, RotateCcw, RotateCw } from "lucide-react";
import "./lesson-3d-explorer.css";

type SceneNode = {
  id: string;
  label: string;
  caption: string;
  description: string;
  code: string;
  x: number;
  y: number;
  z: number;
  color: string;
};

type Scene = { title: string; subtitle: string; relationship: string; nodes: SceneNode[] };

const scenes: Record<string, Scene> = {
  "01": {
    title: "ความหมายของ HTML",
    subtitle: "สำรวจ 3 ส่วนของคำว่า HyperText Markup Language",
    relationship: "ทั้งสามส่วนรวมกันเป็นภาษาที่กำหนดโครงสร้างหน้าเว็บและเชื่อมข้อมูลเข้าหากัน",
    nodes: [
      { id: "hypertext", label: "HyperText", caption: "ข้อความเชื่อมโยง", description: "ข้อความที่คลิกแล้วไปยังหน้าเว็บหรือข้อมูลอื่นได้ โดยมักสร้างด้วยลิงก์", code: '<a href="hobbies.html">งานอดิเรก</a>', x: 30, y: 62, z: 95, color: "#46d9f4" },
      { id: "markup", label: "Markup", caption: "กำหนดความหมาย", description: "Tag บอกว่าเนื้อหาแต่ละส่วนเป็นอะไร เช่น หัวข้อหรือย่อหน้า", code: "<h1>ประวัติส่วนตัว</h1>", x: 50, y: 23, z: 145, color: "#ab92ff" },
      { id: "language", label: "Language", caption: "รูปแบบการเขียน", description: "HTML มีกฎการเขียนเอกสาร เช่น การใช้ Tag เปิดและ Tag ปิดอย่างเหมาะสม", code: "<p>สวัสดี</p>", x: 70, y: 62, z: 75, color: "#ffb771" },
    ],
  },
  "02": {
    title: "หน้าที่ของ HTML",
    subtitle: "เห็นบทบาทของ HTML ผ่านองค์ประกอบบนหน้าเว็บ",
    relationship: "HTML บอกชนิดและลำดับของเนื้อหา ก่อนนำไปตกแต่งด้วย CSS",
    nodes: [
      { id: "heading", label: "หัวข้อ", caption: "Heading", description: "กำหนดชื่อเรื่องหรือหัวข้อของเนื้อหา ให้ผู้อ่านรู้ว่าหน้านี้พูดเรื่องอะไร", code: "<h1>เว็บไซต์ของฉัน</h1>", x: 30, y: 27, z: 110, color: "#a593ff" },
      { id: "paragraph", label: "ย่อหน้า", caption: "Paragraph", description: "จัดข้อความอธิบายเป็นย่อหน้าที่อ่านต่อเนื่องได้", code: "<p>ฉันกำลังเรียน ปวช.1</p>", x: 70, y: 29, z: 65, color: "#46d9f4" },
      { id: "image", label: "รูปภาพ", caption: "Image", description: "นำไฟล์ภาพมาแสดงและใส่ข้อความ alt เพื่ออธิบายภาพ", code: '<img src="profile.jpg" alt="รูปประจำตัว">', x: 30, y: 67, z: 70, color: "#ffb771" },
      { id: "link", label: "ลิงก์", caption: "Link", description: "เชื่อมผู้ใช้ไปยังหน้าเว็บหรือข้อมูลอื่นด้วยปลายทางใน href", code: '<a href="contact.html">ติดต่อ</a>', x: 70, y: 66, z: 125, color: "#5be5ae" },
    ],
  },
  "03": {
    title: "โครงสร้างเอกสาร HTML",
    subtitle: "หมุนดูว่าข้อมูลใน head กับเนื้อหาใน body อยู่ตรงไหน",
    relationship: "<html> ครอบ <head> และ <body>; <title> อยู่ใน head ส่วน <h1> อยู่ใน body",
    nodes: [
      { id: "html", label: "<html>", caption: "รากของเอกสาร", description: "Element หลักที่ครอบส่วนข้อมูลและส่วนเนื้อหาของหน้าเว็บทั้งหมด", code: "<html> ... </html>", x: 50, y: 16, z: 140, color: "#a593ff" },
      { id: "head", label: "<head>", caption: "ข้อมูลของหน้า", description: "เก็บการตั้งค่าและข้อมูลเกี่ยวกับเอกสาร โดยทั่วไปไม่ปรากฏเป็นเนื้อหาบนหน้าเว็บ", code: "<head> ... </head>", x: 30, y: 45, z: 80, color: "#46d9f4" },
      { id: "body", label: "<body>", caption: "เนื้อหาที่มองเห็น", description: "เก็บหัวข้อ ย่อหน้า รูปภาพ และลิงก์ที่ผู้ใช้เห็นในหน้าเว็บ", code: "<body> ... </body>", x: 70, y: 45, z: 80, color: "#5be5ae" },
      { id: "title", label: "<title>", caption: "ชื่อบนแท็บ", description: "อยู่ใน head และกำหนดชื่อที่แสดงบนแท็บของเบราว์เซอร์", code: "<title>เว็บไซต์ของฉัน</title>", x: 30, y: 76, z: 145, color: "#ffb771" },
      { id: "h1", label: "<h1>", caption: "หัวข้อบนหน้า", description: "อยู่ใน body และปรากฏเป็นหัวข้อหลักบนหน้าเว็บ", code: "<h1>ยินดีต้อนรับ</h1>", x: 70, y: 76, z: 145, color: "#f88bd4" },
    ],
  },
  "04": {
    title: "Tag พื้นฐาน",
    subtitle: "เลือก Tag เพื่อดูว่าข้อมูลแบบใดควรใช้ Tag นั้น",
    relationship: "เลือก Tag ให้ตรงกับความหมายของข้อมูล แล้วตรวจ Tag เปิดปิดและ attribute ที่จำเป็น",
    nodes: [
      { id: "heading", label: "<h1>", caption: "หัวข้อหลัก", description: "บอกหัวข้อหลักของหน้า ควรตามด้วยหัวข้อรองที่มีระดับเหมาะสม", code: "<h1>ประวัติส่วนตัว</h1>", x: 30, y: 25, z: 95, color: "#a593ff" },
      { id: "paragraph", label: "<p>", caption: "ย่อหน้า", description: "ใช้กับข้อความอธิบายหนึ่งย่อหน้า ไม่ใช้ <br> แทนทุกย่อหน้า", code: "<p>ฉันชอบวาดรูป</p>", x: 70, y: 25, z: 110, color: "#46d9f4" },
      { id: "image", label: "<img>", caption: "รูปภาพ", description: "ใช้ src ชี้ไปยังไฟล์ และ alt อธิบายภาพเมื่อภาพไม่แสดงหรือผู้ใช้เครื่องอ่านหน้าจอ", code: '<img src="hobby.jpg" alt="ภาพวาดของฉัน">', x: 50, y: 48, z: 155, color: "#ffb771" },
      { id: "link", label: "<a>", caption: "ลิงก์", description: "ใช้ href กำหนดหน้าเว็บปลายทางทั้งภายในและภายนอกเว็บไซต์", code: '<a href="hobbies.html">งานอดิเรก</a>', x: 30, y: 76, z: 105, color: "#5be5ae" },
      { id: "list", label: "<ul><li>", caption: "รายการ", description: "ใช้ ul สำหรับรายการไม่เรียงลำดับ หรือ ol สำหรับรายการเรียงลำดับ โดยมี li เป็นแต่ละข้อ", code: "<ul><li>วาดรูป</li></ul>", x: 70, y: 76, z: 90, color: "#f88bd4" },
    ],
  },
  "05": {
    title: "เว็บไซต์แนะนำตัว 3 หน้า",
    subtitle: "สำรวจหน้าที่ต้องสร้างและเส้นทางลิงก์ระหว่างหน้า",
    relationship: "ทั้งสามไฟล์อยู่ในโฟลเดอร์เดียวกัน และแต่ละหน้าควรมีลิงก์ไปหน้าอื่นและกลับหน้าแรก",
    nodes: [
      { id: "intro", label: "index.html", caption: "หน้าแนะนำตัว", description: "มีชื่อ ระดับชั้น ข้อความแนะนำตัว และรูปภาพประจำตัว", code: '<a href="hobbies.html">ดูงานอดิเรก</a>', x: 50, y: 23, z: 145, color: "#a593ff" },
      { id: "hobbies", label: "hobbies.html", caption: "งานอดิเรก", description: "มีงานอดิเรกอย่างน้อย 3 รายการ คำอธิบาย และรูปภาพประกอบ", code: '<a href="index.html">กลับหน้าแรก</a>', x: 30, y: 66, z: 85, color: "#46d9f4" },
      { id: "contact", label: "contact.html", caption: "ข้อมูลเพิ่มเติม", description: "มีความสามารถ ช่องทางติดต่อ และลิงก์เว็บไซต์ที่สนใจอย่างน้อยหนึ่งลิงก์", code: '<a href="index.html">กลับหน้าแรก</a>', x: 70, y: 66, z: 85, color: "#5be5ae" },
    ],
  },
};

const initialView = { x: -14, y: -8, zoom: 1 };

export function Lesson3DExplorer({ lessonId }: { lessonId: string }) {
  const scene = scenes[lessonId];
  const [view, setView] = useState(initialView);
  const [selectedId, setSelectedId] = useState(scene?.nodes[0].id ?? "");
  const drag = useRef<{ x: number; y: number; viewX: number; viewY: number } | null>(null);
  if (!scene) return null;
  const selected = scene.nodes.find((node) => node.id === selectedId) ?? scene.nodes[0];

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    drag.current = { x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    setView((current) => ({
      ...current,
      x: Math.max(-32, Math.min(32, start.viewX - dy * 0.22)),
      y: start.viewY + dx * 0.32,
    }));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setView((current) => ({ ...current, y: current.y + (event.key === "ArrowLeft" ? -15 : 15) }));
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setView((current) => ({ ...current, x: Math.max(-32, Math.min(32, current.x + (event.key === "ArrowUp" ? 10 : -10))) }));
    }
  }

  return (
    <section className="lesson-3d" aria-label={`โมเดล 3 มิติ: ${scene.title}`}>
      <div className="lesson-3d__heading">
        <div>
          <span className="section-kicker">INTERACTIVE 3D</span>
          <h3>{scene.title}</h3>
          <p>{scene.subtitle}</p>
        </div>
        <span className="lesson-3d__badge">ลากเพื่อหมุน · เลือกชิ้นส่วน</span>
      </div>
      <div
        className="lesson-3d__viewport"
        role="group"
        aria-label="ลากเพื่อหมุนโมเดล ใช้ปุ่มลูกศรบนแป้นพิมพ์เพื่อปรับมุมมอง"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onKeyDown={onKeyDown}
      >
        <div className="lesson-3d__grid" />
        <div className="lesson-3d__world">
        <div className="lesson-3d__rig" style={{ transform: `rotateX(${view.x}deg) rotateY(${view.y}deg) scale(${view.zoom})` }}>
          <div className="lesson-3d__base">
            <div className="lesson-3d__base-bar"><i /><i /><i /><span>HTML · {lessonId}</span></div>
            <div className="lesson-3d__base-lines"><span /><span /><span /></div>
          </div>
          {scene.nodes.map((node) => (
            <button
              type="button"
              key={node.id}
              className={`lesson-3d__node ${selected.id === node.id ? "lesson-3d__node--selected" : ""}`}
              style={{ "--node-x": `${node.x}%`, "--node-y": `${node.y}%`, "--node-z": `${node.z}px`, "--node-color": node.color } as CSSProperties}
              onClick={() => setSelectedId(node.id)}
              aria-pressed={selected.id === node.id}
            >
              <span className="lesson-3d__node-face"><strong>{node.label}</strong><small>{node.caption}</small></span>
              <span className="lesson-3d__node-back" aria-hidden="true"><strong>{node.label}</strong><small>{node.caption}</small></span>
            </button>
          ))}
        </div>
        </div>
      </div>
      <div className="lesson-3d__controls" aria-label="เครื่องมือปรับมุมมอง">
        <button type="button" onClick={() => setView((current) => ({ ...current, y: current.y - 20 }))} aria-label="หมุนซ้าย"><RotateCcw size={17} /> หมุนซ้าย</button>
        <button type="button" onClick={() => setView((current) => ({ ...current, y: current.y + 20 }))} aria-label="หมุนขวา"><RotateCw size={17} /> หมุนขวา</button>
        <button type="button" onClick={() => setView((current) => ({ ...current, zoom: Math.min(1.25, +(current.zoom + 0.1).toFixed(2)) }))} aria-label="ขยายโมเดล"><Plus size={17} /> ขยาย</button>
        <button type="button" onClick={() => setView((current) => ({ ...current, zoom: Math.max(0.75, +(current.zoom - 0.1).toFixed(2)) }))} aria-label="ย่อโมเดล"><Minus size={17} /> ย่อ</button>
        <button type="button" onClick={() => setView(initialView)} aria-label="คืนมุมมองเริ่มต้น"><RotateCcw size={17} /> เริ่มใหม่</button>
      </div>
      <div className="lesson-3d__detail" aria-live="polite">
        <div className="lesson-3d__selection">
          <span className="section-kicker">เลือกดูส่วนประกอบ</span>
          <div className="lesson-3d__choices">
            {scene.nodes.map((node) => <button type="button" key={node.id} className={selected.id === node.id ? "active" : ""} onClick={() => setSelectedId(node.id)} aria-pressed={selected.id === node.id}>{node.label}</button>)}
          </div>
        </div>
        <div className="lesson-3d__explanation">
          <strong style={{ color: selected.color }}>{selected.label} · {selected.caption}</strong>
          <p>{selected.description}</p>
          <code>{selected.code}</code>
          <small>{scene.relationship}</small>
        </div>
      </div>
    </section>
  );
}
