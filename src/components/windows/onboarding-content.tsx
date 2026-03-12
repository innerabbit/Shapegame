'use client';

import { useWindowManager } from '@/lib/stores/window-manager';

export function OnboardingContent() {
  const openWindow = useWindowManager((s) => s.openWindow);
  const closeWindow = useWindowManager((s) => s.closeWindow);

  const goToShop = () => {
    closeWindow('onboarding');
    openWindow('shop');
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left panel — blue sidebar like XP welcome */}
      <div
        className="md:w-48 shrink-0 rounded-sm p-5 flex flex-col items-center text-center"
        style={{
          background: 'linear-gradient(180deg, #1a5aaf 0%, #2b6cc4 30%, #3a80d8 100%)',
          color: 'white',
        }}
      >
        <div className="text-5xl mb-3">🎴</div>
        <div className="text-lg font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
          SHAPE
        </div>
        <div className="text-2xl font-black tracking-wider" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
          CARDS
        </div>
        <div className="text-[10px] mt-2 opacity-80">NFT Collection on Solana</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 space-y-5">
        <div>
          <h2 className="text-sm font-bold text-[#003399] mb-1">Welcome to SHAPE_CARDS</h2>
          <p className="text-[11px] text-[#444] leading-relaxed">
            Collect 195 unique shape cards on the Solana blockchain. Open booster packs
            with a 3D animation, trade with other collectors, and enter battles.
          </p>
        </div>

        {/* How it works */}
        <fieldset className="xp-groupbox">
          <legend className="xp-groupbox-legend">How It Works</legend>
          <div className="space-y-2">
            {[
              { step: '1.', icon: '👛', title: 'Connect Wallet', desc: 'Link your Solana wallet (Phantom, Solflare)' },
              { step: '2.', icon: '📦', title: 'Buy Booster Packs', desc: '6 random cards per pack, 1 guaranteed Rare+' },
              { step: '3.', icon: '⚔️', title: 'Collect & Battle', desc: 'Build your set and enter card battles' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex items-start gap-2 text-[11px]">
                <span className="text-[#003399] font-bold w-4 shrink-0">{step}</span>
                <span className="text-base shrink-0">{icon}</span>
                <div>
                  <span className="font-bold text-[#222]">{title}</span>
                  <span className="text-[#666]"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        {/* CTA */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={goToShop}
            className="xp-button xp-button-primary px-6 py-[5px] text-[12px] font-bold"
          >
            🎴 Free Mint
          </button>
          <button
            onClick={goToShop}
            className="xp-button px-4 py-[5px] text-[12px] text-[#666]"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
