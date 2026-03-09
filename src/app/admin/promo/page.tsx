'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateAllCards, type SeedCard } from '@/lib/cards/generate-seed';
import { CardPreview } from '@/components/admin/card-preview';
import {
  RARITY_LABELS,
  RARITY_COLORS,
  MANA_COLORS,
  BOOSTER_PACK,
} from '@/lib/constants';
import type { RarityTier } from '@/types/cards';

function weightedRandom(cards: SeedCard[]): SeedCard {
  const totalWeight = cards.reduce(
    (sum, c) => sum + c.base_rarity_pct * c.background_multiplier,
    0,
  );
  let roll = Math.random() * totalWeight;
  for (const card of cards) {
    roll -= card.base_rarity_pct * card.background_multiplier;
    if (roll <= 0) return card;
  }
  return cards[cards.length - 1];
}

function simulatePack(allCards: SeedCard[]): SeedCard[] {
  const packSize = BOOSTER_PACK.cardsPerPack;
  const pack: SeedCard[] = [];
  const used = new Set<number>();

  // Guarantee at least 1 rare+
  const rareOrBetter = allCards.filter(
    (c) => c.rarity_tier !== 'common',
  );
  if (rareOrBetter.length > 0) {
    const guaranteed = weightedRandom(rareOrBetter);
    pack.push(guaranteed);
    used.add(guaranteed.card_number);
  }

  // Fill rest
  while (pack.length < packSize) {
    const card = weightedRandom(allCards);
    if (!used.has(card.card_number)) {
      pack.push(card);
      used.add(card.card_number);
    }
  }

  // Sort by rarity (legendary first)
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  pack.sort(
    (a, b) =>
      (rarityOrder[a.rarity_tier] ?? 5) - (rarityOrder[b.rarity_tier] ?? 5),
  );

  return pack;
}

export default function PromoPage() {
  const [cards, setCards] = useState<SeedCard[]>([]);
  const [pack, setPack] = useState<SeedCard[]>([]);
  const [showcaseCards, setShowcaseCards] = useState<SeedCard[]>([]);

  useEffect(() => {
    const allCards = generateAllCards();
    setCards(allCards);

    // Pick 4 showcase cards — one of each rarity
    const showcase: SeedCard[] = [];
    for (const rarity of ['legendary', 'epic', 'rare', 'common'] as const) {
      const pool = allCards.filter((c) => c.rarity_tier === rarity);
      if (pool.length > 0) {
        showcase.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    setShowcaseCards(showcase);
  }, []);

  const openPack = () => {
    if (cards.length > 0) {
      setPack(simulatePack(cards));
    }
  };

  // Stats for pack analysis
  const packStats = useMemo(() => {
    if (pack.length === 0) return null;
    const rarities = pack.map((c) => c.rarity_tier);
    const bestRarity: RarityTier = rarities.includes('legendary')
      ? 'legendary'
      : rarities.includes('epic')
      ? 'epic'
      : rarities.includes('rare')
      ? 'rare'
      : 'common';
    const totalStats = pack.reduce((sum, c) => sum + c.atk + c.def + c.hp, 0);
    const totalDrop = pack.reduce(
      (sum, c) => sum + c.base_rarity_pct * c.background_multiplier,
      0,
    );
    return { bestRarity, totalStats, totalDrop };
  }, [pack]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stage 3: Promo & Preview</h2>
        <p className="text-neutral-400 text-sm mt-1">
          Preview card showcase, simulate pack openings, and prepare promo content
        </p>
      </div>

      {/* Featured Cards Showcase */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base">Featured Cards Showcase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-6 flex-wrap py-4">
            {showcaseCards.map((card) => (
              <div key={card.card_number} className="text-center space-y-2">
                <CardPreview card={card} size="md" />
                <div className="text-xs text-neutral-500">
                  #{String(card.card_number).padStart(3, '0')}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-neutral-800 border-neutral-700 text-xs"
              onClick={() => {
                const showcase: SeedCard[] = [];
                for (const rarity of ['legendary', 'epic', 'rare', 'common'] as const) {
                  const pool = cards.filter((c) => c.rarity_tier === rarity);
                  if (pool.length > 0) {
                    showcase.push(pool[Math.floor(Math.random() * pool.length)]);
                  }
                }
                setShowcaseCards(showcase);
              }}
            >
              Shuffle Showcase
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pack Simulator */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Booster Pack Simulator</CardTitle>
          <Button
            onClick={openPack}
            className="bg-amber-600 hover:bg-amber-700 text-black font-bold"
          >
            Open Pack ({BOOSTER_PACK.cardsPerPack} cards)
          </Button>
        </CardHeader>
        <CardContent>
          {pack.length > 0 ? (
            <div className="space-y-4">
              {/* Pack stats */}
              {packStats && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-neutral-400">Best pull:</span>
                  <Badge
                    variant="outline"
                    className={`${RARITY_COLORS[packStats.bestRarity].bg} ${RARITY_COLORS[packStats.bestRarity].text} ${RARITY_COLORS[packStats.bestRarity].border}`}
                  >
                    {RARITY_LABELS[packStats.bestRarity]}
                  </Badge>
                  <span className="text-neutral-500">|</span>
                  <span className="text-neutral-400">
                    Total stats: <span className="text-white font-mono">{packStats.totalStats}</span>
                  </span>
                  <span className="text-neutral-500">|</span>
                  <span className="text-neutral-400">
                    Combined drop: <span className="text-white font-mono">{packStats.totalDrop.toFixed(2)}%</span>
                  </span>
                </div>
              )}

              {/* Pack cards */}
              <div className="flex items-center justify-center gap-4 flex-wrap py-2">
                {pack.map((card, i) => (
                  <div key={`${card.card_number}-${i}`} className="text-center space-y-2">
                    <CardPreview card={card} size="sm" />
                    <div className="space-y-0.5">
                      <div className="text-xs text-neutral-500 capitalize">
                        {card.shape} &middot; {card.material}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-xs">
                        <span className="text-red-400">{card.atk}</span>
                        <span className="text-neutral-700">/</span>
                        <span className="text-blue-400">{card.def}</span>
                        <span className="text-neutral-700">/</span>
                        <span className="text-green-400">{card.hp}</span>
                        <span className="ml-1">{MANA_COLORS[card.mana_color].emoji}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <div className="text-4xl mb-3">🎴</div>
              <p>Click &ldquo;Open Pack&rdquo; to simulate a booster pack opening</p>
              <p className="text-xs mt-1 text-neutral-600">
                {BOOSTER_PACK.cardsPerPack} cards per pack &middot; Guaranteed 1 Rare or better
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drop Rate Analysis */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base">Drop Rate Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rarest cards */}
            <div>
              <h3 className="text-sm font-medium text-neutral-400 mb-3">Rarest Cards (Top 10)</h3>
              <div className="space-y-1.5">
                {cards
                  .slice()
                  .sort(
                    (a, b) =>
                      a.base_rarity_pct * a.background_multiplier -
                      b.base_rarity_pct * b.background_multiplier,
                  )
                  .slice(0, 10)
                  .map((card) => (
                    <div
                      key={card.card_number}
                      className="flex items-center justify-between text-sm bg-neutral-800/50 rounded px-2 py-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-neutral-500 text-xs">
                          #{String(card.card_number).padStart(3, '0')}
                        </span>
                        <span className="capitalize truncate">{card.shape}</span>
                        <span className="text-neutral-600 text-xs capitalize">{card.material}</span>
                        <Badge
                          variant="outline"
                          className={`${RARITY_COLORS[card.rarity_tier].bg} ${RARITY_COLORS[card.rarity_tier].text} ${RARITY_COLORS[card.rarity_tier].border} text-[10px] px-1 py-0`}
                        >
                          {RARITY_LABELS[card.rarity_tier]}
                        </Badge>
                      </div>
                      <span className="font-mono text-xs text-amber-400 shrink-0 ml-2">
                        {(card.base_rarity_pct * card.background_multiplier).toFixed(4)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Most common cards */}
            <div>
              <h3 className="text-sm font-medium text-neutral-400 mb-3">Most Common Cards (Top 10)</h3>
              <div className="space-y-1.5">
                {cards
                  .slice()
                  .sort(
                    (a, b) =>
                      b.base_rarity_pct * b.background_multiplier -
                      a.base_rarity_pct * a.background_multiplier,
                  )
                  .slice(0, 10)
                  .map((card) => (
                    <div
                      key={card.card_number}
                      className="flex items-center justify-between text-sm bg-neutral-800/50 rounded px-2 py-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-neutral-500 text-xs">
                          #{String(card.card_number).padStart(3, '0')}
                        </span>
                        <span className="capitalize truncate">{card.shape}</span>
                        <span className="text-neutral-600 text-xs capitalize">{card.material}</span>
                      </div>
                      <span className="font-mono text-xs text-neutral-400 shrink-0 ml-2">
                        {(card.base_rarity_pct * card.background_multiplier).toFixed(2)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Templates (placeholder for future) */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base">Export Templates</CardTitle>
        </CardHeader>
        <CardContent className="text-neutral-400 text-sm space-y-2">
          <p>Coming soon:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-500">
            <li>Card-in-hand mockups for social media</li>
            <li>Pack opening screenshot sequence</li>
            <li>Collection grid poster (9:16, 16:9, 1:1)</li>
            <li>VHS-style promo video stills</li>
            <li>Rarity comparison infographic</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
