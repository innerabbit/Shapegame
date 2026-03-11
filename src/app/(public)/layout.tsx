'use client';

import { useState } from 'react';
import { WalletProvider } from '@/components/providers/wallet-provider';
import { WalletButton } from '@/components/wallet-button';
import { Toaster } from 'sonner';
import { useWindowManager, type WindowId } from '@/lib/stores/window-manager';

const ALL_WINDOWS: { id: WindowId; icon: string; label: string }[] = [
  { id: 'onboarding', icon: '🏠', label: 'Welcome' },
  { id: 'shop', icon: '🛒', label: 'Shop' },
  { id: 'collection', icon: '🃏', label: 'Collection' },
  { id: 'decks', icon: '📋', label: 'Deck Builder' },
  { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
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
          <span className="text-base">🪟</span>
          start
        </button>

        {/* Start menu */}
        {startOpen && (
          <>
            <div className="fixed inset-0 z-[98]" onClick={() => setStartOpen(false)} />
            <div className="xp-start-menu">
              <div className="xp-start-menu-header">
                <span className="text-base">🎴</span>
                <span className="font-bold">SHAPE_CARDS</span>
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
                    <span className="text-base">{w.icon}</span>
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
              <span className="text-xs">{w.icon}</span>
              <span className="truncate">{w.title}</span>
            </button>
          );
        })}
      </div>

      {/* System tray */}
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
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <div className="xp-desktop flex flex-col" style={{ paddingBottom: 36 }}>
        {/* Title bar — fixed at top */}
        <div className="xp-top-bar">
          <div className="flex items-center gap-[6px]">
            <span className="text-sm">🎴</span>
            <span className="xp-title-text">SHAPE_CARDS</span>
          </div>
          <WalletButton />
        </div>

        {/* Main content — desktop area */}
        <main className="flex-1 relative">
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
    </WalletProvider>
  );
}
