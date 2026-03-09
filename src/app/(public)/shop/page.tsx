'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

type PackType = 'booster' | 'display';

const PACKS = {
  booster: {
    name: 'Booster Pack',
    emoji: '📦',
    cards: 6,
    price: 0.05,
    description: '6 random cards. Guaranteed 1 Rare or better.',
    features: ['6 cards per pack', '1 guaranteed Rare+', 'Chance for Legendary'],
    color: 'blue',
  },
  display: {
    name: 'Display Box',
    emoji: '🎁',
    cards: 36,
    price: 0.25,
    description: '6 booster packs (36 cards). Better value, more chances.',
    features: ['6 packs (36 cards)', '6 guaranteed Rare+', 'Bonus foil card', 'Best value'],
    color: 'yellow',
  },
} as const;

export default function ShopPage() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [selectedPack, setSelectedPack] = useState<PackType>('booster');
  const [quantity, setQuantity] = useState(1);

  const pack = PACKS[selectedPack];
  const total = pack.price * quantity;

  const handleBuy = () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    // TODO: Implement Solana transaction
    alert(`Would buy ${quantity}x ${pack.name} for ${total} SOL`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          The Shop
        </h1>
        <p className="text-neutral-500 max-w-md mx-auto">
          Buy booster packs to grow your collection. Each pack contains random
          cards with weighted rarity drops.
        </p>
      </div>

      {/* Pack Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {(Object.entries(PACKS) as [PackType, typeof PACKS[PackType]][]).map(
          ([key, p]) => {
            const isSelected = selectedPack === key;
            const isBest = key === 'display';
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedPack(key);
                  setQuantity(1);
                }}
                className={`
                  relative text-left rounded-xl border-2 p-6 transition-all
                  ${isSelected
                    ? p.color === 'yellow'
                      ? 'border-yellow-500 bg-yellow-950/30 ring-1 ring-yellow-500/30'
                      : 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/30'
                    : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                  }
                `}
              >
                {isBest && (
                  <div className="absolute -top-3 right-4 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                    BEST VALUE
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <span className="text-5xl">{p.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      {p.description}
                    </p>
                    <div className="mt-3 space-y-1">
                      {p.features.map((f) => (
                        <div
                          key={f}
                          className="flex items-center gap-2 text-xs text-neutral-400"
                        >
                          <span className="text-green-400">✓</span>
                          {f}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">
                        {p.price}
                      </span>
                      <span className="text-sm text-neutral-500">SOL</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          },
        )}
      </div>

      {/* Purchase Panel */}
      <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-400">Quantity</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-lg transition-colors"
            >
              −
            </button>
            <span className="w-10 text-center font-bold text-lg">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="w-8 h-8 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-lg transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">
              {quantity}x {pack.name}
            </span>
            <span className="font-mono">{total.toFixed(2)} SOL</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Cards total</span>
            <span className="font-mono">{pack.cards * quantity}</span>
          </div>
        </div>

        <button
          onClick={handleBuy}
          className={`
            w-full py-3 rounded-lg font-bold text-lg transition-all
            ${connected
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-400/30'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400'
            }
          `}
        >
          {connected ? (
            <>Buy for {total.toFixed(2)} SOL</>
          ) : (
            <>Connect Wallet to Buy</>
          )}
        </button>

        {!connected && (
          <p className="text-center text-xs text-neutral-600">
            You need a Solana wallet (Phantom, Solflare) to purchase
          </p>
        )}
      </div>

      {/* What You Get */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          What&apos;s Inside
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              tier: 'Common',
              material: 'Flat',
              chance: '58%',
              border: 'border-neutral-600',
              text: 'text-neutral-400',
            },
            {
              tier: 'Rare',
              material: '3D',
              chance: '14%',
              border: 'border-blue-600',
              text: 'text-blue-400',
            },
            {
              tier: 'Epic',
              material: 'Chrome',
              chance: '3%',
              border: 'border-purple-600',
              text: 'text-purple-400',
            },
            {
              tier: 'Legendary',
              material: 'Gold',
              chance: '0.5%',
              border: 'border-yellow-500',
              text: 'text-yellow-400',
            },
          ].map(({ tier, material, chance, border, text }) => (
            <div
              key={tier}
              className={`${border} border rounded-lg p-4 bg-neutral-900/50 text-center`}
            >
              <div className={`font-bold ${text}`}>{tier}</div>
              <div className="text-xs text-neutral-600 mt-0.5">{material}</div>
              <div className="text-lg font-mono text-neutral-300 mt-2">
                {chance}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview link */}
      <div className="text-center">
        <Link
          href="/open"
          className="text-sm text-neutral-500 hover:text-amber-400 transition-colors"
        >
          Preview the 3D pack opening animation →
        </Link>
      </div>
    </div>
  );
}
