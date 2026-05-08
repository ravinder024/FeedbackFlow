import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import SessionInitializer from '@/components/tracking/SessionInitializer';
import ClickTracker from '@/components/tracking/ClickTracker';
import NavigationTracker from '@/components/tracking/NavigationTracker';
import '@/styles/globals.css';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <SessionInitializer />
      <ClickTracker />
      <NavigationTracker />
      <Component {...pageProps} />
    </SessionProvider>
  );
} 