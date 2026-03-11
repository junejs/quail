'use client';

import { ErrorBoundary } from './ErrorBoundary';
import { SocketProvider } from './socket-provider';
import { ClientOnlyBackground } from './ClientOnlyBackground';
import { ErrorNotifications } from './ErrorNotifications';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <ClientOnlyBackground />
        <ErrorNotifications />
        <div className="relative z-10">
          {children}
        </div>
      </SocketProvider>
    </ErrorBoundary>
  );
}
