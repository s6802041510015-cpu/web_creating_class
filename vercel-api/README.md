# WebQuest API

โปรเจกต์ Vercel นี้ให้บริการ `/api/chat` และ `/api/auth/line` เว็บบทเรียนยังอยู่บน GitHub Pages

1. Push โฟลเดอร์ `vercel-api` ขึ้น repository `web_creating_class`.
2. ใน Vercel เลือก **Create New → Project** และ import repository นี้.
3. ตั้ง **Root Directory** เป็น `vercel-api` และชื่อโปรเจกต์ที่ต้องการ เช่น `webclass-ai`.
4. เพิ่ม Environment Variable `LINE_CHANNEL_ID=2012268768` ใน Production. ไม่ต้องใช้ Channel Secret สำหรับการตรวจ ID token แบบนี้. หากต้องการใช้ AI chat ด้วย ให้เพิ่ม `GEMINI_API_KEY` จาก Google AI Studio เฉพาะใน Vercel; อย่าใส่ key ใน Git หรือ Vite.
5. Deploy แล้วคัดลอก origin เช่น `https://webclass-ai.vercel.app` (ไม่มี `/api/chat`).
6. ที่ GitHub repository `web_creating_class` เพิ่ม **Settings → Secrets and variables → Actions → Variables** ชื่อ `VITE_AI_API_URL` โดยใส่ origin นี้ (ไม่มี `/api/chat`). เพิ่ม `VITE_LIFF_ID=2012268768-BPIlGmOb`. GitHub Pages workflow จะส่งสองค่านี้ให้ Vite ตอน build.
7. สำหรับ localhost ให้สร้าง `.env.local` ที่ root ของเว็บด้วย `VITE_AI_API_URL=https://...vercel.app` และยังไม่ต้องใส่ `VITE_LIFF_ID` เพื่อใช้โหมดทดลอง. การทดสอบ LINE Login จริงให้ทำที่ GitHub Pages หลัง deploy; หากต้องทดสอบจากเครื่อง ต้องมี HTTPS tunnel และตั้ง Endpoint URL ของ LIFF สำหรับ URL นั้น.

ใน LINE Developers ให้ LIFF app มี Endpoint URL เป็น `https://s6802041510015-cpu.github.io/web_creating_class/` และเปิด scopes `openid` กับ `profile` (`profile` ใช้แสดงชื่อผู้เรียน). URL ใน LINE OA rich menu ของแอปนี้คือ `https://liff.line.me/2012268768-BPIlGmOb`.

หลังตั้งค่า `LINE_CHANNEL_ID` ใน Vercel ให้ redeploy API. หลังตั้งค่า GitHub Actions variables ให้ build/deploy เว็บใหม่เพื่อให้ค่าฝั่ง Vite มีผล. อย่านำ ID token หรือ Channel Secret ไปบันทึกใน repository. ID token ถูกส่งไป Vercel เพื่อตรวจสอบกับ LINE และไม่เก็บใน localStorage.

ขณะนี้ LINE Login ยืนยันตัวผู้เรียนและแสดงชื่อเท่านั้น ความก้าวหน้าและแบบทดสอบยังอยู่ใน localStorage ของเบราว์เซอร์ ยังไม่เชื่อม Google Sheets หรือแยกข้อมูลผู้เรียนตาม LINE user ID.

ค่า `WEB_ORIGIN` เพิ่มได้ถ้าเว็บเปลี่ยนโดเมน โดยใส่ origin เต็ม เช่น `https://example.com` (หลายค่าใช้ comma คั่น). ค่าเริ่มต้นรองรับ `https://s6802041510015-cpu.github.io` และ localhost. `GEMINI_MODEL` เป็นตัวเลือกเสริม ค่าเริ่มต้นคือ `gemini-3.6-flash`.
