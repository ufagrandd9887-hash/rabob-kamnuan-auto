แพตช์นี้เป็นรอบเก็บความปลอดภัยก่อนส่งให้ผู้ใช้งาน

ไฟล์ที่ต้องอัปโหลดทับใน GitHub:
- index.html
- netlify.toml

หลังอัปโหลด:
1) กด Commit changes
2) Netlify > Deploys > Trigger deploy > Deploy site
3) เปิดเว็บแล้วกด Ctrl+F5

สำคัญมาก: ให้ลบไฟล์เหล่านี้ออกจาก GitHub repo ด้วย เพราะไม่ควรเผยแพร่ต่อสาธารณะ:
- rabob_kamnuan_auto_100users_accounts.csv
- rabob_kamnuan_auto_100users_accounts.txt
- sample_update_csv.csv
- real_history_sources.csv ถ้าไม่ต้องการเปิดเผยแหล่งข้อมูล

ถ้า GitHub repo เป็น Public แนะนำเปลี่ยนเป็น Private:
GitHub repo > Settings > General > Danger Zone > Change repository visibility > Private

หลัง Deploy แล้ว ให้เปลี่ยนรหัส master ในเว็บ และเก็บ ADMIN_PIN ไว้ส่วนตัว
