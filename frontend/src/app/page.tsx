'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart';

const TYPES = ['ร้อน', 'เย็น', 'ปั่น'];
const SWEET = ['100%', '75%', '50%', '25%', '0%'];

export default function MenuPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [active, setActive] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<any>(null); // product currently being configured
  const [type, setType] = useState(TYPES[0]);
  const [sweet, setSweet] = useState(SWEET[2]); // default 50%
  const { add, count, total } = useCart();

  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/categories')])
      .then(([p, c]) => { setProducts(p); setCats(c); })
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(
    () => (active === 'all' ? products : products.filter((p) => p.categoryId === active)),
    [products, active],
  );

  const openOptions = (p: any) => { setSel(p); setType(TYPES[0]); setSweet(SWEET[2]); };
  const confirmAdd = () => { add(sel, `${type} • หวาน ${sweet}`); setSel(null); };

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-10 bg-brand text-white px-4 py-4 shadow">
        <h1 className="text-xl font-bold">Coffee Corner</h1>
        <p className="text-sm opacity-90">เลือกเครื่องดื่มโปรด แล้วสั่งได้เลย</p>
      </header>

      <div className="sticky top-[72px] z-10 bg-white border-b">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3">
          <Chip label="ทั้งหมด" on={active === 'all'} onClick={() => setActive('all')} />
          {cats.map((c) => (
            <Chip key={c.id} label={c.name} on={active === c.id} onClick={() => setActive(c.id)} />
          ))}
        </div>
      </div>

      {loading ? (
        <p className="p-6 text-center text-gray-500">กำลังโหลดเมนู...</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
          {shown.map((p) => (
            <li key={p.id} className="rounded-2xl border bg-white overflow-hidden flex flex-col">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : null}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="font-semibold text-sm leading-tight">{p.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1 flex-1">{p.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-brand">฿{Number(p.price)}</span>
                  <button
                    onClick={() => openOptions(p)}
                    className="bg-brand text-white w-8 h-8 rounded-full text-lg leading-none active:scale-95"
                  >+</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Options sheet: pick temperature + sweetness before adding */}
      {sel && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-20" onClick={() => setSel(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="font-bold text-lg">{sel.name}</p>
              <p className="text-brand font-bold">฿{Number(sel.price)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">ประเภท</p>
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded-lg border text-sm ${type === t ? 'bg-brand text-white border-brand' : 'border-gray-300'}`}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">ความหวาน</p>
              <div className="flex gap-2 flex-wrap">
                {SWEET.map((s) => (
                  <button key={s} onClick={() => setSweet(s)}
                    className={`flex-1 min-w-[56px] py-2 rounded-lg border text-sm ${sweet === s ? 'bg-brand text-white border-brand' : 'border-gray-300'}`}>{s}</button>
                ))}
              </div>
            </div>

            <button onClick={confirmAdd} className="w-full bg-brand text-white rounded-full py-3 font-semibold">
              เพิ่มลงตะกร้า • {type} หวาน {sweet}
            </button>
          </div>
        </div>
      )}

      {count > 0 && (
        <Link
          href="/cart"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-brand text-white rounded-full px-6 py-3 flex items-center justify-between shadow-lg"
        >
          <span className="font-semibold">ดูตะกร้า ({count})</span>
          <span className="font-bold">฿{total}</span>
        </Link>
      )}
    </div>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm border ${
        on ? 'bg-brand text-white border-brand' : 'bg-white text-gray-700 border-gray-300'
      }`}
    >{label}</button>
  );
}
