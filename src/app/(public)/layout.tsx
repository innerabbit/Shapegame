'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletProvider } from '@/components/providers/wallet-provider';
import { WalletButton } from '@/components/wallet-button';
import { Toaster } from 'sonner';

const NAV = [
  { href: '/', label: 'Home', icon: '🏠', exact: true },
  { href: '/shop', label: 'Shop', icon: '🛒' },
  { href: '/collection', label: 'Collection', icon: '🃏' },
  { href: '/gallery', label: 'Gallery', icon: '🖼️' },
  { href: '/leaderboard', label: 'Board', icon: '🏆' },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <WalletProvider>
      {/* Bottom nav (48) + taskbar (36) = 84px reserved */}
      <div className="xp-desktop flex flex-col" style={{ paddingBottom: 84 }}>
        {/* Title bar — fixed at top */}
        <div className="xp-top-bar">
          <div className="flex items-center gap-[6px]">
            <span className="text-sm">🎴</span>
            <span className="xp-title-text">SHAPE_CARDS</span>
          </div>
          <WalletButton />
        </div>

        {/* Main content */}
        <main className="flex-1 p-3 md:p-6 pt-1">
          {children}
        </main>

        {/* Bottom tab navigation */}
        <nav className="xp-bottom-tabs">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`xp-bottom-tab ${active ? 'xp-bottom-tab-active' : ''}`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* XP Taskbar */}
        <div className="xp-taskbar">
          <button className="xp-start-button">
            <span className="text-base">🪟</span>
            start
          </button>
          <div className="xp-taskbar-buttons">
            <div className="xp-taskbar-btn xp-taskbar-btn-active">
              <span className="text-xs">🎴</span>
              <span className="truncate">SHAPE_CARDS</span>
            </div>
          </div>
          <div className="xp-tray">
            <span className="text-[10px]">🔊</span>
            <span className="text-[11px]">
              {new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        </div>

        <Toaster
          theme="light"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffe1',
              border: '1px solid #000',
              color: '#222',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '11px',
              borderRadius: 0,
            },
          }}
        />
      </div>
    </WalletProvider>
  );
}
