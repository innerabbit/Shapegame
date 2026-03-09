// ========================================
// SHAPE_CARDS — Constants & Game Data
// ========================================

import type {
  ShapeType, MaterialType, BackgroundType,
  RarityTier, ManaColor, CardAbility
} from '@/types/cards';

// ── Shape definitions ──────────────────────────────────

export interface ShapeDefinition {
  shape: ShapeType;
  emoji: string;
  manaColor: ManaColor;
  category: 'basic' | 'advanced' | 'exotic';
  availableMaterials: MaterialType[];
}

export const SHAPES: ShapeDefinition[] = [
  // Basic (5) — all 4 materials
  { shape: 'circle',   emoji: '⚪', manaColor: 'blue',  category: 'basic',    availableMaterials: ['flat', '3d', 'chrome', 'gold'] },
  { shape: 'square',   emoji: '🟦', manaColor: 'white', category: 'basic',    availableMaterials: ['flat', '3d', 'chrome', 'gold'] },
  { shape: 'triangle', emoji: '🔺', manaColor: 'red',   category: 'basic',    availableMaterials: ['flat', '3d', 'chrome', 'gold'] },
  { shape: 'star',     emoji: '⭐', manaColor: 'red',   category: 'basic',    availableMaterials: ['flat', '3d', 'chrome', 'gold'] },
  { shape: 'hexagon',  emoji: '⬡',  manaColor: 'green', category: 'basic',    availableMaterials: ['flat', '3d', 'chrome', 'gold'] },

  // Advanced (3) — flat + 3d + chrome, no gold
  { shape: 'cube',     emoji: '🟧', manaColor: 'green', category: 'advanced', availableMaterials: ['flat', '3d', 'chrome'] },
  { shape: 'cylinder', emoji: '🟢', manaColor: 'green', category: 'advanced', availableMaterials: ['flat', '3d', 'chrome'] },
  { shape: 'pentagon', emoji: '⬟',  manaColor: 'white', category: 'advanced', availableMaterials: ['flat', '3d', 'chrome'] },

  // Exotic (5) — no flat, start from 3d or chrome
  { shape: 'diamond',  emoji: '💎', manaColor: 'gold',  category: 'exotic',   availableMaterials: ['3d', 'chrome', 'gold'] },
  { shape: 'torus',    emoji: '🍩', manaColor: 'blue',  category: 'exotic',   availableMaterials: ['3d', 'chrome', 'gold'] },
  { shape: 'heart',    emoji: '❤️', manaColor: 'gold',  category: 'exotic',   availableMaterials: ['3d', 'chrome', 'gold'] },
  { shape: 'pyramid',  emoji: '🔻', manaColor: 'red',   category: 'exotic',   availableMaterials: ['3d', 'chrome'] },
  { shape: 'knot',     emoji: '🪢', manaColor: 'blue',  category: 'exotic',   availableMaterials: ['chrome', 'gold'] },
];

// ── Material → Rarity mapping ──────────────────────────

export const MATERIAL_TO_RARITY: Record<MaterialType, RarityTier> = {
  flat: 'common',
  '3d': 'rare',
  chrome: 'epic',
  gold: 'legendary',
};

// ── Base rarity percentages ────────────────────────────

// Key: "shape_material" → base rarity %
export const BASE_RARITY_PCT: Record<string, number> = {
  // Basic shapes
  circle_flat: 12, circle_3d: 2, circle_chrome: 0.4, circle_gold: 0.08,
  square_flat: 12, square_3d: 2, square_chrome: 0.4, square_gold: 0.08,
  triangle_flat: 12, triangle_3d: 2, triangle_chrome: 0.4, triangle_gold: 0.08,
  star_flat: 5, star_3d: 1.5, star_chrome: 0.3, star_gold: 0.06,
  hexagon_flat: 5, hexagon_3d: 1.5, hexagon_chrome: 0.3, hexagon_gold: 0.06,

  // Advanced shapes
  cube_flat: 4, cube_3d: 1, cube_chrome: 0.2,
  cylinder_flat: 4, cylinder_3d: 1, cylinder_chrome: 0.2,
  pentagon_flat: 4, pentagon_3d: 1, pentagon_chrome: 0.2,

  // Exotic shapes
  diamond_3d: 1, diamond_chrome: 0.2, diamond_gold: 0.04,
  torus_3d: 0.8, torus_chrome: 0.15, torus_gold: 0.04,
  heart_3d: 0.8, heart_chrome: 0.15, heart_gold: 0.04,
  pyramid_3d: 0.5, pyramid_chrome: 0.1,
  knot_chrome: 0.08, knot_gold: 0.03,
};

// ── Background definitions ─────────────────────────────

export interface BackgroundDefinition {
  type: BackgroundType;
  label: string;
  multiplier: number;
  description: string;
}

export const BACKGROUNDS: BackgroundDefinition[] = [
  { type: 'solid_color', label: 'Solid Color',   multiplier: 1.0,  description: 'Однотонный фон, самый частый' },
  { type: 'abstract',    label: 'Abstract Scene', multiplier: 0.8,  description: 'Геометрические паттерны, шейп в среде' },
  { type: 'clothing',    label: 'Clothing',       multiplier: 0.5,  description: 'Фрагмент одежды/аксессуара с шейпом' },
  { type: 'people',      label: 'People + Shape', multiplier: 0.3,  description: 'Человек держит шейп в камеру' },
  { type: 'buildings',   label: 'Buildings',      multiplier: 0.15, description: 'Архитектура / инсталляция из шейпов' },
];

export const BACKGROUND_MULTIPLIERS: Record<BackgroundType, number> = {
  solid_color: 1.0,
  abstract: 0.8,
  clothing: 0.5,
  people: 0.3,
  buildings: 0.15,
};

// ── Rarity colors ──────────────────────────────────────

export const RARITY_COLORS: Record<RarityTier, { bg: string; text: string; border: string }> = {
  common:    { bg: 'bg-gray-100',    text: 'text-gray-700',    border: 'border-gray-300' },
  uncommon:  { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-400' },
  rare:      { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-400' },
  epic:      { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-400' },
  legendary: { bg: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-yellow-400' },
};

export const RARITY_LABELS: Record<RarityTier, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

// ── Mana colors ────────────────────────────────────────

export const MANA_COLORS: Record<ManaColor, { emoji: string; label: string; hex: string }> = {
  red:    { emoji: '🔴', label: 'Red',    hex: '#ef4444' },
  blue:   { emoji: '🔵', label: 'Blue',   hex: '#3b82f6' },
  green:  { emoji: '🟢', label: 'Green',  hex: '#22c55e' },
  white:  { emoji: '⚪', label: 'White',  hex: '#e5e7eb' },
  gold:   { emoji: '🟡', label: 'Gold',   hex: '#eab308' },
  chrome: { emoji: '🪞', label: 'Chrome', hex: '#94a3b8' },
};

// ── Abilities ──────────────────────────────────────────

export const ABILITIES: CardAbility[] = [
  { name: 'Burn',     description: '+2 урона цели напрямую',                manaColor: 'red',   minRarity: 'uncommon' },
  { name: 'Shield',   description: '+3 DEF на один ход',                    manaColor: 'white', minRarity: 'uncommon' },
  { name: 'Heal',     description: 'Восстановить 3 HP союзнику',            manaColor: 'white', minRarity: 'uncommon' },
  { name: 'Grow',     description: '+1 ATK / +1 HP перманентно',            manaColor: 'green', minRarity: 'rare' },
  { name: 'Counter',  description: 'Отменить способность противника',       manaColor: 'blue',  minRarity: 'rare' },
  { name: 'Drain',    description: 'Урон = лечение себе',                   manaColor: 'blue',  minRarity: 'epic' },
  { name: 'Combo',    description: 'Если на поле 2+ Gold карты: ×2 ATK',    manaColor: 'gold',  minRarity: 'epic' },
  { name: 'Overload', description: 'Удар по всем картам противника',        manaColor: 'red',   minRarity: 'legendary' },
];

// ── Generation Waves ───────────────────────────────────

export const WAVES = {
  1: { label: 'Wave 1 — Flat × Solid Color', description: '8 артов: все Flat шейпы на солид-фоне' },
  2: { label: 'Wave 2 — Flat × Other BGs', description: '32 арта: 8 Flat шейпов × 4 фона' },
  3: { label: 'Wave 3 — 3D × All BGs', description: '55 артов: 11 3D шейпов × 5 фонов' },
  4: { label: 'Wave 4 — Chrome + Gold × All BGs', description: '100 артов: Chrome (60) + Gold (40)' },
} as const;

// ── Gen Status labels ──────────────────────────────────

export const GEN_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'bg-gray-200 text-gray-700' },
  generating:  { label: 'Generating',  color: 'bg-yellow-200 text-yellow-800' },
  generated:   { label: 'Generated',   color: 'bg-blue-200 text-blue-800' },
  approved:    { label: 'Approved',    color: 'bg-green-200 text-green-800' },
  rejected:    { label: 'Rejected',    color: 'bg-red-200 text-red-800' },
  compositing: { label: 'Compositing', color: 'bg-purple-200 text-purple-800' },
  finalized:   { label: 'Finalized',   color: 'bg-emerald-200 text-emerald-800' },
};

// ── Stat ranges by rarity ──────────────────────────────

export const STAT_RANGES: Record<RarityTier, { totalMin: number; totalMax: number }> = {
  common:    { totalMin: 8,  totalMax: 12 },
  uncommon:  { totalMin: 10, totalMax: 15 },
  rare:      { totalMin: 13, totalMax: 18 },
  epic:      { totalMin: 17, totalMax: 23 },
  legendary: { totalMin: 20, totalMax: 28 },
};

// ── Card dimensions ────────────────────────────────────

export const CARD_SIZES = {
  full: { width: 2048, height: 2048 },
  thumb: { width: 512, height: 512 },
} as const;

// ── Booster pack ───────────────────────────────────────

export const BOOSTER_PACK = {
  cardsPerPack: 6,
  guaranteedRareOrBetter: 1,
  distribution: {
    common: 0.58,
    rare: 0.14,
    epic: 0.03,
    legendary: 0.005,
  },
} as const;
