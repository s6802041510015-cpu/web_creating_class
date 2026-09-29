import type { Example, Lesson, ObjectiveId } from "./types";

export const objectives: Record<ObjectiveId, string> = {
  1: "บอกความหมายของภาษา HTML ได้อย่างถูกต้อง",
  2: "บอกหน้าที่ของภาษา HTML ได้อย่างถูกต้อง",
  3: "อธิบายโครงสร้างพื้นฐานของ HTML ได้",
  4: "อธิบายการใช้งาน Tag พื้นฐานในการสร้างเว็บไซต์ได้",
  5: "สร้างเว็บไซต์แนะนำตัวเองได้",
};

export const htmlStructureCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>เว็บไซต์ของฉัน</title>
</head>
<body>
  <h1>ยินดีต้อนรับ</h1>
  <p>นี่คือเว็บไซต์ของฉัน</p>
</body>
</html>`;

export const introQuestions = [
  {
    question:
      "นักเรียนเคยเข้าเว็บไซต์ต่าง ๆ เช่น Google, YouTube หรือเว็บไซต์ของวิทยาลัยไหม แล้วนักเรียนสังเกตเห็นอะไรอยู่บนหน้าเว็บไซต์บ้าง",
    answer: "มีข้อความ รูปภาพ เมนู ปุ่ม และลิงก์ต่าง ๆ",
  },
  {
    question:
      "นักเรียนเคยสงสัยไหมว่า ข้อความ รูปภาพ หรือเมนูต่าง ๆ ที่เราเห็นบนหน้าเว็บไซต์นั้น ถูกสร้างขึ้นมาได้อย่างไร",
    answer: "ไม่ทราบ",
  },
  {
    question:
      "ถ้าต้องการสร้างเว็บไซต์แนะนำตัวเอง โดยให้มีชื่อ รูปภาพ และข้อมูลส่วนตัว ควรใช้ภาษาอะไรในการสร้างโครงสร้างของหน้าเว็บไซต์",
    answer: "ภาษา HTML",
  },
  {
    question: "HTML มีหน้าที่อะไรในการสร้างเว็บไซต์",
    answer: "ยังไม่ทราบ / ใช้เป็นคำถามเชื่อมเข้าสู่เนื้อหา",
  },
];

export const htmlTerms = [
  {
    letter: "H",
    title: "HyperText",
    description:
      "ข้อความที่สามารถเชื่อมโยงจากหน้าเว็บหนึ่งไปยังอีกหน้าเว็บหนึ่ง หรือไปยังข้อมูลอื่นได้",
  },
  {
    letter: "M",
    title: "Markup",
    description:
      "การใช้เครื่องหมายหรือ Tag เพื่อกำหนดความหมายและโครงสร้างให้กับเนื้อหา",
  },
  {
    letter: "L",
    title: "Language",
    description: "รูปแบบภาษาที่มีกฎและรูปแบบในการเขียน เพื่อใช้กำหนดเอกสารเว็บ",
  },
];

export const htmlRoles = [
  {
    title: "สร้างโครงสร้าง",
    description:
      "เปรียบเสมือนโครงกระดูกของเว็บไซต์ ใช้กำหนดว่าส่วนไหนเป็นหัวข้อ ย่อหน้า รูปภาพ",
  },
  {
    title: "จัดระเบียบเนื้อหา",
    description:
      "ใช้คำสั่งที่เรียกว่า Tag เช่น <p> สำหรับย่อหน้า และ <a> สำหรับทำลิงก์",
  },
  {
    title: "แสดงผลผ่าน Browser",
    description:
      "Browser อ่านข้อมูล HTML และแสดงผลเป็นหน้าเว็บให้ผู้ใช้มองเห็น",
  },
];

export const mockWebsiteParts = [
  { id: "image", label: "รูปภาพ", role: "Image" },
  { id: "name", label: "ชื่อของฉัน", role: "Heading" },
  { id: "intro", label: "ข้อความแนะนำตัว", role: "Paragraph" },
  { id: "hobby", label: "งานอดิเรก", role: "องค์ประกอบบนหน้าเว็บไซต์" },
  { id: "contact", label: "Contact", role: "Link" },
];

export const structureParts = [
  {
    id: "html",
    label: "HTML",
    depth: 0,
    description:
      "เป็น Element หลักหรือ Root Element ครอบเนื้อหา HTML ทั้งหมดของเอกสาร",
  },
  {
    id: "head",
    label: "HEAD",
    depth: 1,
    description:
      "เป็นส่วนข้อมูลเกี่ยวกับเอกสาร ใช้กำหนด Metadata และการตั้งค่าต่าง ๆ ของเอกสาร",
  },
  {
    id: "meta",
    label: "META",
    depth: 2,
    description: "กำหนดข้อมูลและการตั้งค่าบางอย่างของเอกสาร ไม่แสดงเป็นเนื้อหา",
  },
  {
    id: "title",
    label: "TITLE",
    depth: 2,
    description:
      "กำหนดชื่อของเอกสารหรือหน้าเว็บไซต์ โดยทั่วไปแสดงบริเวณ Tab ของเว็บเบราว์เซอร์",
  },
  {
    id: "body",
    label: "BODY",
    depth: 1,
    description: "เก็บเนื้อหาหลักที่แสดงให้ผู้ใช้งานเห็นบนหน้าเว็บไซต์",
  },
  { id: "h1", label: "H1", depth: 2, description: "กำหนดหัวข้อของเนื้อหา" },
  { id: "p", label: "P", depth: 2, description: "กำหนดข้อความให้เป็นย่อหน้า" },
];

export const structureComparison = [
  {
    tag: "<head>",
    role: "เก็บข้อมูลและการตั้งค่าที่เกี่ยวข้องกับเอกสาร",
    display: "โดยทั่วไปไม่แสดงเป็นเนื้อหาบนหน้าเว็บ",
  },
  {
    tag: "<body>",
    role: "เก็บเนื้อหาหลักของหน้าเว็บไซต์",
    display: "แสดงบนหน้าเว็บ",
  },
  {
    tag: "<title>",
    role: "กำหนดชื่อเอกสารหรือหน้าเว็บ",
    display: "แสดงที่ Tab Browser",
  },
  {
    tag: "<meta>",
    role: "กำหนดข้อมูลและการตั้งค่าบางอย่างของเอกสาร",
    display: "ไม่แสดงเป็นเนื้อหา",
  },
];

export type TagReference = {
  tag: string;
  name: string;
  role: string;
  category: "Heading" | "Text" | "Image" | "Link" | "List";
  attributes?: string[];
  examples?: Example[];
};
export const tagReference: TagReference[] = [
  {
    tag: "<h1>–<h6>",
    name: "Heading",
    role: "กำหนดหัวข้อของเนื้อหา มี 6 ระดับ",
    category: "Heading",
    examples: [
      {
        label: "Heading Tag",
        code: "<h1>หัวข้อระดับที่ 1</h1>\n<h2>หัวข้อระดับที่ 2</h2>\n<h3>หัวข้อระดับที่ 3</h3>\n<h4>หัวข้อระดับที่ 4</h4>\n<h5>หัวข้อระดับที่ 5</h5>\n<h6>หัวข้อระดับที่ 6</h6>",
      },
    ],
  },
  {
    tag: "<p>",
    name: "Paragraph",
    role: "กำหนดข้อความให้เป็นย่อหน้า เหมาะสำหรับเนื้อหาหรือคำอธิบายบนหน้าเว็บไซต์",
    category: "Text",
    examples: [
      {
        label: "Paragraph",
        code: "<p>ชื่อของฉันคือ สมชาย ใจดี</p>\n<p>กำลังศึกษาอยู่ระดับ ปวช.1</p>\n<p>ฉันสนใจการสร้างเว็บไซต์</p>",
      },
    ],
  },
  {
    tag: "<br>",
    name: "Line Break",
    role: "ขึ้นบรรทัดใหม่ภายในข้อความ เป็น Element ที่ไม่ต้องมี Tag ปิด ควรใช้เมื่อต้องการตัดบรรทัดภายในเนื้อหา และไม่ควรใช้แทนการจัดโครงสร้างย่อหน้าทั้งหมด",
    category: "Text",
    examples: [
      {
        label: "Line Break",
        code: "ชื่อ: สมชาย ใจดี<br>\nระดับชั้น: ปวช.1<br>\nแผนกวิชา: เทคโนโลยีสารสนเทศ",
      },
    ],
  },
  {
    tag: "<img>",
    name: "Image",
    role: "นำรูปภาพมาแสดงบนหน้าเว็บไซต์",
    category: "Image",
    attributes: [
      "src — ระบุตำแหน่งหรือชื่อไฟล์รูปภาพ",
      "alt — ข้อความอธิบายรูปภาพเมื่อรูปไม่สามารถแสดงได้ และช่วยด้านการเข้าถึง",
      "width — กำหนดความกว้างของรูปภาพ",
    ],
    examples: [
      {
        label: "Image",
        code: '<img src="profile.jpg"\n     alt="รูปประจำตัว"\n     width="200">',
      },
    ],
  },
  {
    tag: "<a>",
    name: "Anchor",
    role: "สร้าง Hyperlink เพื่อเชื่อมโยงไปยังหน้าเว็บไซต์อื่น หน้าเว็บภายในเว็บไซต์ หรือทรัพยากรอื่น",
    category: "Link",
    attributes: ["href — กำหนดปลายทางของลิงก์"],
    examples: [
      {
        label: "Anchor",
        code: '<a href="https://www.google.com">\n  ไปยัง Google\n</a>',
      },
    ],
  },
  {
    tag: "<ul>",
    name: "Unordered List",
    role: "สร้างรายการแบบไม่มีลำดับ",
    category: "List",
    examples: [
      {
        label: "Unordered List",
        code: "<ul>\n  <li>ฟังเพลง</li>\n  <li>ถ่ายรูป</li>\n  <li>เล่นกีฬา</li>\n</ul>",
      },
    ],
  },
  {
    tag: "<ol>",
    name: "Ordered List",
    role: "สร้างรายการแบบมีลำดับ",
    category: "List",
    examples: [
      {
        label: "Ordered List",
        code: "<ol>\n  <li>การสร้างเว็บไซต์</li>\n  <li>การเขียนโปรแกรม</li>\n  <li>คอมพิวเตอร์กราฟิก</li>\n</ol>",
      },
    ],
  },
  {
    tag: "<li>",
    name: "List Item",
    role: "กำหนดข้อมูลแต่ละรายการ",
    category: "List",
  },
  {
    tag: "<strong>",
    name: "Strong Importance",
    role: "กำหนดข้อความสำคัญ",
    category: "Text",
  },
  { tag: "<em>", name: "Emphasis", role: "เน้นข้อความ", category: "Text" },
];

export const lessons: Lesson[] = [
  {
    id: "00",
    title: "เตรียมความพร้อม",
    kind: "preparation",
    intro: ["เชื่อมโยงประสบการณ์ของผู้เรียนกับเว็บไซต์ที่พบในชีวิตประจำวัน"],
    learn: [],
    examples: [],
    summary: [
      "เว็บไซต์ที่เราใช้งานในชีวิตประจำวันประกอบด้วยข้อความ รูปภาพ เมนู และลิงก์ต่าง ๆ",
      "องค์ประกอบเหล่านี้สามารถสร้างและกำหนดโครงสร้างด้วยภาษา HTML",
      "จากนั้นผู้เรียนจะเรียนรู้ความหมายของ HTML หน้าที่ของ HTML โครงสร้างพื้นฐาน Tag พื้นฐาน และการสร้างเว็บไซต์แนะนำตัวเอง",
    ],
  },
  {
    id: "01",
    title: "ความหมายของภาษา HTML",
    kind: "knowledge",
    objective: 1,
    intro: [
      "HTML ย่อมาจาก HyperText Markup Language",
      "HTML เป็นภาษามาร์กอัปที่ใช้สำหรับสร้างและกำหนดโครงสร้างของหน้าเว็บไซต์ เพื่อให้เว็บเบราว์เซอร์สามารถอ่านและแสดงผลเนื้อหาต่าง ๆ บนหน้าเว็บไซต์ได้",
    ],
    learn: htmlTerms.map((term) => ({
      title: term.title,
      paragraphs: [term.description],
    })),
    examples: [],
    quickCheck: {
      question: "ภาษา HTML คืออะไร และใช้สำหรับทำอะไร",
      expectedConcept:
        "HTML คือภาษาที่ใช้สำหรับสร้างและกำหนดโครงสร้างของหน้าเว็บไซต์",
    },
    summary: ["HTML = HyperText + Markup + Language"],
  },
  {
    id: "02",
    title: "หน้าที่ของภาษา HTML",
    kind: "knowledge",
    objective: 2,
    intro: [
      "ภาษา HTML มีหน้าที่หลักในการกำหนดโครงสร้างและองค์ประกอบของเนื้อหาบนหน้าเว็บไซต์",
      "HTML ใช้ Tag เพื่อบอกเว็บเบราว์เซอร์ว่าเนื้อหาแต่ละส่วนเป็นอะไร เช่น หัวข้อ ข้อความ รูปภาพ รายการ ลิงก์",
    ],
    learn: htmlRoles.map((role) => ({
      title: role.title,
      paragraphs: [role.description],
    })),
    examples: [],
    quickCheck: {
      question: "ภาษา HTML มีหน้าที่อะไรในการสร้างเว็บไซต์",
      expectedConcept:
        "กำหนดโครงสร้างและองค์ประกอบต่าง ๆ ของหน้าเว็บไซต์ เช่น ข้อความ รูปภาพ หัวข้อ ลิงก์",
    },
    summary: ["HTML = โครงสร้างของเว็บไซต์"],
  },
  {
    id: "03",
    title: "โครงสร้างพื้นฐานของ HTML",
    kind: "knowledge",
    objective: 3,
    intro: [
      "HTML มีรูปแบบและโครงสร้างที่เป็นลำดับ เพื่อให้เว็บเบราว์เซอร์สามารถอ่านและแสดงผลข้อมูลได้อย่างถูกต้อง",
      "เอกสาร HTML ประกอบด้วย Element และ Tag ที่จัดวางซ้อนกันอย่างเป็นระบบ",
    ],
    learn: [
      {
        title: "<!DOCTYPE html>",
        paragraphs: [
          "ประกาศประเภทของเอกสาร อยู่บริเวณบรรทัดแรกของเอกสาร HTML แจ้งเว็บเบราว์เซอร์ว่าเอกสารที่กำลังเปิดเป็น HTML5",
        ],
      },
      {
        title: "<html>",
        paragraphs: [
          "เป็น Element หลักหรือ Root Element ครอบเนื้อหา HTML ทั้งหมดของเอกสาร",
          "Opening: <html> • Closing: </html>",
        ],
      },
      {
        title: "<head>",
        paragraphs: [
          "เป็นส่วนข้อมูลเกี่ยวกับเอกสาร ใช้กำหนด Metadata และการตั้งค่าต่าง ๆ ของเอกสาร",
          "ข้อมูลส่วนใหญ่ใน head ไม่แสดงเป็นเนื้อหาโดยตรงบนหน้าเว็บไซต์",
        ],
      },
      {
        title: '<meta charset="UTF-8">',
        paragraphs: [
          "กำหนดรูปแบบการเข้ารหัสตัวอักษร เพื่อให้ Browser แสดงตัวอักษรและภาษาต่าง ๆ รวมถึงภาษาไทยได้อย่างถูกต้อง",
        ],
      },
      {
        title: "<title>",
        paragraphs: [
          "กำหนดชื่อของเอกสารหรือหน้าเว็บไซต์ โดยทั่วไปแสดงบริเวณ Tab ของเว็บเบราว์เซอร์",
        ],
        example: { label: "Title", code: "<title>เว็บไซต์แนะนำตัว</title>" },
      },
      {
        title: "<body>",
        paragraphs: ["เก็บเนื้อหาหลักที่แสดงให้ผู้ใช้งานเห็นบนหน้าเว็บไซต์"],
        example: {
          label: "Body",
          code: "<body>\n  <h1>ประวัติส่วนตัว</h1>\n  <p>ชื่อ สมชาย ใจดี</p>\n  <p>กำลังศึกษาอยู่ระดับ ปวช.1</p>\n</body>",
        },
      },
    ],
    examples: [{ label: "โครงสร้างเอกสาร HTML", code: htmlStructureCode }],
    quickCheck: {
      question: "โครงสร้างพื้นฐานของเอกสาร HTML ประกอบด้วยส่วนสำคัญอะไรบ้าง",
      expectedConcept:
        "<html>, <head>, <body> โดย <head> เก็บข้อมูลเกี่ยวกับหน้าเว็บ และ <body> เก็บเนื้อหาที่แสดงบนหน้าเว็บไซต์",
    },
    summary: [
      "<head> เก็บข้อมูลและการตั้งค่าที่เกี่ยวข้องกับเอกสาร",
      "<body> เก็บเนื้อหาหลักของหน้าเว็บไซต์",
    ],
  },
  {
    id: "04",
    title: "การใช้งาน Tag พื้นฐาน",
    kind: "knowledge",
    objective: 4,
    intro: [
      "Tag คือคำสั่งที่ใช้กำหนดโครงสร้างและความหมายขององค์ประกอบต่าง ๆ บนหน้าเว็บไซต์ เช่น หัวข้อ ข้อความ รูปภาพ ลิงก์",
      "Tag เขียนอยู่ภายในเครื่องหมาย < >",
      "Tag ส่วนใหญ่ประกอบด้วย Opening Tag และ Closing Tag โดย Tag ปิดจะมีเครื่องหมาย / เพิ่มเข้ามา",
    ],
    learn: tagReference.map((tag) => ({
      title: tag.tag,
      paragraphs: [tag.role],
      example: tag.examples?.[0],
    })),
    examples: [],
    quickCheck: {
      question: "Tag พื้นฐานของ HTML ที่นักเรียนรู้จักมีอะไรบ้าง และใช้ทำอะไร",
      expectedConcept:
        "<h1> สำหรับหัวข้อ, <p> สำหรับข้อความหรือย่อหน้า, <img> สำหรับรูปภาพ, <a> สำหรับลิงก์",
    },
    summary: [
      "<h1>–<h6> กำหนดหัวข้อ",
      "<p> กำหนดย่อหน้าหรือข้อความ",
      "<br> ขึ้นบรรทัดใหม่",
      "<img> แสดงรูปภาพ",
      "<a> สร้างลิงก์",
      "<ul> และ <ol> สร้างรายการ",
      "<li> กำหนดข้อมูลแต่ละรายการ",
      "<strong> กำหนดข้อความสำคัญ",
      "<em> เน้นข้อความ",
    ],
  },
  {
    id: "05",
    title: "สร้างเว็บไซต์แนะนำตัวเอง",
    kind: "project",
    objective: 5,
    intro: [
      "สร้างเว็บไซต์แนะนำตัวเองจำนวน 3 หน้า โดยใช้โครงสร้างพื้นฐาน HTML และ Tag พื้นฐานที่ได้เรียน",
      "สร้าง Link เชื่อมโยงระหว่างทั้ง 3 หน้า",
    ],
    learn: [],
    examples: [],
    summary: [
      "หน้าแนะนำตัว",
      "หน้างานอดิเรกและความสนใจ",
      "หน้าข้อมูลเพิ่มเติมและช่องทางการติดต่อ",
    ],
  },
];
