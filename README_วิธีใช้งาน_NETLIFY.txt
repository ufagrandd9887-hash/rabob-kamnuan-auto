# ระบบคำนวนอัตโนมัติ - Netlify Manual Update

เวอร์ชันนี้ออกแบบให้ใช้งานบน Netlify ได้จริง โดยไม่ต้องใช้ API key

## สิ่งที่มีในแพ็กเกจ
- index.html หน้าเว็บหลัก
- netlify/functions/results.mjs ดึงข้อมูลกลางของหวยที่เลือก
- netlify/functions/manual-update.mjs ให้ Master อัปเดตข้อมูลเองจากหน้าเว็บ
- netlify/functions/all-data.mjs ดูข้อมูลรวมทุกหวย
- data/default-history.json ข้อมูลตั้งต้น
- data/markets.json รายการหวย
- package.json และ netlify.toml สำหรับ Netlify

## วิธีอัปโหลดที่แนะนำ
วิธีที่ดีที่สุดคือใช้ GitHub + Netlify หรือ Netlify CLI เพราะแพ็กเกจนี้มี Netlify Functions

### วิธีผ่าน GitHub
1. แตกไฟล์ ZIP นี้
2. อัปโหลดโฟลเดอร์ทั้งหมดขึ้น GitHub repository
3. เข้า Netlify > Add new site > Import from Git
4. เลือก repository
5. Build command: npm run build
6. Publish directory: .
7. Deploy

### ตั้งค่า Master Update PIN
ไปที่ Netlify Site settings > Environment variables
เพิ่มค่า:
ADMIN_PIN=รหัสที่เพื่อนต้องการ

ถ้าไม่ตั้งค่า ระบบจะใช้ค่าเริ่มต้น 123456

## วิธีอัปเดตข้อมูลเองจากหน้าเว็บ
1. เข้าเว็บด้วย master / 123456
2. ไปที่เมนู นำเข้า
3. เลือกหวยที่ต้องการ
4. ใส่ Master Update PIN
5. วาง CSV หรือเลือกไฟล์ CSV
6. กด อัปโหลดข้อมูลหวยนี้ขึ้น Netlify
7. สมาชิกทุกคนจะเห็นข้อมูลใหม่เมื่อกดดึงข้อมูลออนไลน์หรือเปิดหน้าเว็บใหม่

## รูปแบบ CSV
draw_date,result,n3,n2
09/07/2569,1234,234,34
08/07/2569,8097,097,97

## หมายเหตุสำคัญ
- ระบบนี้ไม่มี API key จึงไม่ได้ดึงหวยลาว/ฮานอยจากเว็บจริงอัตโนมัติ 100%
- Master เป็นคนอัปเดตข้อมูลจริงเองได้จากหน้าเว็บ
- ข้อมูลที่อัปโหลดจะเก็บไว้ใน Netlify Blobs และทุกคนเห็นข้อมูลกลางชุดเดียวกัน
- ควรเปลี่ยน ADMIN_PIN ก่อนใช้งานจริง
