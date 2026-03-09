'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

import { generateAllCards, type SeedCard } from '@/lib/cards/generate-seed';
import { CardPreview } from '@/components/admin/card-preview';
import {
  RARITY_COLORS,
  RARITY_LABELS,
  MANA_COLORS,
  SHAPES,
  BACKGROUNDS,
  ABILITIES,
} from '@/lib/constants';
type RarityFilter = 'all' | 'common' | 'rare' | 'epic' | 'legendary';
type MaterialFilter = 'all' | 'flat' | '3d' | 'chrome' | 'gold';

export default function CardsPage() {
  const [cards, setCards] = useState<SeedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<SeedCard | null>(null);
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [materialFilter, setMaterialFilter] = useState<MaterialFilter>('all');
  const [shapeFilter, setShapeFilter] = useState<string>('all');
  const [bgFilter, setBgFilter] = useState<string>('all');
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allCards = generateAllCards();
    setCards(allCards);
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (rarityFilter !== 'all' && c.rarity_tier !== rarityFilter) return false;
      if (materialFilter !== 'all' && c.material !== materialFilter) return false;
      if (shapeFilter !== 'all' && c.shape !== shapeFilter) return false;
      if (bgFilter !== 'all' && c.background !== bgFilter) return false;
      return true;
    });
  }, [cards, rarityFilter, materialFilter, shapeFilter, bgFilter]);

  // Keyboard navigation for selected card
  const navigateCard = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedCard) return;
      const idx = filteredCards.findIndex(
        (c) => c.card_number === selectedCard.card_number,
      );
      const newIdx = direction === 'next' ? idx + 1 : idx - 1;
      if (newIdx >= 0 && newIdx < filteredCards.length) {
        setSelectedCard(filteredCards[newIdx]);
      }
    },
    [selectedCard, filteredCards],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedCard) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateCard('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateCard('prev');
      } else if (e.key === 'Escape') {
        setSelectedCard(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedCard, navigateCard]);

  // Stats
  const byRarity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cards) {
      counts[c.rarity_tier] = (counts[c.rarity_tier] || 0) + 1;
    }
    return counts;
  }, [cards]);

  // Active filters count
  const activeFilters = [
    rarityFilter !== 'all',
    materialFilter !== 'all',
    shapeFilter !== 'all',
    bgFilter !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setRarityFilter('all');
    setMaterialFilter('all');
    setShapeFilter('all');
    setBgFilter('all');
  };

  // Export card data as JSON
  const exportCards = () => {
    const data = filteredCards.map((c) => ({
      number: c.card_number,
      shape: c.shape,
      material: c.material,
      background: c.background,
      rarity: c.rarity_tier,
      mana_color: c.mana_color,
      mana_cost: c.mana_cost,
      atk: c.atk,
      def: c.def,
      hp: c.hp,
      ability: c.ability || null,
      drop_rate: +(c.base_rarity_pct * c.background_multiplier).toFixed(4),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shape-cards-${filteredCards.length}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Find selected card position in filtered list
  const selectedIdx = selectedCard
    ? filteredCards.findIndex((c) => c.card_number === selectedCard.card_number)
    : -1;

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stage 2: Card Compositing</h2>
          <p className="text-neutral-400 text-sm mt-1">
            Preview how {cards.length} cards will look with frames, stats, and abilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-neutral-900 border-neutral-700 text-xs"
            onClick={exportCards}
          >
            Export JSON
          </Button>
          <div className="text-sm text-neutral-400">
            {filteredCards.length}/{cards.length}
          </div>
        </div>
      </div>

      {/* Rarity Distribution */}
      <div className="grid grid-cols-5 gap-2">
        {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => {
          const colors = RARITY_COLORS[rarity];
          const count = byRarity[rarity] || 0;
          const isActive = rarityFilter === rarity;
          return (
            <button
              key={rarity}
              onClick={() => setRarityFilter(isActive ? 'all' : rarity)}
              className={`
                rounded-lg p-3 text-center transition-all border
                ${isActive
                  ? `${colors.border} ${colors.bg} ring-1 ring-offset-1 ring-offset-neutral-950 ring-current`
                  : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800'
                }
              `}
            >
              <div className={`text-2xl font-bold ${colors.text}`}>{count}</div>
              <div className="text-xs text-neutral-400 mt-0.5">{RARITY_LABELS[rarity]}</div>
            </button>
          );
        })}
        <button
          onClick={() => setRarityFilter('all')}
          className={`
            rounded-lg p-3 text-center transition-all border
            ${rarityFilter === 'all'
              ? 'border-neutral-500 bg-neutral-800 ring-1 ring-offset-1 ring-offset-neutral-950 ring-neutral-400'
              : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800'
            }
          `}
        >
          <div className="text-2xl font-bold text-white">{cards.length}</div>
          <div className="text-xs text-neutral-400 mt-0.5">All</div>
        </button>
      </div>

      {/* Filters + Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Shape filter */}
        <Select value={shapeFilter} onValueChange={(v) => setShapeFilter(v ?? 'all')}>
          <SelectTrigger className="w-[150px] bg-neutral-900 border-neutral-700 text-sm">
            <SelectValue placeholder="All Shapes" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-700">
            <SelectItem value="all">All Shapes</SelectItem>
            {SHAPES.map((s) => (
              <SelectItem key={s.shape} value={s.shape}>
                {s.emoji} {s.shape.charAt(0).toUpperCase() + s.shape.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Material filter */}
        <Select value={materialFilter} onValueChange={(v) => setMaterialFilter(v as MaterialFilter)}>
          <SelectTrigger className="w-[140px] bg-neutral-900 border-neutral-700 text-sm">
            <SelectValue placeholder="All Materials" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-700">
            <SelectItem value="all">All Materials</SelectItem>
            <SelectItem value="flat">Flat</SelectItem>
            <SelectItem value="3d">3D</SelectItem>
            <SelectItem value="chrome">Chrome</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
          </SelectContent>
        </Select>

        {/* Background filter */}
        <Select value={bgFilter} onValueChange={(v) => setBgFilter(v ?? 'all')}>
          <SelectTrigger className="w-[160px] bg-neutral-900 border-neutral-700 text-sm">
            <SelectValue placeholder="All Backgrounds" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-700">
            <SelectItem value="all">All Backgrounds</SelectItem>
            {BACKGROUNDS.map((bg) => (
              <SelectItem key={bg.type} value={bg.type}>
                {bg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-white text-xs"
            onClick={clearFilters}
          >
            Clear ({activeFilters})
          </Button>
        )}

        {/* Size toggle */}
        <div className="ml-auto flex items-center gap-1 bg-neutral-900 border border-neutral-700 rounded-md p-0.5">
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setCardSize(s)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                cardSize === s ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {s === 'sm' ? 'S' : s === 'md' ? 'M' : 'L'}
            </button>
          ))}
        </div>
      </div>

      {/* Shape Quick Filter Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {SHAPES.map((s) => {
          const count = cards.filter((c) => c.shape === s.shape).length;
          const isActive = shapeFilter === s.shape;
          return (
            <button
              key={s.shape}
              onClick={() => setShapeFilter(isActive ? 'all' : s.shape)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all border
                ${isActive
                  ? 'border-neutral-500 bg-neutral-700 text-white'
                  : 'border-neutral-800 bg-neutral-900/50 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                }
              `}
            >
              <span>{s.emoji}</span>
              <span className="capitalize">{s.shape}</span>
              <span className="text-neutral-600">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Card Grid */}
      <div className={`
        grid gap-4
        ${cardSize === 'sm' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' :
          cardSize === 'md' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}
      `}>
        {filteredCards.map((card) => (
          <div
            key={card.card_number}
            className={`
              flex justify-center cursor-pointer
              transition-all duration-200
              ${selectedCard?.card_number === card.card_number
                ? 'scale-[1.02] ring-2 ring-neutral-500 rounded-xl'
                : 'hover:scale-[1.01]'
              }
            `}
            onClick={() => setSelectedCard(
              selectedCard?.card_number === card.card_number ? null : card
            )}
          >
            <CardPreview card={card} size={cardSize} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredCards.length === 0 && (
        <div className="text-center py-16">
          <p className="text-neutral-500 text-lg">No cards match these filters</p>
          <Button
            variant="ghost"
            className="mt-2 text-neutral-400"
            onClick={clearFilters}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Selected Card Detail Panel */}
      {selectedCard && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-full px-4">
          <Card className="bg-neutral-900/95 backdrop-blur-lg border-neutral-700 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Card Preview */}
                <div className="shrink-0">
                  <CardPreview card={selectedCard} size="sm" />
                </div>

                {/* Card Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Name + Rarity */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold capitalize">{selectedCard.shape}</span>
                    <Badge
                      variant="outline"
                      className={`${RARITY_COLORS[selectedCard.rarity_tier].bg} ${RARITY_COLORS[selectedCard.rarity_tier].text} ${RARITY_COLORS[selectedCard.rarity_tier].border} text-xs`}
                    >
                      {RARITY_LABELS[selectedCard.rarity_tier]}
                    </Badge>
                    <Badge variant="outline" className="bg-neutral-800 text-neutral-400 border-neutral-700 text-xs">
                      W{selectedCard.wave}
                    </Badge>
                  </div>

                  {/* Meta */}
                  <div className="text-sm text-neutral-400">
                    #{String(selectedCard.card_number).padStart(3, '0')} &middot;{' '}
                    <span className="capitalize">{selectedCard.material}</span> &middot;{' '}
                    <span className="capitalize">{selectedCard.background.replace('_', ' ')}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3 text-sm">
                    <span><span className="text-red-400 font-bold">ATK</span> {selectedCard.atk}</span>
                    <span><span className="text-blue-400 font-bold">DEF</span> {selectedCard.def}</span>
                    <span><span className="text-green-400 font-bold">HP</span> {selectedCard.hp}</span>
                    <span>
                      {MANA_COLORS[selectedCard.mana_color].emoji}{' '}
                      <span className="text-neutral-300">{selectedCard.mana_cost}</span>
                    </span>
                  </div>

                  {/* Ability */}
                  {selectedCard.ability && (() => {
                    const abilityDef = ABILITIES.find((a) => a.name === selectedCard.ability);
                    return (
                      <div className="text-xs bg-neutral-800/80 rounded px-2 py-1.5">
                        <span className="font-bold text-neutral-200">{selectedCard.ability}</span>
                        {abilityDef && (
                          <span className="text-neutral-500 ml-1">— {abilityDef.description}</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Drop rate + Total stats */}
                  <div className="flex items-center gap-4 text-xs text-neutral-600">
                    <span>
                      Drop: {(selectedCard.base_rarity_pct * selectedCard.background_multiplier).toFixed(4)}%
                    </span>
                    <span>
                      Total: {selectedCard.atk + selectedCard.def + selectedCard.hp} stats
                    </span>
                  </div>
                </div>

                {/* Navigation + Close */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCard(null);
                    }}
                    className="text-neutral-500 hover:text-white transition-colors text-lg leading-none p-1"
                  >
                    &times;
                  </button>
                  <div className="flex flex-col gap-0.5 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateCard('prev');
                      }}
                      disabled={selectedIdx <= 0}
                      className="w-7 h-7 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 flex items-center justify-center text-xs transition-colors"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateCard('next');
                      }}
                      disabled={selectedIdx >= filteredCards.length - 1}
                      className="w-7 h-7 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 flex items-center justify-center text-xs transition-colors"
                    >
                      ▼
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-600 mt-1">
                    {selectedIdx + 1}/{filteredCards.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {selectedCard && (
        <div className="fixed bottom-1 left-1/2 -translate-x-1/2 z-30">
          <span className="text-[10px] text-neutral-700">
            ← → navigate &middot; Esc close
          </span>
        </div>
      )}
    </div>
  );
}
