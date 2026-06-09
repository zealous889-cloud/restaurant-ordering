const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.message || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  base: API,
  get: (p: string) => req(p),
  post: (p: string, body?: any) => req(p, { method: 'POST', body: JSON.stringify(body || {}) }),
  patch: (p: string, body?: any) => req(p, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  del: (p: string) => req(p, { method: 'DELETE' }),
  authHeaders,
};
