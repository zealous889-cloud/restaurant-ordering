# 🍜 ระบบสั่งอาหารออนไลน์ (Online Food Ordering)

เว็บไซต์สั่งอาหารออนไลน์สำหรับร้านอาหาร — ลูกค้า **ต้องชำระเงินสำเร็จก่อน** ออเดอร์จึงจะถูกส่งเข้าครัว
ออกแบบ **Mobile First** รองรับแท็บเล็ตและคอมพิวเตอร์

## สถาปัตยกรรม

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | NestJS + Prisma |
| Database | PostgreSQL |
| Payment | Stripe (PromptPay QR + บัตรเครดิต) + Webhook |
| Real-time | Socket.IO |
| Auth | JWT (ผู้ดูแล / ครัว) |

## โครงสร้างฐานข้อมูล
`User`, `Category`, `Product`, `Order`, `OrderItem`, `Payment`, `KitchenStatus`
(ดู `backend/prisma/schema.prisma`)

## Flow การทำงาน
1. ลูกค้าเลือกอาหาร → เพิ่มลงตะกร้า → ยืนยันรายการ → กรอกชื่อ/เบอร์/หมายเหตุ
2. สร้าง Order สถานะ `PENDING_PAYMENT` (ตั้งเวลา `expiresAt` = 15 นาที)
3. ชำระเงินผ่าน Stripe (PromptPay QR หรือ บัตร)
4. Stripe ยิง **Webhook** → ตรวจสอบลายเซ็น → ถ้า `payment_intent.succeeded`:
   - บันทึก Payment = `SUCCEEDED`, Order = `PAID`, สร้าง `KitchenStatus = WAITING`
   - ส่ง event ผ่าน Socket.IO → ครัวเด้งออเดอร์ใหม่ + เสียงแจ้งเตือน, ลูกค้าเห็นสถานะ real-time
5. ถ้าชำระไม่สำเร็จ/ไม่ชำระ → Cron ภายในยกเลิก Order อัตโนมัติหลัง 15 นาที (`CANCELLED`)
6. ครัวเปลี่ยนสถานะ: รอทำอาหาร → กำลังทำ → พร้อมรับ → เสร็จสิ้น (ลูกค้าเห็น real-time)

> 🔒 หน้าจอครัวดึงเฉพาะออเดอร์ที่ `PAID`/`COMPLETED` เท่านั้น — ออเดอร์ที่ยังไม่จ่ายจะไม่มีวันเข้าครัว

## การติดตั้ง

### 1) ฐานข้อมูล
```bash
# วิธีง่ายสุด: ใช้ Docker
docker compose up -d db
```

### 2) Backend
```bash
cd backend
cp .env.example .env        # ใส่ DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate      # สร้างตาราง
npm run seed                # ข้อมูลตัวอย่าง + ผู้ใช้ admin/kitchen
npm run start:dev           # http://localhost:4000
```

### 3) Frontend
```bash
cd frontend
cp .env.example .env        # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:3000
```

### 4) ตั้งค่า Stripe Webhook (สำคัญ)
```bash
# ระหว่างพัฒนา ใช้ Stripe CLI ฟอร์เวิร์ด event เข้ามาที่ backend
stripe listen --forward-to localhost:4000/payments/webhook
# คัดลอกค่า whsec_... ไปใส่ STRIPE_WEBHOOK_SECRET ใน backend/.env
```
> PromptPay ต้องตั้ง currency = `thb` และเปิดใช้ PromptPay ใน Stripe Dashboard
> (PromptPay รองรับเฉพาะบัญชี Stripe ประเทศไทย)

### หรือรันทั้งหมดด้วย Docker
```bash
docker compose up --build
```

## บัญชีทดสอบ
- ผู้ดูแล: `admin@restaurant.local` / `admin1234`
- ครัว: `kitchen@restaurant.local` / `kitchen1234`

## หน้าจอหลัก
| เส้นทาง | ใช้งานโดย | รายละเอียด |
|---------|-----------|-----------|
| `/` | ลูกค้า | เมนู + ตะกร้า |
| `/cart` `/checkout` | ลูกค้า | ตะกร้า + กรอกข้อมูล |
| `/payment/[orderId]` | ลูกค้า | QR PromptPay / บัตร + สถานะ real-time |
| `/order/[orderId]` | ลูกค้า | เลขออเดอร์ + เวลารับ + ติดตามสถานะครัว |
| `/kitchen` | ครัว | Dashboard ออเดอร์ที่จ่ายแล้ว + เสียงแจ้งเตือน |
| `/admin` | ผู้ดูแล | จัดการเมนู (เพิ่ม/แก้/ลบ) |
| `/admin/reports` | ผู้ดูแล | ยอดขาย วัน/สัปดาห์/เดือน + Export Excel/CSV |
| `/admin/orders` | ผู้ดูแล | ประวัติการสั่งซื้อทั้งหมด |

## API หลัก
```
POST /auth/login
GET/POST/PATCH/DELETE /products            (CRUD เมนู, แก้/ลบ ต้องเป็น ADMIN)
GET  /categories
POST /orders                               สร้างออเดอร์ (สถานะ PENDING_PAYMENT)
GET  /orders/:id
POST /payments/:orderId/create  {method}   สร้าง PromptPay QR / Checkout Session
GET  /payments/:orderId/status             polling fallback
POST /payments/webhook                     Stripe webhook (ยืนยันการชำระ -> เข้าครัว)
GET  /kitchen/board                        ออเดอร์ที่จ่ายแล้ว (KITCHEN/ADMIN)
PATCH /kitchen/:orderId/state {state}      เปลี่ยนสถานะครัว
GET  /reports/summary?period=day|week|month
GET  /reports/export/excel|csv?period=...
```
