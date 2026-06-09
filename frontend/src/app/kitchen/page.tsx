'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

const NEXT_STATE: Record<string, string> = { WAITING: 'COOKING', COOKING: 'READY', READY: 'DONE' };
const STATE_LABEL: Record<string, string> = { WAITING: 'รอทำอาหาร', COOKING: 'กำลังทำ', READY: 'พร้อมรับ', DONE: 'เสร็จสิ้น' };
const BTN_LABEL: Record<string, string> = { WAITING: 'เริ่มทำ', COOKING: 'ทำเสร็จ (พร้อมรับ)', READY: 'ลูกค้ารับแล้ว' };
const STATE_COLOR: Record<string, string> = {
  WAITING: 'border-amber-400 bg-amber-50',
  COOKING: 'border-blue-400 bg-blue-50',
  READY: 'border-green-500 bg-green-50',
  DONE: 'border-gray-300 bg-gray-50',
};

export default function KitchenPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [ready, setReady] = useState(false);
  const audioCtx = useRef<any>(null);

  const beep = () => {
    try {
      audioCtx.current ??= new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtx.current;
      [0, 0.18].forEach((t) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = 880; o.type = 'sine';
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.001, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.16);
      });
    } catch {}
  };

  const load = () => api.get('/kitchen/board')
    .then(setOrders)
    .catch(() => router.push('/admin/login?next=/kitchen'));

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/admin/login?next=/kitchen'); return;
    }
    load();
    const socket = getSocket();
    socket.on('kitchen:newOrder', (o: any) => { setOrders((cur) => [...cur.filter((x) => x.id !== o.id), o]); beep(); });
    socket.on('kitchen:update', () => load());
    return () => { socket.off('kitchen:newOrder'); socket.off('kitchen:update'); };
  }, []);

  const advance = async (o: any) => {
    const next = NEXT_STATE[o.kitchenStatus?.state];
    if (!next) return;
    await api.patch(`/kitchen/${o.id}/state`, { state: next });
    load();
  };

  const active = orders.filter((o) => o.kitchenStatus?.state !== 'DONE');

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">หน้าจอครัว</h1>
          <p className="text-xs opacity-70">ออเดอร์ที่ชำระเงินแล้วเท่านั้น</p>
        </div>
        <div className="flex items-center gap-3">
          {!ready && (
            <button onClick={() => { setReady(true); beep(); }} className="bg-brand px-3 py-1.5 rounded-lg text-sm">เปิดเสียงแจ้งเตือน</button>
          )}
          <span className="bg-brand px-3 py-1 rounded-full text-sm">{active.length} ออเดอร์</span>
        </div>
      </header>

      {active.length === 0 ? (
        <p className="p-10 text-center text-gray-400">ยังไม่มีออเดอร์</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
          {active.map((o) => {
            const st = o.kitchenStatus?.state || 'WAITING';
            return (
              <li key={o.id} className={`rounded-xl border-2 p-4 ${STATE_COLOR[st]}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{o.orderNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(o.paidAt).toLocaleTimeString('th-TH')}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border">{STATE_LABEL[st]}</span>
                </div>
                <ul className="my-3 text-sm">
                  {o.items.map((i: any) => (
                    <li key={i.id} className="flex justify-between py-0.5">
                      <span>{i.nameSnapshot}</span><span className="font-bold">x{i.quantity}</span>
                    </li>
                  ))}
                </ul>
                {o.note && <p className="text-xs bg-yellow-100 rounded p-2 mb-2">📝 {o.note}</p>}
                <p className="text-xs text-gray-500 mb-2">ลูกค้า: {o.customerName} • {o.customerPhone}</p>
                {NEXT_STATE[st] && (
                  <button onClick={() => advance(o)} className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-semibold">
                    {BTN_LABEL[st]}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
