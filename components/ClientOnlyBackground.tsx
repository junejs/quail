'use client';

import dynamic from 'next/dynamic';

/**
 * This component wraps the AtmosphericBackground with ssr: false.
 * Since this wrapper is a Client Component, Next.js allows the ssr: false option.
 */
export const ClientOnlyBackground = dynamic(
  () => import('./AtmosphericBackground').then((mod) => mod.AtmosphericBackground),
  { ssr: false }
);
