import './globals.css';
import type { Metadata } from 'next';
import { CartProvider } from '@/lib/cart';

export const metadata: Metadata = {
  title: 'สั่งอาหารออนไลน์',
  description: 'ระบบสั่งอาหารออนไลน์สำหรับร้านอาหาร',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <CartProvider>
          <div className="mx-auto max-w-md min-h-screen bg-white shadow-sm md:max-w-2xl lg:max-w-4xl">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
