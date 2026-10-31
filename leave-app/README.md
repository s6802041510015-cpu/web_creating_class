# WebHTML Leave

เว็บแจ้งลาเรียนแยกจากเว็บบทเรียน ใช้ LINE Login channel เดิม แต่สร้าง LIFF app ใหม่ที่มี Endpoint เป็น URL เว็บนี้

โดเมน Production: https://webhtml-leave.vercel.app/

## พัฒนาในเครื่อง

```bash
npm install
npm run dev
npm run build
```

คัดลอก `.env.example` เป็น `.env.local` แล้วตั้ง `VITE_LEAVE_LIFF_ID` และ `VITE_API_URL` (สองค่านี้ไม่ใช่ Secret)

## นำขึ้น Vercel

สร้าง Vercel project ใหม่จาก repository เดิม โดยตั้ง **Root Directory = `leave-app`**, Framework Preset = Vite, ตั้ง `VITE_LEAVE_LIFF_ID` เป็น LIFF ID ของเว็บลา และ `VITE_API_URL` เป็น URL ของ Vercel API เดิม หลังได้โดเมนแล้วนำไปตั้งเป็น Endpoint URL ของ LIFF app และเพิ่มโดเมนใน `LEAVE_WEB_ORIGIN` ของ Vercel API project

ใน LINE OA Rich Menu ให้ปุ่มลาเรียนเปิด LIFF URL `https://liff.line.me/2012268768-OA0WjKIC` นักเรียนจึงเข้าเว็บลาได้โดยตรง

API project ต้องตั้ง `LEAVE_GOOGLE_SHEET_ID` เป็น ID ของ **Google Sheet ไฟล์ใหม่** ที่แชร์ให้ Service Account เดิมเป็น Editor และ `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` เป็น Secret ของ Messaging API channel ที่ผูกกับ OA (สำหรับข้อความรับเรื่องและผลพิจารณา) ช่อง Messaging API นี้ต้องอยู่ใน Provider เดียวกับ LINE Login channel ของ LIFF มิฉะนั้นรหัสผู้ใช้จาก LIFF จะใช้ส่งข้อความผ่าน OA ไม่ได้
