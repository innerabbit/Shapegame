'use client';

import { forwardRef, useMemo } from 'react';
import { SplineCard, type SplineCardContent, type SplineCardHandle } from './spline-card';
import type { RarityTier, ManaColor, ShapeType, MaterialType, CardType } from '@/types/cards';
import { RARITY_LABELS } from '@/lib/constants';
import type { BackgroundType } from '@/types/cards';

// ── Types ──────────────────────────────────────────────────────

export interface CardData {
  // v2 fields (preferred)
  card_type?: CardType;
  name?: string | null;
  hero_class?: string | null;
  perk_1_desc?: string | null;
  color?: string | null;
  // Legacy fields (fallback)
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

// ── Helpers ─────────────────────────────────────────────────────

/** Build SplineCardContent from card data, preferring v2 fields */
export function cardToSplineContent(card: CardData): SplineCardContent {
  // v2 card: use name, perk desc, atk/hp
  if (card.card_type && card.name) {
    const typeLabel = card.card_type === 'hero'
      ? (card.hero_class || 'hero').toUpperCase()
      : card.card_type === 'land'
        ? (card.shape || 'land').toUpperCase()
        : 'ARTIFACT';

    return {
      title: card.name.toUpperCase(),
      description: card.perk_1_desc || card.ability || '',
      cardNumber: `#${String(card.card_number).padStart(3, '0')}`,
      rarity: RARITY_LABELS[card.rarity_tier].toUpperCase(),
      stats: card.card_type === 'hero' ? `${card.atk} / ${card.hp}` : '',
      manaCost: String(card.mana_cost ?? 0),
      material: typeLabel,
      artUrl: card.raw_art_path || undefined,
    };
  }

  // Legacy card: use shape/material/ability/def
  return {
    title: card.shape.toUpperCase(),
    description: card.ability || '',
    cardNumber: `#${String(card.card_number).padStart(3, '0')}`,
    rarity: RARITY_LABELS[card.rarity_tier].toUpperCase(),
    stats: `${card.atk} / ${card.def}`,
    manaCost: String(card.mana_cost),
    material: card.material.toUpperCase(),
    artUrl: card.raw_art_path || `/art-${card.shape}.png`,
  };
}

// ── Card Component ─────────────────────────────────────────────
// Pure 3D — no CSS flip. Spline scene handles its own back/front and flip animation.
// Parent calls ref.triggerFlip() to emit mouseDown event to Spline.

export const CardReveal = forwardRef<SplineCardHandle, CardRevealProps>(
  function CardReveal({ card, index, revealed, onClick }, ref) {
    // Memoize to prevent unnecessary re-fires of SplineCard's content effect
    const cardContent = useMemo<SplineCardContent>(() => cardToSplineContent(card), [card]);

    return (
      <div
        className="relative"
        style={{
          width: 'var(--card-w)',
          aspectRatio: '5 / 7',
          cursor: !revealed ? 'pointer' : 'default',
        }}
        onClick={!revealed ? onClick : undefined}
      >
        <SplineCard
          ref={ref}
          className="w-full h-full pointer-events-none"
          cardContent={cardContent}
          flipObjectName="Card"
        />
      </div>
    );
  }
);
