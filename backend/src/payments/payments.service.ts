import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { KitchenState, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../kitchen/events.gateway';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;
  private currency = process.env.CURRENCY || 'thb';

  constructor(private prisma: PrismaService, private events: EventsGateway) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
      apiVersion: '2024-06-20',
    });
  }

  private toMinor(amount: number) {
    return Math.round(amount * 100); // THB -> satang
  }

  // Create a payment for an order. method = PROMPTPAY | CARD
  async createPayment(orderId: string, method: PaymentMethod) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundException('ไม่พบออเดอร์');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('ออเดอร์นี้ไม่อยู่ในสถานะรอชำระเงิน');
    }

    const amount = Number(order.totalAmount);

    if (method === PaymentMethod.PROMPTPAY) {
      // Create + confirm a PromptPay PaymentIntent to obtain the QR code.
      const intent = await this.stripe.paymentIntents.create({
        amount: this.toMinor(amount),
        currency: this.currency,
        payment_method_types: ['promptpay'],
        payment_method_data: {
          type: 'promptpay',
          billing_details: {
            name: order.customerName,
            email: `order-${order.orderNumber}@example.com`,
          },
        },
        confirm: true,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      });

      const next = intent.next_action as any;
      const qr = next?.promptpay_display_qr_code;
      const qrCodeUrl = qr?.image_url_png || qr?.image_url_svg || null;

      await this.prisma.payment.upsert({
        where: { orderId: order.id },
        update: { method, status: PaymentStatus.PENDING, providerRef: intent.id, qrCodeUrl, amount },
        create: { orderId: order.id, method, status: PaymentStatus.PENDING, providerRef: intent.id, qrCodeUrl, amount },
      });

      return {
        method,
        paymentIntentId: intent.id,
        clientSecret: intent.client_secret,
        qrCodeUrl,
        qrData: qr?.data || null,
        amount,
      };
    }

    // CARD -> Stripe Checkout Session (hosted page), real redirect.
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: this.currency,
            unit_amount: this.toMinor(amount),
            product_data: { name: `ออเดอร์ ${order.orderNumber}` },
          },
        },
      ],
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      payment_intent_data: { metadata: { orderId: order.id } },
      success_url: `${process.env.FRONTEND_URL}/order/${order.id}?paid=1`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/${order.id}?cancelled=1`,
    });

    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: { method, status: PaymentStatus.PENDING, providerRef: session.id, amount },
      create: { orderId: order.id, method, status: PaymentStatus.PENDING, providerRef: session.id, amount },
    });

    return { method, checkoutUrl: session.url, sessionId: session.id, amount };
  }

  // Verify and process a Stripe webhook event.
  async handleWebhook(signature: string, rawBody: Buffer) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.markPaid(pi.metadata?.orderId, pi.id, event.data.object);
        break;
      }
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status === 'paid') {
          await this.markPaid(s.metadata?.orderId, (s.payment_intent as string) || s.id, event.data.object);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.markFailed(pi.metadata?.orderId);
        break;
      }
      default:
        break;
    }
    return { received: true };
  }

  // Core: payment success -> persist + push to kitchen.
  private async markPaid(orderId: string, providerRef: string, raw: any) {
    if (!orderId) return;
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order || order.status === OrderStatus.PAID || order.status === OrderStatus.COMPLETED) return;

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { orderId },
        data: { status: PaymentStatus.SUCCEEDED, providerRef, rawPayload: raw },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID, paidAt: new Date(), estimatedReadyAt: new Date(Date.now() + 20 * 60 * 1000) },
      }),
      // Order enters the kitchen ONLY here, after a successful payment.
      this.prisma.kitchenStatus.upsert({
        where: { orderId },
        update: { state: KitchenState.WAITING },
        create: { orderId, state: KitchenState.WAITING },
      }),
    ]);

    const full = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, kitchenStatus: true, payment: true },
    });

    // Real-time: notify kitchen (sound) + the waiting customer.
    this.events.emitNewKitchenOrder(full);
    this.events.emitOrderStatus(orderId, { type: 'payment', status: 'SUCCEEDED', order: full });
    this.logger.log(`Order ${full?.orderNumber} PAID -> sent to kitchen`);
  }

  private async markFailed(orderId: string) {
    if (!orderId) return;
    await this.prisma.payment.updateMany({
      where: { orderId, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED },
    });
    this.events.emitOrderStatus(orderId, { type: 'payment', status: 'FAILED' });
  }

  // Polling fallback for the frontend.
  async getStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, kitchenStatus: true },
    });
    if (!order) throw new NotFoundException('ไม่พบออเดอร์');
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      paymentStatus: order.payment?.status ?? null,
      kitchenState: order.kitchenStatus?.state ?? null,
      estimatedReadyAt: order.estimatedReadyAt,
    };
  }
}
