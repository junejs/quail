'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGameStore } from '@/lib/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, ldapEnabled, checkAuth } = useGameStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const isAuth = await checkAuth();
      
      // Only redirect if LDAP is enabled and user is not authenticated
      // and we are not already on the login page
      if (ldapEnabled && !isAuth && pathname !== '/login') {
        router.push(`/login?callback=${encodeURIComponent(pathname)}`);
      } else {
        setLoading(false);
      }
    };

    verify();
  }, [pathname, ldapEnabled, checkAuth, router]);

  if (loading && ldapEnabled && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0502]">
        <div className="w-16 h-16 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
