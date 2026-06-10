'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Product = { id: string; name: string; price: number | string; imageUrl?: string };
export type CartItem = { lineKey: string; product: Product; quantity: number; options?: string; note?: string };

type CartCtx = {
  items: CartItem[];
  add: (p: Product, options?: string) => void;
  inc: (lineKey: string) => void;
  dec: (lineKey: string) => void;
  remove: (lineKey: string) => void;
  setNote: (lineKey: string, note: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);

// A cart line is unique per product + selected options, so the same coffee
// with different temperature/sweetness becomes separate lines.
function keyOf(productId: string, options?: string) {
  return `${productId}||${options ?? ''}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      // migrate older carts that have no lineKey
      setItems(parsed.map((i: any) => ({ ...i, lineKey: i.lineKey ?? keyOf(i.product.id, i.options) })));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const add = (p: Product, options?: string) =>
    setItems((cur) => {
      const lineKey = keyOf(p.id, options);
      const f = cur.find((i) => i.lineKey === lineKey);
      if (f) return cur.map((i) => (i.lineKey === lineKey ? { ...i, quantity: i.quantity + 1 } : i));
      return [...cur, { lineKey, product: p, quantity: 1, options }];
    });
  const inc = (lineKey: string) => setItems((c) => c.map((i) => (i.lineKey === lineKey ? { ...i, quantity: i.quantity + 1 } : i)));
  const dec = (lineKey: string) =>
    setItems((c) => c.flatMap((i) => (i.lineKey === lineKey ? (i.quantity > 1 ? [{ ...i, quantity: i.quantity - 1 }] : []) : [i])));
  const remove = (lineKey: string) => setItems((c) => c.filter((i) => i.lineKey !== lineKey));
  const setNote = (lineKey: string, note: string) =>
    setItems((c) => c.map((i) => (i.lineKey === lineKey ? { ...i, note } : i)));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  return <Ctx.Provider value={{ items, add, inc, dec, remove, setNote, clear, count, total }}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart must be inside CartProvider');
  return c;
};
