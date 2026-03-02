import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { SocketProvider } from '@/components/socket-provider';

export const metadata: Metadata = {
  title: 'My Google AI Studio App',
  description: 'My Google AI Studio App',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
