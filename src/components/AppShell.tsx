'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('@/components/Sidebar').then((m) => ({ default: m.Sidebar })), {
  ssr: false,
  loading: () => (
    <aside className="w-56 shrink-0 border-r border-panel-border bg-panel-card animate-pulse" aria-hidden />
  ),
});

const PUBLIC_PATHS = ['/setup', '/login'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = pathname && !PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
