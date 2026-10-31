# WebHTML Class API และข้อมูลความก้าวหน้า

เว็บนักเรียนอยู่บน GitHub Pages ส่วน Vercel project นี้ (`vercel-api`) ให้บริการ `/api/chat`, `/api/auth/line`, `/api/student`, `/api/progress`, `/api/teacher/login` และ `/api/teacher` โดยตรวจ LINE ID token สำหรับนักเรียน และชื่อผู้ใช้ รหัสผ่าน พร้อมเซสชันสำหรับครู ก่อนอ่านหรือเขียนข้อมูล

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

เมื่อผู้เรียนเปิดเว็บผ่าน LIFF ครั้งแรก ระบบจะให้กรอกรหัสนักเรียน ชื่อ-นามสกุล เลขที่ และชั้น/ห้อง แล้วบันทึกลงแท็บ `Students` ก่อนเข้าบทเรียน ผู้เรียนที่เคยใช้ระบบก่อนเพิ่มฟีเจอร์นี้จะกรอกเพียงครั้งเดียวโดยคงความก้าวหน้าเดิมไว้ จากนั้นระบบจะแยกถามการบันทึกความก้าวหน้าลง Sheet ถ้ามีข้อมูลเดิมในเครื่องจะเลือกนำเข้าได้ ครูแก้คอลัมน์ **ห้องเรียน** ได้โดยตรง ข้อมูลบทเรียน คะแนน และสถานะ Code Lab/Workshop ซิงก์ตาม LINE user ID; โค้ดร่างของผู้เรียนเก็บเฉพาะในเครื่อง การเริ่มใช้บนอุปกรณ์ใหม่จะโหลดข้อมูลที่ซิงก์ไว้หลังล็อกอิน LINE

คอลัมน์ A:K เดิมยังอยู่ตามเดิม โดยเพิ่ม L:O เป็น **รหัสนักเรียน**, **ชื่อ-นามสกุล**, **เลขที่**, **ชั้นที่นักเรียนระบุ** ระบบใช้ชั้นที่กรอกตั้งต้นในคอลัมน์ C เฉพาะเมื่อยังไม่มีห้องที่ครูระบุ การลงทะเบียนซ้ำด้วย LINE เดิมจะอ่านข้อมูลเดิมและไม่เขียนทับ รหัสนักเรียนเดียวกันไม่ให้ลงทะเบียนกับ LINE อีกบัญชีหนึ่ง ข้อมูลที่นักเรียนกรอกเป็นข้อมูลที่ผู้เรียนระบุเอง ครูควรตรวจเทียบรายชื่อจริง และตั้งการแชร์ Sheet เป็น **Restricted/จำกัด** เพราะมีข้อมูลส่วนบุคคล

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

## เปิดใช้เว็บครูด้วยชื่อผู้ใช้และรหัสผ่าน

เว็บครูอยู่ที่ `https://s6802041510015-cpu.github.io/web_creating_class/teacher` และใช้บัญชีครูแยกจาก LINE ของนักเรียน ครูทุกบัญชีเห็นข้อมูลและใช้ฟังก์ชันเดียวกัน เว็บครูดูชื่อจริง รหัสนักเรียน เลขที่ คะแนน ความก้าวหน้า กรองห้อง ค้นหา และแก้ไขห้องได้ API ตรวจเซสชันที่ลงลายเซ็นก่อนอ่านหรือเขียนข้อมูลทุกคำขอ

1. เปิด PowerShell ในโฟลเดอร์ `vercel-api` แล้วรัน `npm run teacher:credentials` พิมพ์รหัสผ่านอย่างน้อย 6 ตัวอักษรสองครั้ง ควรใช้รหัสที่ยาวและไม่ซ้ำกับที่อื่น ตัวอักษรจะไม่แสดงบนหน้าจอ คำสั่งจะแสดง `TEACHER_PASSWORD_HASH` และ `TEACHER_SESSION_SECRET` สำหรับคัดลอก ไม่เก็บรหัสผ่านลงไฟล์
2. ใน Vercel project ของ API ไปที่ **Settings → Environment Variables** เพิ่มสำหรับ **Production**:
   - `TEACHER_USERNAME` = ชื่อผู้ใช้ที่ต้องการ เช่น `katawut` (Config)
   - `TEACHER_PASSWORD_HASH` = ค่าที่ได้จากคำสั่งข้อ 1 (Secret)
   - `TEACHER_SESSION_SECRET` = ค่าที่ได้จากคำสั่งข้อ 1 (Secret)
3. กด **Redeploy** เพื่อให้ค่าใหม่มีผล ไม่ต้องตั้ง Google OAuth Client ID หรือ GitHub Actions variable สำหรับเว็บครู
4. เปิด URL เว็บครูแล้วเข้าสู่ระบบด้วยชื่อผู้ใช้จากข้อ 2 และรหัสผ่านที่เลือกในข้อ 1 ไม่ต้องใส่ค่าแฮชเป็นรหัสผ่าน

### เพิ่มครูอีก 2 บัญชี

1. เปิด PowerShell ใน `vercel-api` แล้วรัน `npm run teacher:extra-accounts` กรอกชื่อผู้ใช้ใหม่ 2 ชื่อที่ไม่ซ้ำกับ `TEACHER_USERNAME` และตั้งรหัสผ่านแยกกันอย่างน้อย 6 ตัวอักษร คำสั่งจะแสดง JSON หนึ่งบรรทัดโดยไม่แสดงรหัสผ่าน
2. ใน Vercel project `htmlweb_class` → **Settings → Environment Variables** เพิ่ม `TEACHER_EXTRA_ACCOUNTS_JSON` เป็น **Secret** สำหรับ **Production** คัดลอกเฉพาะข้อความหลัง `=` ทั้งบรรทัดจากผลคำสั่งไปใส่ Value บัญชีเดิมและค่า `TEACHER_SESSION_SECRET` คงเดิม
3. กด **Redeploy** แล้วครูทั้ง 3 คนใช้หน้าเว็บครู URL เดียวกัน แต่เข้าสู่ระบบด้วยชื่อและรหัสของตัวเอง หากต้องเปลี่ยนรหัสของครูคนใหม่ ให้รันคำสั่งอีกครั้งสำหรับทั้ง 2 บัญชีและแทนค่า Secret นี้

รหัสผ่านและกุญแจเซสชันอยู่เฉพาะ Vercel ส่วนเว็บถือโทเค็นไว้ในหน่วยความจำและต้องเข้าสู่ระบบใหม่เมื่อรีโหลดหรือครบ 8 ชั่วโมง การเปลี่ยนรหัสผ่านของบัญชีใดจะทำให้เซสชันของบัญชีนั้นใช้ไม่ได้ ระบบจำกัดความถี่การลองรหัสผ่านในแต่ละอินสแตนซ์ของ API หากครูคนใหม่ต้องกด **เปิด Google Sheet** โดยตรง ให้เจ้าของ Sheet แชร์สิทธิ์ให้บัญชี Google ของครูคนนั้นด้วย เพราะ Sheet ยังตั้งเป็น Restricted

หน้าเว็บครูไม่เปิดข้อมูลเมื่อยังไม่ได้ตั้งค่าหรือยังไม่เข้าสู่ระบบ การจัดห้องแก้เฉพาะคอลัมน์ C ของแท็บ Students และการซิงก์ของนักเรียนไม่เขียนคอลัมน์นี้ คงการแชร์ Sheet เป็น **Restricted/จำกัด** เพราะมีข้อมูลนักเรียน

ในเว็บครู เลือกห้องจากตัวกรองแล้วกด **สร้างแท็บห้องนี้** ระบบจะเพิ่มแท็บของห้องใน Spreadsheet เดิมและส่งลิงก์ไปยังแท็บนั้น แท็บห้องใช้สูตร `FILTER` อ่านข้อมูลจาก `Students` จึงตามข้อมูลใหม่และการย้ายห้องโดยอัตโนมัติ การกดซ้ำใช้แท็บเดิม ควรแก้ไขข้อมูลที่เว็บครูหรือแท็บ `Students` เพราะแท็บห้องเป็นมุมมองจากสูตร

## เว็บลาเรียนแยกจากเว็บบทเรียน

เว็บลาอยู่ในโฟลเดอร์ `leave-app` และต้องเป็น **Vercel project ใหม่** ที่ตั้ง Root Directory เป็น `leave-app` ใช้โดเมนของตัวเอง นักเรียนเปิดจากปุ่มใน LINE OA Rich Menu ได้ตรง ไม่ต้องเข้าเว็บบทเรียน ส่วนครูเปิดเมนู **คำขอลา** ในเว็บครูเดิมที่ `/teacher/leaves`

1. สร้าง **Google Sheet ไฟล์ใหม่** สำหรับการลาโดยเฉพาะ ตั้ง Share → General access เป็น **Restricted / จำกัด** แล้วแชร์อีเมล `client_email` ของ Service Account เดิมเป็น Editor คัดลอก Spreadsheet ID ระหว่าง `/d/` กับ `/edit` ใน URL ไม่ต้องสร้างแท็บเอง API จะสร้าง `LeaveStudents` และ `LeaveRequests` เมื่อใช้งานครั้งแรก
2. ใน Vercel project **API เดิม** (`htmlweb_class`, Root Directory `vercel-api`) เพิ่ม Environment Variables สำหรับ Production: `LEAVE_GOOGLE_SHEET_ID` = ID ของ Sheet ใหม่, `LEAVE_WEB_ORIGIN` = origin ของเว็บลา เช่น `https://ชื่อโปรเจกต์.vercel.app` (ไม่มี `/` ท้าย), `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` = Channel access token ของ **Messaging API channel ที่ผูกกับ LINE OA ของนักเรียน** โดยเก็บเป็น Secret อย่าใส่ token ใน GitHub หรือในตัวแปร `VITE_...` แล้ว Redeploy API
3. ใน LINE Developers สร้าง **LIFF app ใหม่** ใต้ LINE Login channel เดิม (`2012268768`) ตั้ง Endpoint URL เป็นโดเมนเว็บลา เปิด scope `openid` และ `profile` เก็บ LIFF ID ใหม่ โดยไม่เปลี่ยน LIFF app ของเว็บบทเรียน **LINE OA ที่จะส่งข้อความต้องมี Messaging API channel อยู่ใน Provider เดียวกับ LINE Login channel นี้** เพราะ LINE ออกรหัสผู้ใช้คนละค่าระหว่าง Provider หาก OA อยู่คนละ Provider ต้องจัดช่องใหม่ให้ตรงกันก่อนตั้ง `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`
4. ใน Vercel สร้าง project ใหม่จาก repository `web_creating_class` โดยเลือก Root Directory = `leave-app`, Framework Preset = Vite ตั้ง `VITE_LEAVE_LIFF_ID` = LIFF ID ใหม่ และ `VITE_API_URL` = `https://htmlwebclass-one.vercel.app` แล้ว Deploy หากโดเมนจริงต่างจาก Endpoint ที่ตั้งในข้อ 3 ให้กลับไปแก้ Endpoint URL ให้ตรงกับโดเมนเว็บลาและ `LEAVE_WEB_ORIGIN` ให้ตรงกัน
5. ตั้งปุ่ม **ลาเรียน** ใน LINE OA Rich Menu เป็นลิงก์ `https://liff.line.me/2012268768-OA0WjKIC` การส่งคำขอจะบันทึกใน Sheet ใหม่และขอส่งข้อความรับเรื่องไปยัง OA; เมื่อครูอนุมัติหรือไม่อนุมัติ API จะบันทึกผลและขอส่งข้อความผลไปยังนักเรียนคนเดิม การส่งข้อความอาจไม่ถึงผู้ที่บล็อก OA หรือเมื่อเกินโควตา จึงยังดูผลในเว็บลาได้

ข้อมูลนักเรียนที่เคยลงทะเบียนในเว็บบทเรียนจะถูกดึงมาเติมให้อัตโนมัติจาก Sheet เดิมผ่าน LINE user ID แต่คำขอลาและรายชื่อของเว็บลาบันทึกแยกใน Sheet ใหม่ นักเรียนใหม่ที่ไม่เคยเข้าเว็บบทเรียนสามารถกรอกข้อมูลในเว็บลาครั้งแรกได้ การเปิด Sheet ให้ครูคนอื่นดูยังต้องแชร์สิทธิ์ Google Sheet ใหม่กับบัญชี Google ของครูนั้นโดยตรง
