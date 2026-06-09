'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AdminNav from '@/components/AdminNav';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'รอชำระเงิน', PAID: 'ชำระแล้ว', CANCELLED: 'ยกเลิก', COMPLETED: 'เสร็จสิ้น',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-700', PAID: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-600', COMPLETED: 'bg-green-100 text-green-700',
};

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) { router.push('/admin/login'); return; }
    api.get('/orders').then(setOrders).catch(() => router.push('/admin/login'));
  }, []);

  return (
    <div className="pb-10">
      <AdminNav />
      <ul className="divide-y">
        {orders.map((o) => (
          <li key={o.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{o.orderNumber}</p>
                <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('th-TH')} • {o.customerName}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">{o.items.map((i: any) => `${i.nameSnapshot} x${i.quantity}`).join(', ')}</div>
            <div className="text-right font-bold text-brand">฿{Number(o.totalAmount)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
