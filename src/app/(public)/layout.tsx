'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletProvider } from '@/components/providers/wallet-provider';
import { WalletButton } from '@/components/wallet-button';
import { Toaster } from 'sonner';

const NAV = [
  { href: '/', label: 'Home', exact: true },
  { href: '/shop', label: 'Shop' },
  { href: '/collection', label: 'Collection' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col">
        {/* ── WinXP-style title bar ── */}
        <header className="border-b-2 border-blue-700 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl">🎴</span>
              <span className="text-sm font-bold tracking-widest text-white group-hover:text-yellow-300 transition-colors">
                SHAPE_CARDS
              </span>
              <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold ml-1">
                BETA
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      text-sm px-3 py-1.5 rounded transition-all font-medium
                      ${active
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Wallet */}
            <WalletButton />
          </div>
        </header>

        {/* ── VHS scan line overlay ── */}
        <div
          className="pointer-events-none fixed inset-0 z-40 opacity-[0.015]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-neutral-800 bg-neutral-900/50 py-6">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎴</span>
              <span className="text-xs font-bold tracking-widest text-neutral-500">
                SHAPE_CARDS
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <span>195 unique cards</span>
              <span>&middot;</span>
              <span>Solana blockchain</span>
              <span>&middot;</span>
              <span>VHS aesthetic</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-white transition-colors text-sm"
              >
                Twitter
              </a>
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-500 hover:text-white transition-colors text-sm"
              >
                Discord
              </a>
            </div>
          </div>
        </footer>

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid #333',
              color: '#e5e5e5',
            },
          }}
        />
      </div>
    </WalletProvider>
  );
}
