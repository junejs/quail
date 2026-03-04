import type { Metadata } from 'next';
import './globals.css'; // Global styles
import { SocketProvider } from '@/components/socket-provider';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';

export const metadata: Metadata = {
  title: 'Quail',
  description: 'The Ultimate Quiz Experience',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-[#0a0502] text-white">
        <SocketProvider>
          <AtmosphericBackground />
          <div className="relative z-10">
            {children}
          </div>
        </SocketProvider>
      </body>
    </html>
  );
}
