'use client';

import { useEffect, useMemo, useState } from 'react';
import { generateAllCards, type SeedCard } from '@/lib/cards/generate-seed';
import { CardPreview } from '@/components/admin/card-preview';
import {
  SHAPES,
  RARITY_LABELS,
  RARITY_COLORS,
  MANA_COLORS,
  BACKGROUNDS,
} from '@/lib/constants';
import type { RarityTier } from '@/types/cards';

type SortBy = 'number' | 'rarity' | 'atk' | 'def' | 'hp';

export default function GalleryPage() {
  const [allCards, setAllCards] = useState<SeedCard[]>([]);
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [shapeFilter, setShapeFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('number');
  const [selectedCard, setSelectedCard] = useState<SeedCard | null>(null);

  useEffect(() => {
    setAllCards(generateAllCards());
  }, []);

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

    // Sort
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
        // number — already sorted
        break;
    }

    return cards;
  }, [allCards, rarityFilter, shapeFilter, materialFilter, sortBy]);

  // Stats
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
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          Card Gallery
        </h1>
        <p className="text-neutral-500 max-w-lg mx-auto">
          Browse all {stats.total} unique cards in the SHAPE_CARDS collection.
          Filter by rarity, shape, or material to find the perfect card.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {(['common', 'rare', 'epic', 'legendary'] as RarityTier[]).map((r) => (
          <div
            key={r}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                r === 'common'
                  ? 'bg-neutral-400'
                  : r === 'rare'
                  ? 'bg-blue-400'
                  : r === 'epic'
                  ? 'bg-purple-400'
                  : 'bg-yellow-400'
              }`}
            />
            <span className="text-neutral-400">
              {RARITY_LABELS[r]}: <span className="text-white font-mono">{stats.byRarity[r] || 0}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Rarity filter */}
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Rarities</option>
          {(['common', 'rare', 'epic', 'legendary'] as RarityTier[]).map((r) => (
            <option key={r} value={r}>
              {RARITY_LABELS[r]} ({stats.byRarity[r] || 0})
            </option>
          ))}
        </select>

        {/* Shape filter */}
        <select
          value={shapeFilter}
          onChange={(e) => setShapeFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Shapes</option>
          {SHAPES.map((s) => (
            <option key={s.shape} value={s.shape}>
              {s.emoji} {s.shape} ({stats.byShape[s.shape] || 0})
            </option>
          ))}
        </select>

        {/* Material filter */}
        <select
          value={materialFilter}
          onChange={(e) => setMaterialFilter(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Materials</option>
          <option value="flat">Flat (Common)</option>
          <option value="3d">3D (Rare)</option>
          <option value="chrome">Chrome (Epic)</option>
          <option value="gold">Gold (Legendary)</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Clear filters ({activeFilters})
          </button>
        )}

        <div className="ml-auto text-sm text-neutral-500">
          {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredCards.map((card) => (
          <button
            key={card.card_number}
            onClick={() => setSelectedCard(card)}
            className="flex flex-col items-center gap-2 transition-transform hover:scale-105 focus:outline-none group"
          >
            <CardPreview card={card} size="sm" />
            <div className="text-center space-y-0.5">
              <div className="text-xs text-neutral-500 font-mono">
                #{String(card.card_number).padStart(3, '0')}
              </div>
              <div className="text-xs text-neutral-400 capitalize group-hover:text-white transition-colors">
                {card.shape}
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl mb-3 block">🔍</span>
          <p className="text-neutral-500">No cards match your filters.</p>
          <button
            onClick={() => {
              setRarityFilter('all');
              setShapeFilter('all');
              setMaterialFilter('all');
            }}
            className="text-sm text-blue-400 hover:text-blue-300 mt-2 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-lg w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold capitalize">
                  {selectedCard.shape}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      RARITY_COLORS[selectedCard.rarity_tier].bg
                    } ${RARITY_COLORS[selectedCard.rarity_tier].text}`}
                  >
                    {RARITY_LABELS[selectedCard.rarity_tier]}
                  </span>
                  <span className="text-xs text-neutral-500 capitalize">
                    {selectedCard.material} · {selectedCard.background.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-neutral-500 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Card preview */}
            <div className="flex justify-center py-4">
              <CardPreview card={selectedCard} size="lg" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-neutral-800 rounded-lg p-3 text-center">
                <div className="text-xs text-neutral-500 mb-1">ATK</div>
                <div className="text-lg font-bold text-red-400">{selectedCard.atk}</div>
              </div>
              <div className="bg-neutral-800 rounded-lg p-3 text-center">
                <div className="text-xs text-neutral-500 mb-1">DEF</div>
                <div className="text-lg font-bold text-blue-400">{selectedCard.def}</div>
              </div>
              <div className="bg-neutral-800 rounded-lg p-3 text-center">
                <div className="text-xs text-neutral-500 mb-1">HP</div>
                <div className="text-lg font-bold text-green-400">{selectedCard.hp}</div>
              </div>
              <div className="bg-neutral-800 rounded-lg p-3 text-center">
                <div className="text-xs text-neutral-500 mb-1">Mana</div>
                <div className="text-lg font-bold">
                  {MANA_COLORS[selectedCard.mana_color].emoji}
                </div>
              </div>
            </div>

            {/* Ability */}
            {selectedCard.ability && (
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3">
                <div className="text-xs text-neutral-500 mb-1">Ability</div>
                <div className="text-sm text-neutral-300">{selectedCard.ability}</div>
              </div>
            )}

            {/* Card details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Card #</span>
                <span className="font-mono">{String(selectedCard.card_number).padStart(3, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Drop Rate</span>
                <span className="font-mono text-amber-400">
                  {(selectedCard.base_rarity_pct * selectedCard.background_multiplier).toFixed(4)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Mana Color</span>
                <span>{MANA_COLORS[selectedCard.mana_color].label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Background</span>
                <span className="capitalize">{selectedCard.background.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
