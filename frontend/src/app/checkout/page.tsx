'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart';

export default function CheckoutPage() {
  const { items, total } = useCart();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!name || !phone) { setErr('กรุณากรอกชื่อและเบอร์โทร'); return; }
    if (items.length === 0) { setErr('ตะกร้าว่าง'); return; }
    setLoading(true);
    try {
      const order = await api.post('/orders', {
        customerName: name,
        customerPhone: phone,
        note,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      router.push(`/payment/${order.id}`);
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-10 bg-brand text-white px-4 py-4 flex items-center gap-3">
        <Link href="/cart" className="text-2xl leading-none">‹</Link>
        <h1 className="text-lg font-bold">ข้อมูลผู้สั่ง</h1>
      </header>

      <div className="p-4 space-y-4">
        <Field label="ชื่อผู้สั่ง *"><input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="เช่น สมชาย" /></Field>
        <Field label="เบอร์โทรศัพท์ *"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" inputMode="tel" placeholder="08x-xxx-xxxx" /></Field>
        <Field label="หมายเหตุ (ถ้ามี)"><textarea value={note} onChange={(e) => setNote(e.target.value)} className="input h-24" placeholder="เช่น ไม่เผ็ด, ไม่ใส่ผัก" /></Field>

        <div className="rounded-xl border p-4 bg-gray-50">
          <p className="font-semibold mb-2">สรุปรายการ</p>
          {items.map((i) => (
            <div key={i.product.id} className="flex justify-between text-sm py-0.5">
              <span>{i.product.name} x{i.quantity}</span>
              <span>฿{Number(i.product.price) * i.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t mt-2 pt-2">
            <span>รวม</span><span>฿{total}</span>
          </div>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
        <button onClick={submit} disabled={loading} className="w-full bg-brand text-white rounded-full py-3 font-semibold disabled:opacity-60">
          {loading ? 'กำลังสร้างออเดอร์...' : 'ไปชำระเงิน'}
        </button>
      </div>

      <style jsx global>{`.input{width:100%;border:1px solid #d1d5db;border-radius:0.75rem;padding:0.75rem;outline:none}.input:focus{border-color:#e23744}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm text-gray-600 mb-1 block">{label}</span>{children}</label>;
}
