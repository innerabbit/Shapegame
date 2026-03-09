import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 overflow-hidden relative">
      {/* VHS scan lines */}
      <div
        className="pointer-events-none fixed inset-0 z-30 opacity-[0.02]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Glowing background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-[96px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-700/50 rounded-full px-4 py-1.5 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-blue-300">Live on Solana Devnet</span>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter">
              <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                SHAPE
              </span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                CARDS
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-neutral-400 max-w-lg mx-auto leading-relaxed">
              Collect 195 unique shape cards. Open booster packs with 3D animation.
              Trade and battle on Solana.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="
                group relative px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500
                text-black font-bold text-lg rounded-lg
                hover:from-yellow-400 hover:to-amber-400
                transition-all shadow-lg shadow-yellow-500/20
                hover:shadow-yellow-400/30 hover:scale-105
              "
            >
              <span className="relative z-10">Open Booster Pack</span>
            </Link>
            <Link
              href="/collection"
              className="
                px-8 py-3 border border-neutral-700 text-neutral-300
                font-medium text-lg rounded-lg
                hover:bg-neutral-900 hover:text-white hover:border-neutral-600
                transition-all
              "
            >
              View Collection
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 pt-8">
            {[
              { value: '195', label: 'Unique Cards' },
              { value: '12', label: 'Shape Types' },
              { value: '4', label: 'Rarities' },
              { value: '6', label: 'Cards/Pack' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {value}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating cards preview */}
        <div className="relative z-10 mt-16 flex items-center justify-center gap-4">
          {[
            { emoji: '⚪', rarity: 'common', name: 'Circle', color: 'neutral' },
            { emoji: '💎', rarity: 'epic', name: 'Diamond', color: 'purple' },
            { emoji: '⭐', rarity: 'legendary', name: 'Star', color: 'yellow' },
            { emoji: '🔺', rarity: 'rare', name: 'Triangle', color: 'blue' },
            { emoji: '❤️', rarity: 'epic', name: 'Heart', color: 'purple' },
          ].map((card, i) => (
            <div
              key={card.name}
              className={`
                w-32 h-44 sm:w-40 sm:h-56 rounded-xl border-2 overflow-hidden
                flex flex-col transition-transform hover:scale-110 hover:-translate-y-2
                ${card.color === 'yellow'
                  ? 'border-yellow-500 bg-gradient-to-b from-yellow-950 via-amber-950 to-neutral-900 shadow-[0_0_30px_rgba(234,179,8,0.2)]'
                  : card.color === 'purple'
                  ? 'border-purple-500 bg-gradient-to-b from-purple-950 to-neutral-900 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                  : card.color === 'blue'
                  ? 'border-blue-500 bg-gradient-to-b from-blue-950 to-neutral-900 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'border-neutral-600 bg-gradient-to-b from-neutral-800 to-neutral-900'
                }
              `}
              style={{
                transform: `rotate(${(i - 2) * 5}deg) translateY(${Math.abs(i - 2) * 12}px)`,
              }}
            >
              <div className="flex-1 flex items-center justify-center">
                <span className="text-4xl sm:text-5xl opacity-60">{card.emoji}</span>
              </div>
              <div className="px-2 py-1.5 bg-black/30 text-center">
                <div className="text-[10px] font-bold text-white/80">{card.name}</div>
                <div className="text-[8px] text-neutral-500 uppercase tracking-wider">{card.rarity}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-neutral-600">Scroll</span>
          <span className="text-neutral-600">↓</span>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 border-t border-neutral-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-16 tracking-tight">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Wallet',
                description: 'Link your Solana wallet (Phantom, Solflare). No account needed.',
                icon: '👛',
              },
              {
                step: '02',
                title: 'Buy Booster Packs',
                description: '6 random cards per pack. Guaranteed at least 1 Rare or better.',
                icon: '📦',
              },
              {
                step: '03',
                title: 'Collect & Battle',
                description: 'Build your collection. Trade with others. Enter MTG-style battles.',
                icon: '⚔️',
              },
            ].map(({ step, title, description, icon }) => (
              <div
                key={step}
                className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{icon}</span>
                  <span className="text-xs font-mono text-neutral-600">{step}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-yellow-400 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rarity Tiers */}
      <section className="py-24 px-4 border-t border-neutral-800/50 bg-neutral-900/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4 tracking-tight">
            Rarity Tiers
          </h2>
          <p className="text-center text-neutral-500 mb-12 text-sm">
            Material determines rarity. Rarer cards have better stats and unique abilities.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                tier: 'Common',
                material: 'Flat',
                chance: '~58%',
                border: 'border-neutral-600',
                bg: 'from-neutral-800 to-neutral-900',
                text: 'text-neutral-300',
              },
              {
                tier: 'Rare',
                material: '3D',
                chance: '~14%',
                border: 'border-blue-500',
                bg: 'from-blue-950 to-neutral-900',
                text: 'text-blue-400',
              },
              {
                tier: 'Epic',
                material: 'Chrome',
                chance: '~3%',
                border: 'border-purple-500',
                bg: 'from-purple-950 to-neutral-900',
                text: 'text-purple-400',
              },
              {
                tier: 'Legendary',
                material: 'Gold',
                chance: '~0.5%',
                border: 'border-yellow-500',
                bg: 'from-yellow-950 to-neutral-900',
                text: 'text-yellow-400',
              },
            ].map(({ tier, material, chance, border, bg, text }) => (
              <div
                key={tier}
                className={`${border} border-2 bg-gradient-to-b ${bg} rounded-xl p-5 text-center hover:scale-105 transition-transform`}
              >
                <div className={`text-2xl font-black ${text}`}>{tier}</div>
                <div className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">{material}</div>
                <div className="text-sm font-mono text-neutral-400 mt-3">{chance}</div>
                <div className="text-[10px] text-neutral-600">drop rate</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-neutral-800/50">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to collect?
          </h2>
          <p className="text-neutral-500">
            Open your first booster pack and start building your collection.
          </p>
          <Link
            href="/shop"
            className="
              inline-block px-10 py-4 bg-gradient-to-r from-yellow-500 to-amber-500
              text-black font-bold text-lg rounded-lg
              hover:from-yellow-400 hover:to-amber-400
              transition-all shadow-lg shadow-yellow-500/20
              hover:shadow-yellow-400/30 hover:scale-105
            "
          >
            Enter the Shop
          </Link>
        </div>
      </section>

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
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors text-sm">Twitter</a>
            <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors text-sm">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
