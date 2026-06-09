import { Injectable, NotFoundException } from '@nestjs/common';
import { KitchenState, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from './events.gateway';

@Injectable()
export class KitchenService {
  constructor(private prisma: PrismaService, private events: EventsGateway) {}

  // Dashboard: only PAID orders (never unpaid ones).
  async board() {
    return this.prisma.order.findMany({
      where: { status: { in: [OrderStatus.PAID, OrderStatus.COMPLETED] }, paidAt: { not: null } },
      include: { items: true, kitchenStatus: true, payment: true },
      orderBy: { paidAt: 'asc' },
    });
  }

  async setState(orderId: string, state: KitchenState) {
    const ks = await this.prisma.kitchenStatus.update({
      where: { orderId },
      data: { state },
    });

    // When kitchen marks DONE, complete the order.
    if (state === KitchenState.DONE) {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.COMPLETED } });
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, kitchenStatus: true },
    });
    if (!order) throw new NotFoundException();
    this.events.emitKitchenUpdate(order);
    this.events.emitOrderStatus(orderId, { type: 'kitchen', state, order });
    return order;
  }
}
