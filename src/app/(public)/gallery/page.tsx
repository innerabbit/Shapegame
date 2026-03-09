'use client';

import { useMemo, useState } from 'react';
import type { SeedCard } from '@/lib/cards/generate-seed';
import { useCards } from '@/lib/hooks/use-cards';
import { CardPreview } from '@/components/admin/card-preview';
import {
  SHAPES,
  RARITY_LABELS,
  RARITY_COLORS,
  MANA_COLORS,
} from '@/lib/constants';
import type { RarityTier } from '@/types/cards';
import { XpWindow, XpGroupBox } from '@/components/xp';

type SortBy = 'number' | 'rarity' | 'atk' | 'def' | 'hp';

export default function GalleryPage() {
  const { cards: allCards } = useCards();
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [shapeFilter, setShapeFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('number');
  const [selectedCard, setSelectedCard] = useState<SeedCard | null>(null);

  const filteredCards = useMemo(() => {
    let cards = allCards;

    if (rarityFilter !== 'all') {
      cards = cards.filter((c) => c.rarity_tier === rarityFilter);
    }
    if (shapeFilter !== 'all') {
      cards = cards.filter((c) => c.shape === shapeFilter);
    }
    if (materialFilter !== 'all') {
      cards = cards.filter((c) => c.material === materialFilter);
    }

    switch (sortBy) {
      case 'rarity': {
        const order = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
        cards = [...cards].sort(
          (a, b) => (order[a.rarity_tier] ?? 5) - (order[b.rarity_tier] ?? 5),
        );
        break;
      }
      case 'atk':
        cards = [...cards].sort((a, b) => b.atk - a.atk);
        break;
      case 'def':
        cards = [...cards].sort((a, b) => b.def - a.def);
        break;
      case 'hp':
        cards = [...cards].sort((a, b) => b.hp - a.hp);
        break;
      default:
        break;
    }

    return cards;
  }, [allCards, rarityFilter, shapeFilter, materialFilter, sortBy]);

  const stats = useMemo(() => {
    const byRarity: Record<string, number> = {};
    const byShape: Record<string, number> = {};
    for (const c of allCards) {
      byRarity[c.rarity_tier] = (byRarity[c.rarity_tier] || 0) + 1;
      byShape[c.shape] = (byShape[c.shape] || 0) + 1;
    }
    return { byRarity, byShape, total: allCards.length };
  }, [allCards]);

  const activeFilters =
    (rarityFilter !== 'all' ? 1 : 0) +
    (shapeFilter !== 'all' ? 1 : 0) +
    (materialFilter !== 'all' ? 1 : 0);

  return (
    <div className="space-y-4">
      <XpWindow
        title={`Card Gallery — ${stats.total} cards`}
        icon="🖼️"
        toolbar={
          <div className="flex items-center gap-2 flex-wrap w-full">
            <span className="text-[11px] text-[#666]">Filters:</span>
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="xp-select"
            >
              <option value="all">All Rarities</option>
              {(['common', 'rare', 'epic', 'legendary'] as RarityTier[]).map((r) => (
                <option key={r} value={r}>
                  {RARITY_LABELS[r]} ({stats.byRarity[r] || 0})
                </option>
              ))}
            </select>

            <select
              value={shapeFilter}
              onChange={(e) => setShapeFilter(e.target.value)}
              className="xp-select"
            >
              <option value="all">All Shapes</option>
              {SHAPES.map((s) => (
                <option key={s.shape} value={s.shape}>
                  {s.emoji} {s.shape} ({stats.byShape[s.shape] || 0})
                </option>
              ))}
            </select>

            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="xp-select"
            >
              <option value="all">All Materials</option>
              <option value="flat">Flat (Common)</option>
              <option value="3d">3D (Rare)</option>
              <option value="chrome">Chrome (Epic)</option>
              <option value="gold">Gold (Legendary)</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="xp-select"
            >
              <option value="number">Sort by #</option>
              <option value="rarity">Sort by Rarity</option>
              <option value="atk">Sort by ATK</option>
              <option value="def">Sort by DEF</option>
              <option value="hp">Sort by HP</option>
            </select>

            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setRarityFilter('all');
                  setShapeFilter('all');
                  setMaterialFilter('all');
                }}
                className="xp-button px-2 py-0 text-[10px]"
              >
                Clear ({activeFilters})
              </button>
            )}

            <span className="text-[11px] text-[#888] ml-auto">
              {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}
            </span>
          </div>
        }
        statusBar={
          <>
            <div>{filteredCards.length} items</div>
            <div className="flex-1 text-right">SHAPE_CARDS Gallery</div>
          </>
        }
      >
        {/* Card Grid */}
        <div className="xp-listview p-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filteredCards.map((card) => (
              <button
                key={card.card_number}
                onClick={() => setSelectedCard(card)}
                className="flex flex-col items-center gap-1 hover:bg-[#316ac5] hover:text-white p-1 rounded-sm cursor-pointer"
              >
                <CardPreview card={card} size="sm" />
                <div className="text-center">
                  <div className="text-[10px] font-mono opacity-60">
                    #{String(card.card_number).padStart(3, '0')}
                  </div>
                  <div className="text-[10px] capitalize">
                    {card.shape}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {filteredCards.length === 0 && (
          <div className="xp-infobar mt-3">
            <span className="text-lg">🔍</span>
            <div>
              <span className="font-bold">No cards match your filters.</span>{' '}
              <button
                onClick={() => {
                  setRarityFilter('all');
                  setShapeFilter('all');
                  setMaterialFilter('all');
                }}
                className="xp-link"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </XpWindow>

      {/* Card Detail Dialog */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="xp-window max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="xp-title-bar">
              <div className="flex items-center gap-[6px]">
                <span className="text-sm">🃏</span>
                <span className="xp-title-text">
                  Card #{String(selectedCard.card_number).padStart(3, '0')} — {selectedCard.shape}
                </span>
              </div>
              <div className="flex items-center gap-[2px]">
                <button
                  className="xp-btn-close"
                  onClick={() => setSelectedCard(null)}
                  aria-label="Close"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8"><path d="M0 0L8 8M8 0L0 8" stroke="currentColor" strokeWidth="1.5"/></svg>
                </button>
              </div>
            </div>

            <div className="xp-window-content">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Card preview */}
                <div className="flex justify-center">
                  <CardPreview card={selectedCard} size="lg" />
                </div>

                {/* Card info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="text-[13px] font-bold text-[#003399] capitalize">
                      {selectedCard.shape}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-[1px] font-bold inline-block mt-1 ${
                        RARITY_COLORS[selectedCard.rarity_tier].bg
                      } ${RARITY_COLORS[selectedCard.rarity_tier].text}`}
                    >
                      {RARITY_LABELS[selectedCard.rarity_tier]}
                    </span>
                  </div>

                  <XpGroupBox label="Combat Stats">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-[#666]">ATK</div>
                        <div className="text-[14px] font-bold text-[#cc3333]">{selectedCard.atk}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#666]">DEF</div>
                        <div className="text-[14px] font-bold text-[#3366cc]">{selectedCard.def}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#666]">HP</div>
                        <div className="text-[14px] font-bold text-[#22a846]">{selectedCard.hp}</div>
                      </div>
                    </div>
                  </XpGroupBox>

                  {selectedCard.ability && (
                    <XpGroupBox label="Ability">
                      <div className="text-[11px] text-[#222]">{selectedCard.ability}</div>
                    </XpGroupBox>
                  )}

                  <XpGroupBox label="Details">
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#666]">Material</span>
                        <span className="capitalize">{selectedCard.material}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Background</span>
                        <span className="capitalize">{selectedCard.background.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Mana</span>
                        <span>{MANA_COLORS[selectedCard.mana_color].emoji} {MANA_COLORS[selectedCard.mana_color].label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Drop Rate</span>
                        <span className="font-bold text-[#003399]">
                          {(selectedCard.base_rarity_pct * selectedCard.background_multiplier).toFixed(4)}%
                        </span>
                      </div>
                    </div>
                  </XpGroupBox>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  className="xp-button px-4 py-[3px]"
                  onClick={() => setSelectedCard(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
