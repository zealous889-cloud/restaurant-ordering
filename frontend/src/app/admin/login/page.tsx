'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin';
  const [email, setEmail] = useState('admin@restaurant.local');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      router.push(res.user.role === 'KITCHEN' ? '/kitchen' : next);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">เข้าสู่ระบบ</h1>
        <p className="text-center text-sm text-gray-500">สำหรับผู้ดูแลระบบ / ครัว</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-xl p-3" placeholder="อีเมล" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border rounded-xl p-3" placeholder="รหัสผ่าน" onKeyDown={(e) => e.key === 'Enter' && submit()} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button onClick={submit} disabled={loading} className="w-full bg-brand text-white rounded-xl py-3 font-semibold disabled:opacity-60">
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
        <p className="text-xs text-gray-400 text-center">ทดสอบ: admin@restaurant.local / admin1234<br/>kitchen@restaurant.local / kitchen1234</p>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return <Suspense><LoginInner /></Suspense>;
}
