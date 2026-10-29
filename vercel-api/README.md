# WebQuest API และข้อมูลความก้าวหน้า

เว็บนักเรียนอยู่บน GitHub Pages ส่วน Vercel project นี้ (`vercel-api`) ให้บริการ `/api/chat`, `/api/auth/line` และ `/api/progress` โดย API ตรวจ LINE ID token กับ LINE ก่อนอ่านหรือเขียนข้อมูลของผู้เรียนแต่ละคน

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
