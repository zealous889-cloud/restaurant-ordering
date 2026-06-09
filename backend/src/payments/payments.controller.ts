import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  // Start a payment for an order. body: { method: 'PROMPTPAY' | 'CARD' }
  @Post(':orderId/create')
  create(@Param('orderId') orderId: string, @Body('method') method: PaymentMethod) {
    return this.svc.createPayment(orderId, method || PaymentMethod.PROMPTPAY);
  }

  // Real-time status polling fallback.
  @Get(':orderId/status')
  status(@Param('orderId') orderId: string) {
    return this.svc.getStatus(orderId);
  }

  // Stripe webhook (raw body verified). Configure this URL in Stripe dashboard.
  @Post('webhook')
  webhook(@Headers('stripe-signature') sig: string, @Req() req: any) {
    return this.svc.handleWebhook(sig, req.rawBody);
  }
}
