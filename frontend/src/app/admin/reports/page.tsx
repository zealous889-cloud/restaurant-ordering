'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import AdminNav from '@/components/AdminNav';

const PERIODS = [
  { key: 'day', label: 'รายวัน' },
  { key: 'week', label: 'รายสัปดาห์' },
  { key: 'month', label: 'รายเดือน' },
];

export default function AdminReports() {
  const router = useRouter();
  const [period, setPeriod] = useState('day');
  const [data, setData] = useState<any>(null);

  const load = (p: string) => api.get(`/reports/summary?period=${p}`).then(setData).catch(() => router.push('/admin/login'));
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) { router.push('/admin/login'); return; }
    load(period);
  }, [period]);

  const download = async (type: 'excel' | 'csv') => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${api.base}/reports/export/${type}?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sales-${period}.${type === 'excel' ? 'xlsx' : 'csv'}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-10">
      <AdminNav />
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)} className={`flex-1 py-2 rounded-lg text-sm border ${period === p.key ? 'bg-brand text-white border-brand' : 'bg-white'}`}>{p.label}</button>
          ))}
        </div>

        {data && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="ยอดขาย" value={`฿${data.totalSales.toLocaleString()}`} />
              <Stat label="ออเดอร์" value={data.totalOrders} />
              <Stat label="จำนวนจาน" value={data.itemCount} />
            </div>

            <div className="rounded-xl border p-4">
              <p className="font-semibold mb-2">เมนูขายดี</p>
              {data.topProducts.length === 0 ? <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p> : (
                <ul className="space-y-1">
                  {data.topProducts.map((t: any, i: number) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{i + 1}. {t.name}</span>
                      <span className="text-gray-500">{t.qty} จาน • ฿{t.revenue.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => download('excel')} className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold">Export Excel</button>
              <button onClick={() => download('csv')} className="flex-1 bg-gray-700 text-white rounded-xl py-2.5 text-sm font-semibold">Export CSV</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-brand">{value}</p>
    </div>
  );
}
