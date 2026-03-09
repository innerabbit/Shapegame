'use client';

import { useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { SeedCard } from '@/lib/cards/generate-seed';
import { useCards } from '@/lib/hooks/use-cards';
import { CardPreview } from '@/components/admin/card-preview';
import { RARITY_LABELS } from '@/lib/constants';
import { XpWindow, XpProgress } from '@/components/xp';

export default function CollectionPage() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { cards: allCards } = useCards();
  const [filter, setFilter] = useState<string>('all');

  const filteredCards = useMemo(() => {
    if (filter === 'all') return allCards;
    return allCards.filter((c) => c.rarity_tier === filter);
  }, [allCards, filter]);

  const ownedCardNumbers = new Set<number>();

  const byRarity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of allCards) {
      counts[c.rarity_tier] = (counts[c.rarity_tier] || 0) + 1;
    }
    return counts;
  }, [allCards]);

  if (!connected) {
    return (
      <XpWindow title="My Collection" icon="🃏">
        <div className="flex flex-col items-center py-10 text-center">
          <span className="text-5xl mb-4">🃏</span>
          <h2 className="text-[14px] font-bold text-[#003399] mb-2">Your Card Collection</h2>
          <p className="text-[11px] text-[#666] max-w-sm mb-4">
            Connect your Solana wallet to view your card collection
            and track your progress toward completing the full set.
          </p>
          <button
            onClick={() => setVisible(true)}
            className="xp-button xp-button-primary px-6 py-[5px] text-[12px] font-bold"
          >
            👛 Connect Wallet
          </button>
        </div>
      </XpWindow>
    );
  }

  const completionPct = allCards.length > 0
    ? (ownedCardNumbers.size / allCards.length) * 100
    : 0;

  return (
    <div className="space-y-4">
      <XpWindow
        title="My Collection"
        icon="🃏"
        statusBar={
          <>
            <div>{ownedCardNumbers.size}/{allCards.length} cards</div>
            <div>{completionPct.toFixed(1)}% complete</div>
            <div className="flex-1 text-right">
              Showing: {filteredCards.length} cards
            </div>
          </>
        }
      >
        {/* Toolbar area */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          {/* Completion bar */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#222] font-bold">Completion:</span>
            <XpProgress value={completionPct} className="w-40" />
            <span className="text-[11px] text-[#003399] font-bold">
              {completionPct.toFixed(1)}%
            </span>
          </div>

          {/* Rarity filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#666] mr-1">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`xp-button px-2 py-0 text-[10px] ${
                filter === 'all' ? 'xp-button-primary' : ''
              }`}
            >
              All ({allCards.length})
            </button>
            {(['common', 'rare', 'epic', 'legendary'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilter(filter === r ? 'all' : r)}
                className={`xp-button px-2 py-0 text-[10px] ${
                  filter === r ? 'xp-button-primary' : ''
                }`}
              >
                {RARITY_LABELS[r]} ({byRarity[r] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Card grid */}
        <div className="xp-listview p-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filteredCards.map((card) => {
              const owned = ownedCardNumbers.has(card.card_number);
              return (
                <div
                  key={card.card_number}
                  className={`flex justify-center ${
                    owned ? '' : 'opacity-30 grayscale'
                  }`}
                >
                  <CardPreview card={card} size="sm" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {ownedCardNumbers.size === 0 && (
          <div className="xp-infobar mt-3">
            <span className="text-lg">ℹ️</span>
            <div>
              <span className="font-bold">No cards yet.</span>{' '}
              Visit the{' '}
              <a href="/shop" className="xp-link">Shop</a>{' '}
              to buy your first booster pack!
            </div>
          </div>
        )}
      </XpWindow>
    </div>
  );
}
