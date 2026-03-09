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
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <WalletProvider>
      <div className="xp-desktop flex flex-col" style={{ paddingBottom: 36 }}>
        {/* Main content area — windows sit on the "desktop" */}
        <main className="flex-1 p-3 md:p-6">
          {/* Navigation bar styled as XP toolbar window */}
          <div className="xp-window mb-4">
            <div className="xp-title-bar">
              <div className="flex items-center gap-[6px]">
                <span className="text-sm">🎴</span>
                <span className="xp-title-text">SHAPE_CARDS — Collect. Trade. Battle.</span>
              </div>
              <div className="flex items-center gap-[2px]">
                <button className="xp-btn-minimize" aria-label="Minimize">
                  <svg width="8" height="2" viewBox="0 0 8 2"><rect width="8" height="2" fill="currentColor"/></svg>
                </button>
                <button className="xp-btn-maximize" aria-label="Maximize">
                  <svg width="9" height="9" viewBox="0 0 9 9"><rect x="0" y="0" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
                </button>
                <button className="xp-btn-close" aria-label="Close">
                  <svg width="8" height="8" viewBox="0 0 8 8"><path d="M0 0L8 8M8 0L0 8" stroke="currentColor" strokeWidth="1.5"/></svg>
                </button>
              </div>
            </div>
            <div className="xp-toolbar justify-between flex-wrap gap-2">
              <nav className="flex items-center gap-[2px]">
                {NAV.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-1 px-3 py-[3px] text-[11px] rounded-sm
                        ${active
                          ? 'bg-[#316ac5] text-white font-bold'
                          : 'text-[#222] hover:bg-[#c8daf6]'
                        }
                      `}
                    >
                      <span className="text-xs">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <WalletButton />
            </div>
          </div>

          {children}
        </main>

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
