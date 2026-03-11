'use client';

import { useEffect } from 'react';
import { useWindowManager, type WindowId } from '@/lib/stores/window-manager';
import { XpManagedWindow } from '@/components/xp/xp-managed-window';
import { OnboardingContent } from '@/components/windows/onboarding-content';
import { ShopContent } from '@/components/windows/shop-content';
import { CollectionContent } from '@/components/windows/collection-content';
import { DecksContent } from '@/components/windows/decks-content';
import { LeaderboardContent } from '@/components/windows/leaderboard-content';

const HASH_TO_WINDOW: Record<string, WindowId> = {
  shop: 'shop',
  collection: 'collection',
  decks: 'decks',
  leaderboard: 'leaderboard',
};

export default function HomePage() {
  const focusedWindow = useWindowManager((s) => s.focusedWindow);
  const windows = useWindowManager((s) => s.windows);
  const hasAnyOpen = windows.some((w) => w.isOpen);

  // On mount: open window from hash or default to onboarding
  useEffect(() => {
    const { openWindow } = useWindowManager.getState();
    const hash = window.location.hash.replace('#', '');
    const windowId = HASH_TO_WINDOW[hash];

    if (windowId) {
      openWindow(windowId);
    } else {
      const onboardingCompleted = localStorage.getItem('sc_onboarding_done');
      if (onboardingCompleted) {
        openWindow('shop');
      } else {
        openWindow('onboarding');
      }
    }
  }, []);

  // Sync hash with focused window
  useEffect(() => {
    if (focusedWindow && focusedWindow !== 'onboarding') {
      window.location.hash = focusedWindow;
    }
  }, [focusedWindow]);

  // Mark onboarding as completed when shop is opened
  useEffect(() => {
    const shopWindow = windows.find((w) => w.id === 'shop');
    if (shopWindow?.isOpen) {
      localStorage.setItem('sc_onboarding_done', '1');
    }
  }, [windows]);

  return (
    <div className="xp-window-area">
      <XpManagedWindow windowId="onboarding">
        <OnboardingContent />
      </XpManagedWindow>

      <XpManagedWindow windowId="shop">
        <ShopContent />
      </XpManagedWindow>

      <XpManagedWindow
        windowId="collection"
        statusBar={<><div>Collection</div><div className="flex-1 text-right">SHAPE_CARDS</div></>}
      >
        <CollectionContent />
      </XpManagedWindow>

      <XpManagedWindow windowId="decks">
        <DecksContent />
      </XpManagedWindow>

      <XpManagedWindow
        windowId="leaderboard"
        statusBar={<><div>10 collectors listed</div><div>Preview data</div><div className="flex-1 text-right">Leaderboard</div></>}
      >
        <LeaderboardContent />
      </XpManagedWindow>

      {/* Empty desktop message when no windows open */}
      {!hasAnyOpen && (
        <div className="flex items-center justify-center h-full">
          <div className="text-white/60 text-center">
            <div className="text-4xl mb-2">🎴</div>
            <div className="text-[12px]">Click Start or a taskbar button to open a window</div>
          </div>
        </div>
      )}
    </div>
  );
}
