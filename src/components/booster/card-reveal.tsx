'use client';

import { forwardRef, useMemo } from 'react';
import { SplineCard, type SplineCardContent, type SplineCardHandle } from './spline-card';
import type { RarityTier, ManaColor, ShapeType, MaterialType } from '@/types/cards';
import { RARITY_LABELS } from '@/lib/constants';
import type { BackgroundType } from '@/types/cards';

// ── Types ──────────────────────────────────────────────────────

export interface CardData {
  shape: ShapeType;
  material: MaterialType;
  background: BackgroundType;
  mana_color: ManaColor;
  rarity_tier: RarityTier;
  atk: number;
  def: number;
  hp: number;
  mana_cost: number;
  ability: string | null;
  card_number: number;
  raw_art_path?: string | null;
}

interface CardRevealProps {
  card: CardData;
  index: number;
  revealed: boolean;
  onClick?: () => void;
}

// ── Card Component ─────────────────────────────────────────────
// Pure 3D — no CSS flip. Spline scene handles its own back/front and flip animation.
// Parent calls ref.triggerFlip() to emit mouseDown event to Spline.

export const CardReveal = forwardRef<SplineCardHandle, CardRevealProps>(
  function CardReveal({ card, index, revealed, onClick }, ref) {
    // Memoize to prevent unnecessary re-fires of SplineCard's content effect
    const cardContent = useMemo<SplineCardContent>(() => ({
      title: card.shape.toUpperCase(),
      description: card.ability || '',
      cardNumber: `#${String(card.card_number).padStart(3, '0')}`,
      rarity: RARITY_LABELS[card.rarity_tier].toUpperCase(),
      stats: `${card.atk} / ${card.def}`,
      manaCost: String(card.mana_cost),
      material: card.material.toUpperCase(),
      artUrl: card.raw_art_path || `/art-${card.shape}.png`,
    }), [card]);

    return (
      <div
        className="relative"
        style={{
          width: 180,
          height: 260,
          cursor: !revealed ? 'pointer' : 'default',
        }}
      >
        <SplineCard
          ref={ref}
          className="w-full h-full"
          cardContent={cardContent}
          onClick={!revealed ? onClick : undefined}
          flipObjectName="Card"
        />
      </div>
    );
  }
);
