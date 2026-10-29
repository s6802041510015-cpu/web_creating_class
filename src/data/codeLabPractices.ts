export type PracticeId = "heading" | "paragraph" | "image" | "link" | "list";

type Criterion = {
  label: string;
  guidance: string;
  test: (document: Document) => boolean;
};

export type CodeLabPractice = {
  id: PracticeId;
  title: string;
  task: string;
  expected: string;
  starterCode: string;
  hints: string[];
  criteria: Criterion[];
};

const page = (title: string, body: string) => `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
${body}
</body>
</html>`;

const studentImage = `${import.meta.env.BASE_URL}assets/webquest-student.png`;

export const codeLabPractices: CodeLabPractice[] = [
  {
    id: "heading",
    title: "Heading",
    task: "สร้างหน้าแนะนำตัวที่มีหัวเรื่องหลักและหัวเรื่องรอง เรียงลำดับให้ผู้อ่านเข้าใจง่าย",
    expected: "หัวเรื่องใหญ่ “ยินดีต้อนรับ” ตามด้วยหัวเรื่องรอง “เกี่ยวกับฉัน” และข้อความแนะนำตัว",
    starterCode: page("ฝึก Heading", `  <h1>ยินดีต้อนรับ</h1>
  <!-- เพิ่มหัวเรื่องรองตรงนี้ -->
  <p>นี่คือเว็บไซต์ของฉัน</p>`),
    hints: [
      "หัวเรื่องหลักใช้ <h1> ส่วนหัวเรื่องรองใช้แท็กอีกระดับหนึ่ง",
      "ลองเพิ่ม <h2> ไว้ระหว่าง <h1> กับ <p>",
      "ตัวอย่าง: <h2>เกี่ยวกับฉัน</h2> แล้วกดตรวจคำตอบ",
    ],
    criteria: [
      { label: "มีหัวเรื่องหลัก <h1>", guidance: "เพิ่ม <h1> ที่มีข้อความอยู่ภายใน", test: (doc) => !!doc.querySelector("h1")?.textContent?.trim() },
      { label: "มีหัวเรื่องรอง <h2>", guidance: "เพิ่ม <h2> ที่มีข้อความอยู่ภายใน", test: (doc) => !!doc.querySelector("h2")?.textContent?.trim() },
      { label: "เรียง h1 ก่อน h2", guidance: "ย้าย <h2> ให้อยู่หลัง <h1>", test: (doc) => {
        const h1 = doc.querySelector("h1");
        const h2 = doc.querySelector("h2");
        return !!h1 && !!h2 && !!(h1.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING);
      } },
    ],
  },
  {
    id: "paragraph",
    title: "Paragraph",
    task: "เขียนข้อความแนะนำตัวเป็นอย่างน้อย 2 ย่อหน้า โดยแต่ละย่อหน้ามีเนื้อหาจริง",
    expected: "หัวเรื่อง “เกี่ยวกับฉัน” และข้อความ 2 ย่อหน้าที่แยกบรรทัดอย่างชัดเจน",
    starterCode: page("ฝึก Paragraph", `  <h1>เกี่ยวกับฉัน</h1>
  <p>ฉันกำลังเรียนรู้การสร้างเว็บไซต์</p>
  <!-- เขียนย่อหน้าที่สองตรงนี้ -->`),
    hints: [
      "ย่อหน้าใน HTML ใช้แท็ก <p> ไม่ต้องกด Enter หลายครั้งเพื่อเว้นบรรทัด",
      "เพิ่ม <p>...</p> อีกหนึ่งชุดใต้ย่อหน้าแรก",
      "ตัวอย่าง: <p>ฉันอยากสร้างเว็บไซต์แนะนำตัวเอง</p>",
    ],
    criteria: [
      { label: "มีข้อความอย่างน้อย 2 ย่อหน้า", guidance: "เพิ่มแท็ก <p> ให้ครบ 2 ชุด", test: (doc) => doc.querySelectorAll("p").length >= 2 },
      { label: "แต่ละย่อหน้ามีข้อความ", guidance: "เติมข้อความในทุกแท็ก <p> อย่าปล่อยว่าง", test: (doc) => [...doc.querySelectorAll("p")].length >= 2 && [...doc.querySelectorAll("p")].every((p) => !!p.textContent?.trim()) },
    ],
  },
  {
    id: "image",
    title: "Image",
    task: "แสดงภาพตัวละครในหน้าเว็บ แล้วเพิ่มคำอธิบายภาพใน alt เพื่อให้ผู้ที่มองไม่เห็นภาพเข้าใจเนื้อหา",
    expected: "หัวเรื่อง “ภาพของฉัน” และภาพตัวละครพร้อมคำอธิบายที่เหมาะสม",
    starterCode: page("ฝึก Image", `  <h1>ภาพของฉัน</h1>
  <img src="${studentImage}" width="220">
  <!-- เพิ่ม alt ที่แท็ก img -->`),
    hints: [
      "ภาพใช้แท็ก <img> โดย src บอกตำแหน่งไฟล์ และ alt บอกความหมายของภาพ",
      "เพิ่มแอตทริบิวต์ alt ในแท็ก <img> เดิม ไม่ต้องสร้างภาพใหม่",
      "ตัวอย่าง: alt=\"ตัวละครนักเรียนกำลังเรียนเขียนเว็บไซต์\"",
    ],
    criteria: [
      { label: "มีแท็กภาพพร้อม src", guidance: "เพิ่ม <img> และระบุ src ของภาพ", test: (doc) => [...doc.querySelectorAll("img")].some((img) => !!img.getAttribute("src")?.trim()) },
      { label: "ภาพมี alt ที่อธิบายได้", guidance: "เพิ่ม alt เป็นคำอธิบายภาพที่สื่อความหมายอย่างน้อย 5 ตัวอักษร", test: (doc) => [...doc.querySelectorAll("img")].some((img) => !!img.getAttribute("src")?.trim() && (img.getAttribute("alt")?.trim().length ?? 0) >= 5) },
    ],
  },
  {
    id: "link",
    title: "Link",
    task: "เพิ่มลิงก์ “ไปที่ช่องทางติดต่อ” ให้คลิกแล้วเลื่อนไปยังหัวข้อช่องทางติดต่อในหน้าเดียวกัน",
    expected: "ลิงก์ที่คลิกได้ และหัวข้อ “ช่องทางติดต่อ” เป็นปลายทางของลิงก์",
    starterCode: page("ฝึก Link", `  <h1>เว็บไซต์ของฉัน</h1>
  <!-- เพิ่มลิงก์ตรงนี้ -->
  <p>ยินดีต้อนรับสู่เว็บไซต์ของฉัน</p>
  <h2 id="contact">ช่องทางติดต่อ</h2>
  <p>ส่งข้อความมาพูดคุยกันได้</p>`),
    hints: [
      "ลิงก์ใช้แท็ก <a> และแอตทริบิวต์ href ระบุปลายทาง",
      "การลิงก์ไปยัง id ในหน้าเดียวกัน ให้ใส่ # หน้า id ใน href",
      "ตัวอย่าง: <a href=\"#contact\">ไปที่ช่องทางติดต่อ</a>",
    ],
    criteria: [
      { label: "มีลิงก์พร้อมข้อความ", guidance: "เพิ่ม <a> ที่มีข้อความให้คลิก", test: (doc) => [...doc.querySelectorAll("a")].some((a) => !!a.textContent?.trim()) },
      { label: "ลิงก์ไปยัง #contact", guidance: "ตั้ง href=\"#contact\" ในแท็ก <a>", test: (doc) => !!doc.querySelector('a[href="#contact"]') },
      { label: "มีปลายทาง id=contact", guidance: "เพิ่ม id=\"contact\" ที่หัวข้อปลายทาง", test: (doc) => !!doc.getElementById("contact") },
    ],
  },
  {
    id: "list",
    title: "List",
    task: "ทำรายการสิ่งที่อยากเรียนรู้เกี่ยวกับเว็บไซต์อย่างน้อย 3 ข้อ ด้วยรายการแบบไม่เรียงลำดับ",
    expected: "หัวเรื่อง “สิ่งที่อยากเรียนรู้” และรายการมีจุดนำหน้าอย่างน้อย 3 ข้อ",
    starterCode: page("ฝึก List", `  <h1>สิ่งที่อยากเรียนรู้</h1>
  <ul>
    <li>เขียน HTML</li>
    <!-- เพิ่มรายการอีก 2 ข้อ -->
  </ul>`),
    hints: [
      "รายการแบบมีจุดนำหน้าใช้ <ul> และแต่ละข้อใช้ <li>",
      "เพิ่ม <li>...</li> ภายใน <ul> อีก 2 ชุด",
      "ตัวอย่าง: <li>ตกแต่งด้วย CSS</li>",
    ],
    criteria: [
      { label: "ใช้รายการแบบ <ul>", guidance: "สร้างแท็ก <ul> สำหรับครอบรายการ", test: (doc) => !!doc.querySelector("ul") },
      { label: "มีรายการอย่างน้อย 3 ข้อ", guidance: "เพิ่ม <li> ใน <ul> ให้ครบ 3 ข้อ", test: (doc) => !![...doc.querySelectorAll("ul")].find((ul) => ul.querySelectorAll(":scope > li").length >= 3) },
      { label: "ทุกรายการมีข้อความ", guidance: "เติมข้อความในแต่ละ <li> อย่าปล่อยว่าง", test: (doc) => !![...doc.querySelectorAll("ul")].find((ul) => { const items = [...ul.querySelectorAll(":scope > li")]; return items.length >= 3 && items.every((item) => !!item.textContent?.trim()); }) },
    ],
  },
];

export type CheckResult = { label: string; guidance: string; passed: boolean };

export function checkPractice(practice: CodeLabPractice, code: string): CheckResult[] {
  const document = new DOMParser().parseFromString(code, "text/html");
  return practice.criteria.map(({ label, guidance, test }) => ({
    label,
    guidance,
    passed: test(document),
  }));
}
