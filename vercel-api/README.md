# WebQuest API และข้อมูลความก้าวหน้า

เว็บนักเรียนอยู่บน GitHub Pages ส่วน Vercel project นี้ (`vercel-api`) ให้บริการ `/api/chat`, `/api/auth/line`, `/api/progress` และ `/api/teacher` โดยตรวจ LINE ID token สำหรับนักเรียน และ Google ID token พร้อมรายชื่ออีเมลที่อนุญาตสำหรับครู ก่อนอ่านหรือเขียนข้อมูล

## ตั้งค่า Google Sheets (ทำครั้งเดียว)

1. สร้าง Google Sheet ใหม่ด้วยบัญชีของครู ตั้งชื่อเช่น `ความก้าวหน้า วิชาการสร้างเว็บไซต์` เก็บลิงก์ไว้เฉพาะผู้มีสิทธิ์ดูข้อมูลนักเรียน คัดลอก **Spreadsheet ID** ซึ่งอยู่ระหว่าง `/d/` และ `/edit` ใน URL
2. ใน [Google Cloud Console](https://console.cloud.google.com/) สร้างหรือเลือกโปรเจกต์สำหรับเว็บวิชานี้ ไปที่ **APIs & Services → Library** แล้วเปิด **Google Sheets API**
3. ไปที่ **IAM & Admin → Service Accounts → Create service account** สร้างบัญชีบริการสำหรับการบันทึกความก้าวหน้า ไม่จำเป็นต้องให้สิทธิ์ IAM ระดับโปรเจกต์กับบัญชีบริการนี้ จากหน้า Service account ไปที่ **Keys → Add key → Create new key → JSON** แล้วเก็บไฟล์ที่ดาวน์โหลดไว้เป็นความลับ
4. เปิด Sheet จากข้อ 1 กด **Share** แล้วเพิ่ม `client_email` ที่อยู่ในไฟล์ JSON เป็น **Editor** วิธีนี้ให้ API เข้าถึงเฉพาะ Sheet ที่แชร์
5. ที่ Vercel project ของ API (โดเมน `https://htmlwebclass-one.vercel.app`) ไปที่ **Settings → Environment Variables** เพิ่มค่าต่อไปนี้สำหรับ **Production**:

   - `GOOGLE_SHEET_ID` = Spreadsheet ID จากข้อ 1
   - `GOOGLE_SERVICE_ACCOUNT_JSON` = เนื้อหาทั้งหมดของไฟล์ JSON จากข้อ 3 (เก็บเป็น Secret/Sensitive ถ้า UI มีตัวเลือกนี้)
   - `LINE_CHANNEL_ID` = `2012268768` (ควรมีอยู่แล้ว)

6. **Redeploy** Vercel เพื่อให้ environment variables ใหม่มีผล ไม่ต้องส่งไฟล์ JSON, private key หรือ LINE ID token ในแชทหรืออัปโหลดเข้า GitHub
7. ที่ GitHub repository ไปที่ **Settings → Secrets and variables → Actions → Variables** เพิ่ม `VITE_PROGRESS_SYNC_ENABLED` ค่า `true` แล้วสั่งรัน **Actions → Deploy to GitHub Pages → Run workflow** อีกครั้ง ค่านี้เป็นเพียงสวิตช์เปิดฟีเจอร์ฝั่งเว็บ เปิดหลัง API ใช้งานได้แล้วเท่านั้น

เมื่อผู้เรียนเปิดเว็บผ่าน LIFF ครั้งแรก ระบบจะขอความยินยอมก่อนบันทึกชื่อ LINE และความก้าวหน้าลง Sheet ถ้ามีข้อมูลเดิมในเครื่องจะเลือกนำเข้าได้ ระบบสร้างแท็บ `Students` และหัวคอลัมน์ให้เอง ครูแก้คอลัมน์ **ห้องเรียน** ได้โดยตรง ข้อมูลบทเรียน คะแนน และสถานะ Code Lab/Workshop ซิงก์ตาม LINE user ID; โค้ดร่างของผู้เรียนเก็บเฉพาะในเครื่อง การเริ่มใช้บนอุปกรณ์ใหม่จะโหลดข้อมูลที่ซิงก์ไว้หลังล็อกอิน LINE

หาก Google Sheets ใช้งานไม่ได้ เว็บยังบันทึกข้อมูลในเครื่องและแสดงปุ่มให้ลองซิงก์อีกครั้ง **อย่าลบข้อมูลเว็บไซต์จากเบราว์เซอร์ก่อนซิงก์สำเร็จ** ค่า `VITE_PROGRESS_SYNC_ENABLED` เริ่มต้นเป็น `false` เพื่อให้เว็บเดิมทำงานได้ระหว่างตั้งค่า Google

## ค่าอื่นที่ใช้เดิม

- `GEMINI_API_KEY` ใส่เฉพาะใน Vercel หากต้องการใช้ AI chat
- `WEB_ORIGIN` ใช้เมื่อเว็บย้ายโดเมน (ใส่ origin เต็ม หลายค่าใช้ comma คั่น) ค่าเริ่มต้นรองรับ `https://s6802041510015-cpu.github.io` และ localhost
- `GEMINI_MODEL` เป็นตัวเลือกเสริม
- ที่ GitHub Actions Variables คง `VITE_AI_API_URL=https://htmlwebclass-one.vercel.app` และ `VITE_LIFF_ID=2012268768-BPIlGmOb`

LINE Developers ต้องตั้ง LIFF Endpoint URL เป็น `https://s6802041510015-cpu.github.io/web_creating_class/` และเปิด scopes `openid`, `profile` ลิงก์ LINE OA rich menu คือ `https://liff.line.me/2012268768-BPIlGmOb`

## เปิดใช้ AI ผู้ช่วย

ใน Vercel project เดิม เพิ่ม `GEMINI_API_KEY` เป็น **Secret** สำหรับ Production โดยใส่คีย์จาก Google AI Studio แล้ว Redeploy ค่า `GEMINI_MODEL` เป็น Config ตัวเลือกเสริม ค่าเริ่มต้นคือ `gemini-3.6-flash` ตรวจโควตา Free tier ของโปรเจกต์ใน AI Studio ก่อนเปิดใช้กับทั้งห้องเรียน

แชทใช้ LINE ID token ของผู้เรียนเพื่อยืนยันตัวตนก่อนเรียก Gemini คีย์ Gemini อยู่เฉพาะใน Vercel ไม่ส่งชื่อหรือ LINE user ID ไปยัง Gemini แชทซ่อนบนแบบทดสอบและให้คำใบ้สำหรับ Workshop; โค้ดจะส่งเมื่อผู้เรียนเลือกแนบเท่านั้น

## เปิดใช้เว็บครูด้วย Google

เว็บครูอยู่ที่ `https://s6802041510015-cpu.github.io/web_creating_class/teacher` ใช้บัญชี Google ที่ได้รับสิทธิ์และแยกจากการเข้าเว็บนักเรียนผ่าน LINE เว็บครูดูรายชื่อ คะแนน ความก้าวหน้า กรองห้อง ค้นหานักเรียน และแก้ไขห้องได้ API ตรวจ Google ID token และรายชื่ออีเมลที่อนุญาตทุกคำขอ

1. ใน Google Cloud project `htmlweb-class` เปิด **Google Auth Platform** ตั้งค่า Branding และ Audience สำหรับ Sign in with Google หากใช้โหมด Testing ให้เพิ่มอีเมลครูเป็น Test user
2. เปิด **Clients → Create client → Web application** เพิ่ม Authorized JavaScript origins เป็น `https://s6802041510015-cpu.github.io` (ไม่มี path) สำหรับทดสอบในเครื่องเพิ่ม `http://localhost` และ `http://localhost:5174` ไม่ต้องใช้ Client Secret กับขั้นตอนนี้
3. คัดลอก Client ID ที่ลงท้าย `.apps.googleusercontent.com` แล้วตั้ง Vercel Production Config:
   - `GOOGLE_OAUTH_CLIENT_ID` = Client ID นี้
   - `TEACHER_EMAILS` = `s6802041510015@email.kmutnb.ac.th` (ถ้ามีหลายคนใช้ comma คั่น)
4. Redeploy Vercel จากนั้นตั้ง GitHub Actions Repository Variable `VITE_GOOGLE_CLIENT_ID` เป็น Client ID เดียวกัน แล้วรัน Deploy to GitHub Pages ใหม่
5. เปิด URL เว็บครูด้วย Chrome หรือเบราว์เซอร์ปกติ เข้าด้วยบัญชี Google ที่อนุญาต แล้วตรวจรายชื่อจาก Sheet การเข้าสู่ระบบเก็บ ID token ในหน่วยความจำของหน้าเว็บเท่านั้น เมื่อรีโหลดอาจต้องเข้าสู่ระบบใหม่

หน้าเว็บครูไม่เปิดข้อมูลเมื่อยังไม่ได้ตั้งค่าหรือบัญชีไม่มีสิทธิ์ การจัดห้องแก้เฉพาะคอลัมน์ C ของแท็บ Students และการซิงก์ของนักเรียนไม่เขียนคอลัมน์นี้ ครูไม่ควรเปิด Sheet เป็น Anyone with the link เพราะมีข้อมูลนักเรียน

คู่มือ Google: [ตั้งค่า Sign in with Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) และ [ตรวจ ID token บนเซิร์ฟเวอร์](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
