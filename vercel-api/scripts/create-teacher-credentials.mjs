import { randomBytes } from "node:crypto";
import { createTeacherPasswordHash } from "../lib/teacher-auth.mjs";

function hiddenPrompt(label) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) throw new Error("Run this command in an interactive terminal");
  process.stdout.write(label);
  return new Promise((resolve) => {
    let value = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const onData = (chunk) => {
      for (const char of String(chunk)) {
        if (char === "\r" || char === "\n") {
          process.stdin.off("data", onData);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") process.exit(130);
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    process.stdin.on("data", onData);
  });
}

try {
  const password = await hiddenPrompt("รหัสผ่านครู (อย่างน้อย 6 ตัวอักษร; ขณะพิมพ์จะไม่แสดง): ");
  const confirmation = await hiddenPrompt("พิมพ์รหัสผ่านอีกครั้ง: ");
  if (password !== confirmation) throw new Error("รหัสผ่านสองครั้งไม่ตรงกัน");
  const hash = await createTeacherPasswordHash(password);
  const secret = randomBytes(32).toString("base64url");
  process.stdout.write("\nคัดลอกค่าเหล่านี้ไปใส่ Vercel Production Secret (ไม่ต้องส่งในแชท):\n");
  process.stdout.write(`TEACHER_PASSWORD_HASH=${hash}\nTEACHER_SESSION_SECRET=${secret}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "สร้างข้อมูลไม่สำเร็จ"}\n`);
  process.exitCode = 1;
}
