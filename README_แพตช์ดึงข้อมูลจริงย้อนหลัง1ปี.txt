# แพตช์ดึงข้อมูลจริงย้อนหลัง 1 ปี

ไฟล์นี้เพิ่มปุ่มในเมนู นำเข้า:
- ดึงข้อมูลจริงของหวยที่เลือก
- ดึงข้อมูลจริงทุกแหล่งที่รองรับ

แหล่งข้อมูลที่ตั้งไว้:
1) หวยรัฐบาลไทย: https://lotto.thaiorc.com/thai/stats/lottery-years1.php
2) หวยออมสิน: https://lotto.thaiorc.com/gsb/stats/lottery-years1.php
3) หวย ธ.ก.ส.: https://lotto.thaiorc.com/baac/stats/lottery-years1.php
4) ลาวพัฒนา: https://lotto.thaiorc.com/lao/stats/lottery-years1.php
5) ฮานอยปกติ: https://lotto.thaiorc.com/hanoi/stats/lottery-years1.php
6) ฮานอยพิเศษ: https://lotto.thaiorc.com/hanoiextra/stats/lottery-years1.php
7) ฮานอย VIP: https://lotto.thaiorc.com/hanoivip/stats/lottery-years1.php

หมายเหตุ:
- เมนูที่ยังไม่มีแหล่งข้อมูล 1 ปีที่ชัดเจนจะถูกข้าม ไม่ใส่ข้อมูลมั่ว
- ข้อมูลที่ดึงได้จะบันทึกลง Netlify Blobs เป็นข้อมูลกลาง สมาชิกทุกคนเห็นเหมือนกัน
- ต้องใส่ Master Update PIN ให้ตรงกับ ADMIN_PIN ก่อนกดดึงข้อมูล
