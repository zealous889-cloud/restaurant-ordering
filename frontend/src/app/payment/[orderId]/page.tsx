'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useCart } from '@/lib/cart';

type Method = 'PROMPTPAY' | 'CARD';

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { clear } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [method, setMethod] = useState<Method>('PROMPTPAY');
  const [pay, setPay] = useState<any>(null);
  const [status, setStatus] = useState<string>('PENDING');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get(`/orders/${orderId}`).then(setOrder); }, [orderId]);

  // Real-time payment status via Socket.IO, with polling fallback.
  useEffect(() => {
    const socket = getSocket();
    const onStatus = (payload: any) => {
      if (payload?.type === 'payment') {
        setStatus(payload.status);
        if (payload.status === 'SUCCEEDED') { clear(); router.push(`/order/${orderId}?paid=1`); }
      }
    };
    socket.on(`order:${orderId}`, onStatus);

    const poll = setInterval(async () => {
      const s = await api.get(`/payments/${orderId}/status`).catch(() => null);
      if (s?.paymentStatus === 'SUCCEEDED' || s?.orderStatus === 'PAID') {
        clear(); router.push(`/order/${orderId}?paid=1`);
      } else if (s?.paymentStatus === 'FAILED' || s?.orderStatus === 'CANCELLED') {
        setStatus(s.paymentStatus || 'CANCELLED');
      }
    }, 3000);

    return () => { socket.off(`order:${orderId}`, onStatus); clearInterval(poll); };
  }, [orderId, router, clear]);

  const startPayment = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/payments/${orderId}/create`, { method });
      setPay(res);
      if (res.checkoutUrl) window.location.href = res.checkoutUrl; // CARD -> Stripe Checkout
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  if (!order) return <p className="p-8 text-center text-gray-500">กำลังโหลด...</p>;

  return (
    <div className="pb-10">
      <header className="bg-brand text-white px-4 py-4">
        <h1 className="text-lg font-bold">ชำระเงิน</h1>
        <p className="text-sm opacity-90">ออเดอร์ {order.orderNumber}</p>
      </header>

      <div className="p-4 space-y-4">
        <div className="rounded-xl border p-4 text-center">
          <p className="text-gray-500 text-sm">ยอดที่ต้องชำระ</p>
          <p className="text-3xl font-bold text-brand">฿{Number(order.totalAmount)}</p>
        </div>

        {!pay && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MethodBtn on={method === 'PROMPTPAY'} onClick={() => setMethod('PROMPTPAY')} title="PromptPay QR" sub="สแกนจ่าย" />
              <MethodBtn on={method === 'CARD'} onClick={() => setMethod('CARD')} title="บัตรเครดิต" sub="Visa / Master" />
            </div>
            <button onClick={startPayment} disabled={loading} className="w-full bg-brand text-white rounded-full py-3 font-semibold disabled:opacity-60">
              {loading ? 'กำลังสร้างรายการ...' : 'ยืนยันชำระเงิน'}
            </button>
          </>
        )}

        {pay?.qrCodeUrl && (
          <div className="rounded-xl border p-4 text-center">
            <p className="font-semibold mb-2">สแกน QR เพื่อชำระผ่าน PromptPay</p>
            <img src={pay.qrCodeUrl} alt="PromptPay QR" className="w-56 h-56 mx-auto" />
            <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm">กำลังรอการชำระเงิน...</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">หน้าจอจะเปลี่ยนอัตโนมัติเมื่อชำระสำเร็จ</p>
          </div>
        )}

        {(status === 'FAILED' || status === 'CANCELLED') && (
          <p className="text-red-600 text-center text-sm">การชำระเงินไม่สำเร็จ ออเดอร์จะถูกยกเลิกอัตโนมัติภายใน 15 นาที</p>
        )}
      </div>
    </div>
  );
}

function MethodBtn({ on, onClick, title, sub }: any) {
  return (
    <button onClick={onClick} className={`rounded-xl border p-4 text-left ${on ? 'border-brand bg-brand-light' : 'border-gray-300'}`}>
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </button>
  );
}
