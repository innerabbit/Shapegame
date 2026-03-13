'use client';

import { useEffect } from 'react';
import { useWindowManager, type WindowId } from '@/lib/stores/window-manager';
import { XpManagedWindow } from '@/components/xp/xp-managed-window';
import { OnboardingContent } from '@/components/windows/onboarding-content';
import { ShopContent } from '@/components/windows/shop-content';
import { CollectionContent } from '@/components/windows/collection-content';
import { LeaderboardContent } from '@/components/windows/leaderboard-content';
import { GeneratorContent } from '@/components/windows/generator-content';
import { RunnerContent } from '@/components/windows/runner-content';

const HASH_TO_WINDOW: Record<string, WindowId> = {
  shop: 'shop',
  collection: 'collection',
  leaderboard: 'leaderboard',
  generator: 'generator',
  runner: 'runner',
};

export default function HomePage() {
  const focusedWindow = useWindowManager((s) => s.focusedWindow);
  const windows = useWindowManager((s) => s.windows);
  const hasAnyOpen = windows.some((w) => w.isOpen);

  // On mount: focus window from hash (all windows start open)
  useEffect(() => {
    const { focusWindow } = useWindowManager.getState();
    const hash = window.location.hash.replace('#', '');
    const windowId = HASH_TO_WINDOW[hash];
    if (windowId) {
      focusWindow(windowId);
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
        statusBar={<><div>Collection</div><div className="flex-1 text-right">THE SHAPE GAME</div></>}
      >
        <CollectionContent />
      </XpManagedWindow>

      <XpManagedWindow
        windowId="leaderboard"
        statusBar={<><div>10 collectors listed</div><div>Preview data</div><div className="flex-1 text-right">Leaderboard</div></>}
      >
        <LeaderboardContent />
      </XpManagedWindow>

      <XpManagedWindow windowId="generator">
        <GeneratorContent />
      </XpManagedWindow>

      <XpManagedWindow windowId="runner" noPadding className="xp-managed-window-runner">
        <RunnerContent />
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
