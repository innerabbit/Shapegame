'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { generateAllCards, type SeedCard } from '@/lib/cards/generate-seed';
import { CardPreview } from '@/components/admin/card-preview';
import { SHAPES, RARITY_LABELS, RARITY_COLORS } from '@/lib/constants';

export default function CollectionPage() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [allCards, setAllCards] = useState<SeedCard[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    setAllCards(generateAllCards());
  }, []);

  const filteredCards = useMemo(() => {
    if (filter === 'all') return allCards;
    return allCards.filter((c) => c.rarity_tier === filter);
  }, [allCards, filter]);

  // In a real app, this would be the user's owned cards
  const ownedCardNumbers = new Set<number>(); // Empty for now

  const byRarity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of allCards) {
      counts[c.rarity_tier] = (counts[c.rarity_tier] || 0) + 1;
    }
    return counts;
  }, [allCards]);

  if (!connected) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <span className="text-6xl mb-6">🃏</span>
        <h1 className="text-3xl font-black mb-3">Your Collection</h1>
        <p className="text-neutral-500 max-w-md mb-8">
          Connect your Solana wallet to view your card collection and track
          your progress toward completing the full set.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Collection</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {ownedCardNumbers.size}/{allCards.length} cards collected
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-400">
            Completion: {allCards.length > 0 ? ((ownedCardNumbers.size / allCards.length) * 100).toFixed(1) : 0}%
          </div>
          <div className="w-48 h-2 bg-neutral-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all"
              style={{
                width: `${allCards.length > 0 ? (ownedCardNumbers.size / allCards.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Rarity filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-neutral-700 text-white'
              : 'text-neutral-500 hover:text-white'
          }`}
        >
          All ({allCards.length})
        </button>
        {(['common', 'rare', 'epic', 'legendary'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilter(filter === r ? 'all' : r)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === r
                ? `${RARITY_COLORS[r].bg} ${RARITY_COLORS[r].text}`
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            {RARITY_LABELS[r]} ({byRarity[r] || 0})
          </button>
        ))}
      </div>

      {/* Card Grid — shows all 195 cards, locked/unlocked */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredCards.map((card) => {
          const owned = ownedCardNumbers.has(card.card_number);
          return (
            <div
              key={card.card_number}
              className={`
                flex justify-center transition-all
                ${owned ? '' : 'opacity-30 grayscale hover:opacity-50 hover:grayscale-[50%]'}
              `}
            >
              <CardPreview card={card} size="sm" />
            </div>
          );
        })}
      </div>

      {/* Empty owned state */}
      {ownedCardNumbers.size === 0 && (
        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl">
          <span className="text-4xl mb-3 block">📦</span>
          <p className="text-neutral-500">
            No cards yet. Visit the{' '}
            <a href="/shop" className="text-yellow-400 hover:text-yellow-300">
              Shop
            </a>{' '}
            to buy your first booster pack!
          </p>
        </div>
      )}
    </div>
  );
}
