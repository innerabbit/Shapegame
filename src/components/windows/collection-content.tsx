'use client';

import { useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useCards } from '@/lib/hooks/use-cards';
import { CardPreview } from '@/components/admin/card-preview';
import {
  RARITY_LABELS,
  RARITY_COLORS,
} from '@/lib/constants';
import { XpGroupBox, XpProgress } from '@/components/xp';
import { useWindowManager } from '@/lib/stores/window-manager';
import { useUserCards } from '@/hooks/use-user-cards';

type Tab = 'my-cards' | 'deck-builder';

export function CollectionContent() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { cards: allCards } = useCards();
  const openWindow = useWindowManager((s) => s.openWindow);

  const [tab, setTab] = useState<Tab>('my-cards');
  const [filter, setFilter] = useState<string>('all');

  const { ownedCardNumbers, isLoading: ownedLoading } = useUserCards();

  const filteredCards = useMemo(() => {
    let cards = allCards;
    if (filter !== 'all') cards = cards.filter((c) => c.rarity_tier === filter);
    return cards;
  }, [allCards, filter]);

  const stats = useMemo(() => {
    const byRarity: Record<string, number> = {};
    for (const c of allCards) {
      byRarity[c.rarity_tier] = (byRarity[c.rarity_tier] || 0) + 1;
    }
    return { byRarity, total: allCards.length };
  }, [allCards]);

  const completionPct = allCards.length > 0 ? (ownedCardNumbers.size / allCards.length) * 100 : 0;

  const tabBar = (
    <div className="flex border-b border-[#919b9c] mb-3">
      <button
        onClick={() => setTab('my-cards')}
        className={`px-4 py-1.5 text-[11px] border border-b-0 ${tab === 'my-cards' ? 'bg-white font-bold border-[#919b9c] -mb-px' : 'bg-[#ece9d8] border-transparent text-[#666]'}`}
      >
        🃏 My Cards
      </button>
      <button
        onClick={() => setTab('deck-builder')}
        className={`px-4 py-1.5 text-[11px] border border-b-0 ${tab === 'deck-builder' ? 'bg-white font-bold border-[#919b9c] -mb-px' : 'bg-[#ece9d8] border-transparent text-[#666]'}`}
      >
        📋 Deck Builder
      </button>
    </div>
  );

  // Not connected — prompt to connect
  if (!connected) {
    return (
      <div>
        {tabBar}
        <div className="flex flex-col items-center py-10 text-center">
          <span className="text-5xl mb-4">🃏</span>
          <h2 className="text-[14px] font-bold text-[#003399] mb-2">Your Card Collection</h2>
          <p className="text-[11px] text-[#666] max-w-sm mb-4">
            Connect your Solana wallet to view your card collection.
          </p>
          <button onClick={() => setVisible(true)} className="xp-button xp-button-primary px-6 py-[5px] text-[12px] font-bold">
            👛 Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {tabBar}

      {tab === 'my-cards' ? (
        <>
          {/* Completion + filter */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#222] font-bold">Completion:</span>
              <XpProgress value={completionPct} className="w-40" />
              <span className="text-[11px] text-[#003399] font-bold">{completionPct.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[#666] mr-1">Filter:</span>
              <button onClick={() => setFilter('all')} className={`xp-button px-2 py-0 text-[10px] ${filter === 'all' ? 'xp-button-primary' : ''}`}>
                All ({allCards.length})
              </button>
              {(['common', 'rare', 'epic', 'legendary'] as const).map((r) => (
                <button key={r} onClick={() => setFilter(filter === r ? 'all' : r)} className={`xp-button px-2 py-0 text-[10px] ${filter === r ? 'xp-button-primary' : ''}`}>
                  {RARITY_LABELS[r]} ({stats.byRarity[r] || 0})
                </button>
              ))}
            </div>
          </div>
          <div className="xp-listview p-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredCards.map((card) => {
                const owned = ownedCardNumbers.has(card.card_number);
                return (
                  <div key={card.card_number} className={`flex justify-center ${owned ? '' : 'opacity-30 grayscale'}`}>
                    <CardPreview card={card} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>
          {ownedCardNumbers.size === 0 && (
            <div className="xp-infobar mt-3">
              <span className="text-lg">ℹ️</span>
              <div>
                <span className="font-bold">No cards yet.</span>{' '}
                <button onClick={() => openWindow('shop')} className="xp-link">Visit the Shop</button> to buy your first booster pack!
              </div>
            </div>
          )}
        </>
      ) : (
        /* Deck Builder tab */
        <div className="space-y-4">
          <div className="xp-infobar">
            <span className="text-lg">🏗️</span>
            <div>
              <span className="font-bold">Coming Soon</span> — Deck building will be available
              in the next update. Collect cards now to be ready!
            </div>
          </div>

          <fieldset className="xp-groupbox">
            <legend className="xp-groupbox-legend">New Deck</legend>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#222] block mb-1">Deck Name:</label>
                <input type="text" placeholder="My First Deck" className="xp-input w-full" disabled />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[5/7] border border-dashed border-[#919b9c] bg-[#f5f3ee] flex items-center justify-center text-[#c3c0b6] text-lg"
                  >
                    +
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-[#888] text-center">0 / 30 cards</div>
              <button className="xp-button w-full py-[3px] text-[11px]" disabled>
                Save Deck
              </button>
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}
