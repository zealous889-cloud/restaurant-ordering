'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

const STATE_LABEL: Record<string, string> = {
  WAITING: 'รอทำอาหาร',
  COOKING: 'กำลังทำ',
  READY: 'พร้อมรับ',
  DONE: 'เสร็จสิ้น',
};
const STEPS = ['WAITING', 'COOKING', 'READY', 'DONE'];

export default function OrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [state, setState] = useState<string>('WAITING');

  const load = () => api.get(`/orders/${orderId}`).then((o) => {
    setOrder(o);
    if (o.kitchenStatus?.state) setState(o.kitchenStatus.state);
  });

  useEffect(() => { load(); }, [orderId]);

  useEffect(() => {
    const socket = getSocket();
    const handler = (payload: any) => {
      if (payload?.type === 'kitchen' && payload.state) setState(payload.state);
      if (payload?.order) setOrder(payload.order);
    };
    socket.on(`order:${orderId}`, handler);
    const poll = setInterval(load, 8000);
    return () => { socket.off(`order:${orderId}`, handler); clearInterval(poll); };
  }, [orderId]);

  if (!order) return <p className="p-8 text-center text-gray-500">กำลังโหลด...</p>;

  const eta = order.estimatedReadyAt ? new Date(order.estimatedReadyAt) : null;

  return (
    <div className="pb-10">
      <div className="bg-green-500 text-white px-4 py-8 text-center">
        <div className="text-5xl mb-2">✓</div>
        <h1 className="text-xl font-bold">ชำระเงินสำเร็จ</h1>
        <p className="opacity-90 text-sm mt-1">ส่งออเดอร์เข้าครัวเรียบร้อยแล้ว</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-xl border p-4 text-center">
          <p className="text-gray-500 text-sm">เลขออเดอร์</p>
          <p className="text-2xl font-bold tracking-wide">{order.orderNumber}</p>
          {eta && <p className="text-sm text-gray-600 mt-2">เวลารับอาหารโดยประมาณ: <b>{eta.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</b></p>}
        </div>

        <div className="rounded-xl border p-4">
          <p className="font-semibold mb-3">สถานะออเดอร์</p>
          <div className="flex justify-between">
            {STEPS.map((s, idx) => {
              const done = STEPS.indexOf(state) >= idx;
              return (
                <div key={s} className="flex-1 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${done ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'}`}>{idx + 1}</div>
                  <span className={`text-[11px] mt-1 text-center ${done ? 'text-brand font-semibold' : 'text-gray-400'}`}>{STATE_LABEL[s]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <p className="font-semibold mb-2">รายการอาหาร</p>
          {order.items.map((i: any) => (
            <div key={i.id} className="flex justify-between text-sm py-0.5">
              <span>{i.nameSnapshot} x{i.quantity}</span>
              <span>฿{Number(i.subtotal)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t mt-2 pt-2"><span>รวม</span><span>฿{Number(order.totalAmount)}</span></div>
        </div>

        <Link href="/" className="block text-center text-brand font-semibold py-2">กลับหน้าเมนู</Link>
      </div>
    </div>
  );
}
