import type { ChecklistItem, FinalProjectPage } from "./types";

export const finalProjectPages: FinalProjectPage[] = [
  {
    id: "intro",
    title: "หน้าแนะนำตัว",
    heading: "ประวัติส่วนตัว",
    requirements: [
      "ชื่อ – นามสกุล",
      "ระดับชั้น / สาขาวิชา",
      "ข้อความแนะนำตัวโดยย่อ",
      "รูปภาพประจำตัวหรือรูปภาพที่เกี่ยวข้องกับตนเอง จำนวน 1 รูป",
    ],
  },
  {
    id: "hobbies",
    title: "งานอดิเรกและความสนใจ",
    heading: "งานอดิเรกและความสนใจ",
    requirements: [
      "งานอดิเรกหรือสิ่งที่สนใจอย่างน้อย 3 รายการ",
      "รายละเอียดเกี่ยวกับงานอดิเรกหรือความสนใจโดยย่อ",
      "รูปภาพประกอบอย่างน้อย 1 รูป",
    ],
  },
  {
    id: "more",
    title: "ข้อมูลเพิ่มเติม",
    heading: "ข้อมูลเพิ่มเติม",
    requirements: [
      "ข้อมูลหรือความสามารถของตนเอง",
      "ช่องทางการติดต่อหรือเว็บไซต์ที่ต้องการนำเสนอ",
      "ลิงก์ไปยังเว็บไซต์ที่สนใจอย่างน้อย 1 ลิงก์",
    ],
  },
];

export const projectWorkflow = [
  "เปิดโปรแกรมหรือพื้นที่สำหรับเขียน HTML",
  "สร้าง HTML จำนวน 3 หน้า",
  'ใส่โครงสร้าง HTML ให้ครบถ้วนในทุกหน้า: <!DOCTYPE html>, <html>, <head>, <meta charset="UTF-8">, <title>, <body>',
  "สร้างหน้าแนะนำตัว",
  "สร้างหน้างานอดิเรกและความสนใจ",
  "สร้างหน้าข้อมูลเพิ่มเติมและช่องทางการติดต่อ",
  "ใช้ Tag พื้นฐานให้เหมาะสม",
  "สร้าง Link เชื่อมทั้ง 3 หน้า",
  "ทดลองเปิดเว็บไซต์ผ่าน Browser",
  "ตรวจข้อความ รูปภาพ รายการ Link และ Tag เปิด/ปิด",
  "ทดสอบ Link ระหว่าง 3 หน้า",
  "บันทึกผลงาน",
];

export const projectChecklist: ChecklistItem[] = [
  { id: "pages", label: "มีเว็บไซต์ 3 หน้า" },
  { id: "structure", label: "ทุกหน้ามีโครงสร้าง HTML" },
  { id: "intro-information", label: "หน้าแนะนำตัวมีข้อมูลครบ" },
  { id: "intro-image", label: "มีรูปหน้าแนะนำตัว" },
  { id: "hobbies-three", label: "มีงานอดิเรกอย่างน้อย 3 รายการ" },
  { id: "hobbies-detail", label: "มีรายละเอียดงานอดิเรก" },
  { id: "hobbies-image", label: "มีรูปในหน้างานอดิเรก" },
  { id: "more-information", label: "มีข้อมูลเพิ่มเติม" },
  { id: "contact", label: "มีช่องทางติดต่อ" },
  { id: "external-link", label: "มีลิงก์เว็บไซต์ที่สนใจอย่างน้อย 1 ลิงก์" },
  { id: "internal-links", label: "ทั้ง 3 หน้าเชื่อมโยงกัน" },
  { id: "tags", label: "Tag เปิด/ปิดเหมาะสม" },
];

export const projectRequiredTags = [
  "<h1>–<h6> สำหรับหัวข้อ",
  "<p> สำหรับข้อความ",
  "<img> สำหรับรูปภาพ",
  "<ul> หรือ <ol> ร่วมกับ <li> สำหรับรายการ",
  "<a> สำหรับสร้างลิงก์",
];
