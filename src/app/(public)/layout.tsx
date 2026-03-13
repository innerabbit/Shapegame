'use client';

import { useState } from 'react';
import Image from 'next/image';
import { WalletProvider } from '@/components/providers/wallet-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { WalletButton } from '@/components/wallet-button';
import { Toaster } from 'sonner';
import { useWindowManager, type WindowId } from '@/lib/stores/window-manager';
import { SplineWallpaper } from '@/components/spline-wallpaper';

const ALL_WINDOWS: { id: WindowId; icon: string; label: string }[] = [
  { id: 'onboarding', icon: '/icons/xp-home.svg', label: 'Welcome' },
  { id: 'shop', icon: '/icons/xp-cards.svg', label: 'Free Mint' },
  { id: 'collection', icon: '/icons/xp-collection.svg', label: 'Collection' },
  { id: 'leaderboard', icon: '/icons/xp-trophy.svg', label: 'Leaderboard' },
  { id: 'generator', icon: '/icons/xp-cards.svg', label: 'Card Generator' },
];

function TaskbarInner() {
  const windows = useWindowManager((s) => s.windows);
  const focusedWindow = useWindowManager((s) => s.focusedWindow);
  const toggleWindow = useWindowManager((s) => s.toggleWindow);
  const openWindow = useWindowManager((s) => s.openWindow);
  const [startOpen, setStartOpen] = useState(false);

  const openWindows = windows.filter((w) => w.isOpen);

  return (
    <div className="xp-taskbar">
      {/* Start button */}
      <div className="relative">
        <button
          className="xp-start-button"
          onClick={() => setStartOpen(!startOpen)}
        >
          <Image src="/icons/xp-start.svg" alt="" width={16} height={16} className="shrink-0" />
          start
        </button>

        {/* Start menu */}
        {startOpen && (
          <>
            <div className="fixed inset-0 z-[98]" onClick={() => setStartOpen(false)} />
            <div className="xp-start-menu">
              <div className="xp-start-menu-header">
                <Image src="/icons/xp-cards.svg" alt="" width={16} height={16} />
                <span className="font-bold">THE SHAPE GAME</span>
              </div>
              <div className="xp-start-menu-items">
                {ALL_WINDOWS.map((w) => (
                  <button
                    key={w.id}
                    className="xp-start-menu-item"
                    onClick={() => {
                      openWindow(w.id);
                      setStartOpen(false);
                    }}
                  >
                    <Image src={w.icon} alt="" width={16} height={16} className="shrink-0" />
                    <span>{w.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Taskbar buttons — one per open window */}
      <div className="xp-taskbar-buttons">
        {openWindows.map((w) => {
          const isFocused = focusedWindow === w.id;
          return (
            <button
              key={w.id}
              className={`xp-taskbar-btn ${isFocused ? 'xp-taskbar-btn-active' : ''} ${w.isMinimized ? 'xp-taskbar-btn-minimized' : ''}`}
              onClick={() => toggleWindow(w.id)}
            >
              <img src={w.icon} alt="" width={14} height={14} className="shrink-0" />
              <span className="truncate">{w.title}</span>
            </button>
          );
        })}
      </div>

      {/* System tray */}
      <div className="xp-tray">
        <WalletButton />
        <img src="/icons/xp-speaker.svg" alt="" width={14} height={14} />
        <span className="text-[11px]">
          {new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </span>
      </div>
    </div>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <AuthProvider>
      <div className="xp-desktop flex flex-col" style={{ paddingBottom: 36 }}>
        {/* 3D Spline wallpaper */}
        <SplineWallpaper />

        {/* Main content — desktop area */}
        <main className="flex-1 relative" style={{ zIndex: 1, pointerEvents: 'none' }}>
          {children}
        </main>

        {/* XP Taskbar with dynamic buttons */}
        <TaskbarInner />

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
      </AuthProvider>
    </WalletProvider>
  );
}
