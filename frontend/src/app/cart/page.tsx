'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';

export default function CartPage() {
  const { items, inc, dec, setNote, total, count } = useCart();
  const router = useRouter();

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-10 bg-brand text-white px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-2xl leading-none">‹</Link>
        <h1 className="text-lg font-bold">ตะกร้าของฉัน</h1>
      </header>

      {count === 0 ? (
        <div className="p-10 text-center text-gray-500">
          <p>ยังไม่มีสินค้าในตะกร้า</p>
          <Link href="/" className="inline-block mt-4 text-brand font-semibold">เลือกเมนู</Link>
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((i) => (
            <li key={i.lineKey} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {i.product.imageUrl && <img src={i.product.imageUrl} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{i.product.name}</p>
                  {i.options && <p className="text-xs text-gray-500">{i.options}</p>}
                  <p className="text-brand font-bold text-sm">฿{Number(i.product.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => dec(i.lineKey)} className="w-8 h-8 rounded-full border text-lg">−</button>
                  <span className="w-6 text-center">{i.quantity}</span>
                  <button onClick={() => inc(i.lineKey)} className="w-8 h-8 rounded-full bg-brand text-white text-lg">+</button>
                </div>
              </div>
              <input
                value={i.note ?? ''}
                onChange={(e) => setNote(i.lineKey, e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม เช่น ไม่ใส่ฟอง, แก้วเล็ก"
                className="mt-2 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-brand outline-none"
              />
            </li>
          ))}
        </ul>
      )}

      {count > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">รวมทั้งหมด</span>
            <span className="font-bold text-lg">฿{total}</span>
          </div>
          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-brand text-white rounded-full py-3 font-semibold"
          >ดำเนินการสั่งซื้อ</button>
        </div>
      )}
    </div>
  );
}
