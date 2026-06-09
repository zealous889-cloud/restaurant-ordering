import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private range(period: 'day' | 'week' | 'month') {
    const now = new Date();
    const start = new Date(now);
    if (period === 'day') start.setHours(0, 0, 0, 0);
    else if (period === 'week') { start.setDate(now.getDate() - 7); start.setHours(0,0,0,0); }
    else { start.setMonth(now.getMonth() - 1); start.setHours(0,0,0,0); }
    return { start, end: now };
  }

  // Sales summary for paid/completed orders.
  async summary(period: 'day' | 'week' | 'month' = 'day') {
    const { start, end } = this.range(period);
    const orders = await this.prisma.order.findMany({
      where: { status: { in: [OrderStatus.PAID, OrderStatus.COMPLETED] }, paidAt: { gte: start, lte: end } },
      include: { items: true },
    });
    const totalSales = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const itemCount = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);

    // Best sellers
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of orders) for (const it of o.items) {
      map[it.productId] ??= { name: it.nameSnapshot, qty: 0, revenue: 0 };
      map[it.productId].qty += it.quantity;
      map[it.productId].revenue += Number(it.subtotal);
    }
    const topProducts = Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10);

    return { period, start, end, totalOrders: orders.length, totalSales, itemCount, topProducts };
  }

  async history(period: 'day' | 'week' | 'month' = 'month') {
    const { start, end } = this.range(period);
    return this.prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { items: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Export paid orders to an Excel buffer.
  async exportExcel(period: 'day' | 'week' | 'month' = 'month'): Promise<Buffer> {
    const orders = await this.history(period);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Orders');
    ws.columns = [
      { header: 'เลขออเดอร์', key: 'orderNumber', width: 22 },
      { header: 'วันที่', key: 'date', width: 22 },
      { header: 'ลูกค้า', key: 'name', width: 20 },
      { header: 'เบอร์โทร', key: 'phone', width: 15 },
      { header: 'สถานะ', key: 'status', width: 16 },
      { header: 'ชำระเงิน', key: 'payment', width: 12 },
      { header: 'รายการ', key: 'items', width: 40 },
      { header: 'ยอดรวม (บาท)', key: 'total', width: 14 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const o of orders) {
      ws.addRow({
        orderNumber: o.orderNumber,
        date: new Date(o.createdAt).toLocaleString('th-TH'),
        name: o.customerName,
        phone: o.customerPhone,
        status: o.status,
        payment: o.payment?.status ?? '-',
        items: o.items.map((i) => `${i.nameSnapshot} x${i.quantity}`).join(', '),
        total: Number(o.totalAmount),
      });
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf as ArrayBuffer);
  }

  async exportCsv(period: 'day' | 'week' | 'month' = 'month'): Promise<string> {
    const orders = await this.history(period);
    const rows = [['orderNumber','date','name','phone','status','payment','items','total']];
    for (const o of orders) {
      rows.push([
        o.orderNumber,
        new Date(o.createdAt).toISOString(),
        o.customerName,
        o.customerPhone,
        o.status,
        o.payment?.status ?? '-',
        o.items.map((i) => `${i.nameSnapshot} x${i.quantity}`).join('; '),
        String(Number(o.totalAmount)),
      ]);
    }
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  }
}
