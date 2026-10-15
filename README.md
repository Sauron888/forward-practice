# Forward

เว็บฝึกทำข้อสอบ 3 วิชา (ไฟล์เดียว) พร้อมตัวกลางเรียก Gemini สำหรับคิดข้อใหม่

## โครงสร้าง
- `index.html`        หน้าเว็บ
- `api/generate.js`   ฟังก์ชันบน Vercel ที่เรียก Gemini (key อยู่ฝั่งเซิร์ฟเวอร์)

## ตั้งค่าใน Vercel (Settings > Environment Variables)
| Key | Value |
|---|---|
| `GEMINI_API_KEY` | API key จาก Google AI Studio (จำเป็น) |
| `GEMINI_MODEL` | ชื่อโมเดล เช่น `gemini-3.8-flash` (ไม่บังคับ) |
| `RATE_LIMIT` | จำนวนครั้งต่อ IP ต่อ 10 นาที ค่าเริ่มต้น 12 (ไม่บังคับ) |

บันทึกแล้วกด Redeploy ห้ามใส่ key ในไฟล์โค้ดหรือ GitHub

## ตรวจว่าเชื่อมต่อแล้ว
เปิด `https://ชื่อเว็บของคุณ/api/generate` ต้องเห็น `{"configured":true}`
