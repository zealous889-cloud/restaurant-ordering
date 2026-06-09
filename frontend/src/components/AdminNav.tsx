'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminNav() {
  const path = usePathname();
  const router = useRouter();
  const tabs = [
    { href: '/admin', label: 'เมนูอาหาร' },
    { href: '/admin/reports', label: 'ยอดขาย' },
    { href: '/admin/orders', label: 'ประวัติออเดอร์' },
  ];
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/admin/login'); };
  return (
    <header className="bg-gray-900 text-white">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold">แผงควบคุมผู้ดูแล</h1>
        <button onClick={logout} className="text-sm bg-white/10 px-3 py-1 rounded-lg">ออกจากระบบ</button>
      </div>
      <nav className="flex border-t border-white/10">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className={`flex-1 text-center py-2 text-sm ${path === t.href ? 'bg-brand font-semibold' : 'opacity-80'}`}>{t.label}</Link>
        ))}
      </nav>
    </header>
  );
}
