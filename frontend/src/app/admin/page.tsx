'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AdminNav from '@/components/AdminNav';

const empty = { name: '', description: '', price: '', imageUrl: '', categoryId: '', available: true };

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => Promise.all([api.get('/products?all=true'), api.get('/categories')])
    .then(([p, c]) => { setProducts(p); setCats(c); if (!form.categoryId && c[0]) setForm((f: any) => ({ ...f, categoryId: c[0].id })); })
    .catch(() => router.push('/admin/login'));

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) { router.push('/admin/login'); return; }
    load();
  }, []);

  const save = async () => {
    const payload = { ...form, price: Number(form.price) };
    if (editing) await api.patch(`/products/${editing}`, payload);
    else await api.post('/products', payload);
    setOpen(false); setEditing(null); setForm({ ...empty, categoryId: cats[0]?.id }); load();
  };
  const edit = (p: any) => { setEditing(p.id); setForm({ name: p.name, description: p.description, price: String(p.price), imageUrl: p.imageUrl, categoryId: p.categoryId, available: p.available }); setOpen(true); };
  const del = async (id: string) => { if (confirm('ลบเมนูนี้?')) { await api.del(`/products/${id}`); load(); } };

  return (
    <div className="pb-10">
      <AdminNav />
      <div className="p-4">
        <button onClick={() => { setEditing(null); setForm({ ...empty, categoryId: cats[0]?.id }); setOpen(true); }} className="mb-4 bg-brand text-white rounded-xl px-4 py-2 text-sm font-semibold">+ เพิ่มเมนู</button>
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 border rounded-xl p-2">
              <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0">{p.imageUrl && <img src={p.imageUrl} className="w-full h-full object-cover" />}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.category?.name} • ฿{Number(p.price)} {!p.available && <span className="text-red-500">(ปิดขาย)</span>}</p>
              </div>
              <button onClick={() => edit(p)} className="text-sm text-blue-600 px-2">แก้ไข</button>
              <button onClick={() => del(p.id)} className="text-sm text-red-600 px-2">ลบ</button>
            </li>
          ))}
        </ul>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-20" onClick={() => setOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-lg">{editing ? 'แก้ไขเมนู' : 'เพิ่มเมนู'}</h2>
            <input className="w-full border rounded-lg p-2" placeholder="ชื่อเมนู" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea className="w-full border rounded-lg p-2" placeholder="รายละเอียด" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="w-full border rounded-lg p-2" placeholder="ราคา" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input className="w-full border rounded-lg p-2" placeholder="URL รูปภาพ" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <select className="w-full border rounded-lg p-2" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> พร้อมจำหน่าย</label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="flex-1 border rounded-xl py-2">ยกเลิก</button>
              <button onClick={save} className="flex-1 bg-brand text-white rounded-xl py-2 font-semibold">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
