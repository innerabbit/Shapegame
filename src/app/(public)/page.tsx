import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center">
      {/* Main welcome window */}
      <div className="xp-window w-full max-w-3xl">
        {/* Title bar */}
        <div className="xp-title-bar">
          <div className="flex items-center gap-[6px]">
            <span className="text-sm">🎴</span>
            <span className="xp-title-text">Welcome to SHAPE_CARDS</span>
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

        <div className="xp-window-content">
          {/* Hero section — XP Welcome Screen style */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left panel — blue sidebar like XP welcome */}
            <div className="md:w-56 shrink-0 rounded-sm p-5 flex flex-col items-center text-center"
              style={{
                background: 'linear-gradient(180deg, #1a5aaf 0%, #2b6cc4 30%, #3a80d8 100%)',
                color: 'white',
              }}>
              <div className="text-5xl mb-3">🎴</div>
              <div className="text-lg font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                SHAPE
              </div>
              <div className="text-2xl font-black tracking-wider" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                CARDS
              </div>
              <div className="text-[10px] mt-2 opacity-80">
                NFT Collection on Solana
              </div>
              <div className="mt-4 w-full border-t border-white/20 pt-3 space-y-1 text-[11px]">
                <div className="flex justify-between"><span>Cards:</span><span className="font-bold">195</span></div>
                <div className="flex justify-between"><span>Shapes:</span><span className="font-bold">13</span></div>
                <div className="flex justify-between"><span>Rarities:</span><span className="font-bold">4</span></div>
                <div className="flex justify-between"><span>Per Pack:</span><span className="font-bold">6</span></div>
              </div>
            </div>

            {/* Right panel — content */}
            <div className="flex-1 space-y-5">
              <div>
                <h2 className="text-sm font-bold text-[#003399] mb-1">Welcome to SHAPE_CARDS</h2>
                <p className="text-[11px] text-[#444] leading-relaxed">
                  Collect 195 unique shape cards on the Solana blockchain. Open booster packs
                  with a 3D animation, trade with other collectors, and enter MTG-style battles.
                </p>
              </div>

              {/* How it works — XP wizard style */}
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

              {/* Rarity tiers — XP list view */}
              <fieldset className="xp-groupbox">
                <legend className="xp-groupbox-legend">Rarity Tiers</legend>
                <div className="xp-listview">
                  <div className="xp-listview-header grid grid-cols-4">
                    <span>Tier</span>
                    <span>Material</span>
                    <span>Drop Rate</span>
                    <span>Quality</span>
                  </div>
                  {[
                    { tier: 'Common', material: 'Flat', rate: '~58%', bar: 58, color: '#808080' },
                    { tier: 'Rare', material: '3D', rate: '~14%', bar: 14, color: '#3b82f6' },
                    { tier: 'Epic', material: 'Chrome', rate: '~3%', bar: 3, color: '#8b5cf6' },
                    { tier: 'Legendary', material: 'Gold', rate: '~0.5%', bar: 0.5, color: '#eab308' },
                  ].map(({ tier, material, rate, bar, color }) => (
                    <div key={tier} className="xp-listview-row grid grid-cols-4 items-center">
                      <span className="font-bold" style={{ color }}>{tier}</span>
                      <span>{material}</span>
                      <span>{rate}</span>
                      <div className="xp-progress h-[10px]">
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.max(2, bar)}%`,
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Card fan preview */}
              <div className="flex items-center justify-center gap-2 py-3">
                {[
                  { emoji: '⚪', name: 'Circle', border: '#808080' },
                  { emoji: '💎', name: 'Diamond', border: '#8b5cf6' },
                  { emoji: '⭐', name: 'Star', border: '#eab308' },
                  { emoji: '🔺', name: 'Triangle', border: '#3b82f6' },
                  { emoji: '❤️', name: 'Heart', border: '#8b5cf6' },
                ].map((card, i) => (
                  <div
                    key={card.name}
                    className="w-14 h-20 rounded-sm border-2 bg-white flex flex-col items-center justify-center shadow-sm"
                    style={{
                      borderColor: card.border,
                      transform: `rotate(${(i - 2) * 8}deg) translateY(${Math.abs(i - 2) * 6}px)`,
                    }}
                  >
                    <span className="text-xl">{card.emoji}</span>
                    <span className="text-[8px] text-[#666] mt-0.5">{card.name}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Link href="/shop">
                  <button className="xp-button xp-button-primary px-6 py-[5px] text-[12px] font-bold">
                    🛒 Open Shop
                  </button>
                </Link>
                <Link href="/gallery">
                  <button className="xp-button px-4 py-[5px] text-[12px]">
                    🖼️ Browse Cards
                  </button>
                </Link>
                <Link href="/collection">
                  <button className="xp-button px-4 py-[5px] text-[12px]">
                    🃏 My Collection
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="xp-status-bar">
          <div>Live on Solana Devnet</div>
          <div>195 unique cards</div>
          <div className="flex-1 text-right">SHAPE_CARDS v1.0</div>
        </div>
      </div>
    </div>
  );
}
