import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin + kitchen users
  const adminPass = await bcrypt.hash('admin1234', 10);
  const kitchenPass = await bcrypt.hash('kitchen1234', 10);

  await prisma.user.upsert({
    where: { email: 'admin@restaurant.local' },
    update: {},
    create: { email: 'admin@restaurant.local', password: adminPass, name: 'ผู้ดูแลระบบ', role: Role.ADMIN },
  });
  await prisma.user.upsert({
    where: { email: 'kitchen@restaurant.local' },
    update: {},
    create: { email: 'kitchen@restaurant.local', password: kitchenPass, name: 'ครัว', role: Role.KITCHEN },
  });

  const categories = [
    { name: 'อาหารจานเดียว', sortOrder: 1 },
    { name: 'ก๋วยเตี๋ยว', sortOrder: 2 },
    { name: 'เครื่องดื่ม', sortOrder: 3 },
    { name: 'ของหวาน', sortOrder: 4 },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    catMap[c.name] = created.id;
  }

  const products = [
    { name: 'ข้าวกะเพราหมูสับไข่ดาว', description: 'กะเพราหมูสับรสจัดจ้าน ไข่ดาวกรอบ', price: 65, category: 'อาหารจานเดียว', imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600' },
    { name: 'ข้าวผัดกุ้ง', description: 'ข้าวผัดหอมๆ กุ้งตัวโต', price: 80, category: 'อาหารจานเดียว', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600' },
    { name: 'ข้าวมันไก่', description: 'ไก่นุ่ม ข้าวหอมมัน น้ำจิ้มเด็ด', price: 55, category: 'อาหารจานเดียว', imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600' },
    { name: 'ก๋วยเตี๋ยวต้มยำหมู', description: 'น้ำซุปต้มยำเข้มข้น', price: 60, category: 'ก๋วยเตี๋ยว', imageUrl: 'https://images.unsplash.com/photo-1547928576-b822bc410bdf?w=600' },
    { name: 'ก๋วยเตี๋ยวเนื้อตุ๋น', description: 'เนื้อตุ๋นเปื่อยนุ่ม', price: 70, category: 'ก๋วยเตี๋ยว', imageUrl: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=600' },
    { name: 'ชาไทยเย็น', description: 'ชาไทยหวานมัน', price: 35, category: 'เครื่องดื่ม', imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600' },
    { name: 'น้ำมะนาวโซดา', description: 'สดชื่นเปรี้ยวหวาน', price: 30, category: 'เครื่องดื่ม', imageUrl: 'https://images.unsplash.com/photo-1497534446932-c925b458314a?w=600' },
    { name: 'ข้าวเหนียวมะม่วง', description: 'มะม่วงสุกหวาน ข้าวเหนียวมูน', price: 60, category: 'ของหวาน', imageUrl: 'https://images.unsplash.com/photo-1711161056321-2e9bcd02d913?w=600' },
    { name: 'บัวลอยไข่หวาน', description: 'บัวลอยกะทิสด', price: 40, category: 'ของหวาน', imageUrl: 'https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=600' },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        categoryId: catMap[p.category],
      },
    });
  }

  console.log('Seed completed. Admin: admin@restaurant.local / admin1234');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
