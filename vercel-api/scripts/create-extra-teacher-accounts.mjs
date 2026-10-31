import { createTeacherPasswordHash } from "../lib/teacher-auth.mjs";

function prompt(label, hidden = false) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) throw new Error("Run this command in an interactive terminal");
  process.stdout.write(label);
  return new Promise((resolve) => {
    let value = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const onData = (chunk) => {
      for (const char of String(chunk)) {
        if (char === "\u0003") {
          process.stdin.off("data", onData);
          process.stdin.setRawMode(false);
          process.exit(130);
        }
        if (char === "\r" || char === "\n") {
          process.stdin.off("data", onData);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value) {
            value = value.slice(0, -1);
            if (!hidden) process.stdout.write("\b \b");
          }
        } else if (char >= " ") {
          value += char;
          if (!hidden) process.stdout.write(char);
        }
      }
    };
    process.stdin.on("data", onData);
  });
}

try {
  const accounts = [];
  process.stdout.write("สร้างบัญชีครูเพิ่ม 2 คน (ชื่อผู้ใช้ห้ามซ้ำกับบัญชีเดิม)\n");
  for (let index = 1; index <= 2; index += 1) {
    const name = (await prompt(`ชื่อผู้ใช้ครูคนใหม่ที่ ${index}: `)).trim();
    const normalized = name.normalize("NFKC").toLowerCase();
    if (!name || name.length > 100 || /[\x00-\x1f\x7f]/.test(name) || accounts.some((entry) => entry.name.normalize("NFKC").toLowerCase() === normalized)) {
      throw new Error("ชื่อผู้ใช้ไม่ถูกต้องหรือซ้ำกัน");
    }
    const password = await prompt("รหัสผ่าน (อย่างน้อย 6 ตัวอักษร; ขณะพิมพ์จะไม่แสดง): ", true);
    const confirmation = await prompt("พิมพ์รหัสผ่านอีกครั้ง: ", true);
    if (password !== confirmation) throw new Error("รหัสผ่านสองครั้งไม่ตรงกัน");
    accounts.push({ name, passwordHash: await createTeacherPasswordHash(password) });
  }
  process.stdout.write("\nคัดลอกเฉพาะค่าหลังเครื่องหมาย = ไปใส่ Vercel Production Secret (ไม่ต้องส่งในแชท):\n");
  process.stdout.write(`TEACHER_EXTRA_ACCOUNTS_JSON=${JSON.stringify(accounts)}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "สร้างบัญชีไม่สำเร็จ"}\n`);
  process.exitCode = 1;
}
