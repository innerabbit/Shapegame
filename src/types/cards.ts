// ========================================
// SHAPE_CARDS — Core Types
// ========================================

export type ShapeType =
  | 'circle' | 'square' | 'triangle' | 'star' | 'hexagon'
  | 'cube' | 'cylinder' | 'pentagon'
  | 'diamond' | 'torus' | 'heart' | 'pyramid' | 'knot';

export type MaterialType = 'flat' | '3d' | 'chrome' | 'gold';

export type BackgroundType = 'solid_color' | 'abstract' | 'clothing' | 'people' | 'buildings';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ManaColor = 'red' | 'blue' | 'green' | 'white' | 'gold' | 'chrome';

export type GenStatus =
  | 'not_started' | 'generating' | 'generated'
  | 'approved' | 'rejected'
  | 'compositing' | 'finalized';

export type AbilityName =
  | 'Burn' | 'Shield' | 'Heal' | 'Grow'
  | 'Counter' | 'Drain' | 'Combo' | 'Overload';

export interface CardAbility {
  name: AbilityName;
  description: string;
  manaColor: ManaColor;
  minRarity: RarityTier;
}

export interface Card {
  id: string;
  card_number: number;

  // Identity
  shape: ShapeType;
  material: MaterialType;
  background: BackgroundType;
  mana_color: ManaColor;
  rarity_tier: RarityTier;

  // Stats
  atk: number;
  def: number;
  hp: number;
  mana_cost: number;

  // Ability
  ability: string | null;

  // Rarity math
  base_rarity_pct: number;
  background_multiplier: number;
  final_rarity_pct: number;

  // Pipeline
  wave: number;
  gen_status: GenStatus;

  // Art paths
  raw_art_path: string | null;
  processed_card_path: string | null;
  thumb_path: string | null;
  promo_path: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  generated_at: string | null;
  approved_at: string | null;
  finalized_at: string | null;
}

// Subset for display in tables
export interface CardRow {
  id: string;
  card_number: number;
  shape: ShapeType;
  material: MaterialType;
  background: BackgroundType;
  mana_color: ManaColor;
  rarity_tier: RarityTier;
  wave: number;
  gen_status: GenStatus;
  thumb_path: string | null;
  raw_art_path: string | null;
  atk: number;
  def: number;
  hp: number;
  mana_cost: number;
  ability: string | null;
  final_rarity_pct: number;
}
