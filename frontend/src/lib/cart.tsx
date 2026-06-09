'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Product = { id: string; name: string; price: number | string; imageUrl?: string };
export type CartItem = { product: Product; quantity: number };

type CartCtx = {
  items: CartItem[];
  add: (p: Product) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const add = (p: Product) =>
    setItems((cur) => {
      const f = cur.find((i) => i.product.id === p.id);
      if (f) return cur.map((i) => (i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...cur, { product: p, quantity: 1 }];
    });
  const inc = (id: string) => setItems((c) => c.map((i) => (i.product.id === id ? { ...i, quantity: i.quantity + 1 } : i)));
  const dec = (id: string) =>
    setItems((c) => c.flatMap((i) => (i.product.id === id ? (i.quantity > 1 ? [{ ...i, quantity: i.quantity - 1 }] : []) : [i])));
  const remove = (id: string) => setItems((c) => c.filter((i) => i.product.id !== id));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  return <Ctx.Provider value={{ items, add, inc, dec, remove, clear, count, total }}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart must be inside CartProvider');
  return c;
};
