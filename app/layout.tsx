import type { Metadata } from 'next';
import './globals.css'; // Global styles
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Quail',
  description: 'The Ultimate Quiz Experience',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-[#0a0502] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
