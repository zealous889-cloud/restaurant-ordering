import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  // Background job: auto-cancel unpaid orders after ORDER_EXPIRE_MINUTES.
  onModuleInit() {
    const tick = async () => {
      try {
        const expired = await this.prisma.order.findMany({
          where: { status: OrderStatus.PENDING_PAYMENT, expiresAt: { lt: new Date() } },
        });
        for (const o of expired) {
          await this.prisma.order.update({ where: { id: o.id }, data: { status: OrderStatus.CANCELLED } });
          await this.prisma.payment.updateMany({ where: { orderId: o.id, status: PaymentStatus.PENDING }, data: { status: PaymentStatus.EXPIRED } });
        }
        if (expired.length) console.log(`Auto-cancelled ${expired.length} expired order(s).`);
      } catch (e) { /* ignore */ }
    };
    setInterval(tick, 60 * 1000);
  }

  private genOrderNumber() {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${ymd}-${rand}`;
  }

  async create(dto: CreateOrderDto) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) }, available: true },
    });
    if (products.length !== dto.items.length) {
      throw new BadRequestException('มีสินค้าบางรายการไม่พร้อมจำหน่าย');
    }

    let total = 0;
    const itemsData = dto.items.map((i) => {
      const p = products.find((x) => x.id === i.productId)!;
      const price = Number(p.price);
      const subtotal = price * i.quantity;
      total += subtotal;
      return {
        productId: p.id,
        nameSnapshot: p.name,
        priceSnapshot: price,
        quantity: i.quantity,
        subtotal,
        note: i.note ?? '',
      };
    });

    const expireMin = Number(process.env.ORDER_EXPIRE_MINUTES || 15);
    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.genOrderNumber(),
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        note: dto.note ?? '',
        status: OrderStatus.PENDING_PAYMENT,
        totalAmount: total,
        expiresAt: new Date(Date.now() + expireMin * 60 * 1000),
        items: { create: itemsData },
      },
      include: { items: true },
    });
    return order;
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true, kitchenStatus: true },
    });
    if (!order) throw new NotFoundException('ไม่พบออเดอร์');
    return order;
  }

  findAll() {
    return this.prisma.order.findMany({
      include: { items: true, payment: true, kitchenStatus: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
