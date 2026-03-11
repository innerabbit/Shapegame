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
  gradient: 'uncommon',
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

// ========================================
// V2 — Card System Constants
// ========================================

import type {
  CardColor, HeroClass, ArtifactSubtype, PerkType, Perk,
} from '@/types/cards';

// ── Card Colors (v2) ──────────────────────────────────

export const CARD_COLORS: Record<CardColor, { emoji: string; label: string; hex: string; archetype: string; role: string }> = {
  yellow: { emoji: '🟡', label: 'Yellow', hex: '#eab308', archetype: 'Faith / Order', role: 'Защита, хил, баффы' },
  blue:   { emoji: '🔵', label: 'Blue',   hex: '#3b82f6', archetype: 'Tech / Control', role: 'Контроль, манипуляция' },
  black:  { emoji: '⚫', label: 'Black',  hex: '#1f2937', archetype: 'Street / Power', role: 'Урон, жертвы, дебаффы' },
  red:    { emoji: '🔴', label: 'Red',    hex: '#ef4444', archetype: 'Art / Chaos', role: 'Агрессия, AoE, хаос' },
  green:  { emoji: '🟢', label: 'Green',  hex: '#22c55e', archetype: 'Sport / Force', role: 'Большие статы, рост' },
  white:  { emoji: '⚪', label: 'White',  hex: '#e5e7eb', archetype: 'Artifacts / Weapons', role: 'Бесцветное оружие и снаряжение' },
};

// ── Hero Classes ──────────────────────────────────────

export const HERO_CLASSES: Record<HeroClass, { color: CardColor; label: string; description: string }> = {
  preacher:  { color: 'yellow', label: 'Preachers', description: 'Пасторы, проповедники, церковные лидеры' },
  hacker:    { color: 'blue',   label: 'Hackers',   description: 'Хакеры, инженеры, техно-гики' },
  gangster:  { color: 'black',  label: 'Gangsters', description: 'Гангстеры, дилеры, стрелки' },
  artist:    { color: 'red',    label: 'Artists',   description: 'Рэперы, граффитисты, диджеи, MC' },
  athlete:   { color: 'green',  label: 'Athletes',  description: 'Баскетболисты, боксёры, бегуны' },
};

// ── Land Shapes (v2 — 5 only) ─────────────────────────

export const LAND_SHAPES: { shape: string; emoji: string }[] = [
  { shape: 'circle',   emoji: '⚪' },
  { shape: 'hexagon',  emoji: '⬡' },
  { shape: 'diamond',  emoji: '💎' },
  { shape: 'star',     emoji: '⭐' },
  { shape: 'triangle', emoji: '🔺' },
];

// ── Land Materials → Rarity ───────────────────────────

export const LAND_MATERIALS: { material: string; rarity: RarityTier; label: string; dropRate: number }[] = [
  { material: 'flat',     rarity: 'common',    label: 'Flat (2D)',          dropRate: 50 },
  { material: 'gradient', rarity: 'uncommon',  label: 'Gradient / Textured', dropRate: 25 },
  { material: '3d',       rarity: 'rare',      label: '3D Rendered',        dropRate: 15 },
  { material: 'chrome',   rarity: 'epic',      label: 'Chrome',             dropRate: 7 },
  { material: 'gold',     rarity: 'legendary', label: 'Gold',               dropRate: 3 },
];

// ── Dual Land Color Pairs ─────────────────────────────

export const DUAL_LAND_PAIRS: [CardColor, CardColor][] = [
  ['yellow', 'blue'],
  ['black', 'red'],
  ['green', 'yellow'],
  ['blue', 'black'],
  ['red', 'green'],
];

// ── All 41 Perks ──────────────────────────────────────

export interface PerkDef {
  name: string;
  type: PerkType;
  description: string;
  color: CardColor;
}

export const ALL_PERKS: PerkDef[] = [
  // Yellow — Preachers
  { name: 'Sermon',       type: 'trigger',  description: 'При входе: +1 HP всем союзникам', color: 'yellow' },
  { name: 'Blessing',     type: 'passive',  description: 'Союзники рядом получают +1 HP', color: 'yellow' },
  { name: 'Choir Shield', type: 'trigger',  description: 'При входе: даёт щит 2 одному союзнику', color: 'yellow' },
  { name: 'Resurrection', type: 'trigger',  description: 'При смерти: возвращает 1 Common союзника из кладбища', color: 'yellow' },
  { name: 'Congregation', type: 'passive',  description: 'Если 3+ Yellow героя на поле — все получают +0/+1', color: 'yellow' },
  { name: 'Forgiveness',  type: 'trigger',  description: 'Снимает дебафф с одного союзника', color: 'yellow' },
  { name: 'Sunday Peace', type: 'trigger',  description: 'Запрещает атаку одного врага на 1 ход', color: 'yellow' },
  { name: 'Gospel',       type: 'passive',  description: '+1 ATK если у тебя больше HP чем у противника', color: 'yellow' },

  // Blue — Hackers
  { name: 'Intercept',  type: 'trigger',  description: 'При входе: отменяет перк одного вражеского героя на 1 ход', color: 'blue' },
  { name: 'Firewall',   type: 'passive',  description: 'Не может быть целью перков противника', color: 'blue' },
  { name: 'Data Steal', type: 'trigger',  description: 'При входе: вытягиваешь 1 доп. карту', color: 'blue' },
  { name: 'Overclock',  type: 'trigger',  description: 'При входе: даёт +2 ATK одному союзнику до конца хода', color: 'blue' },
  { name: 'Backdoor',   type: 'passive',  description: 'Может атаковать напрямую, игнорируя одного защитника', color: 'blue' },
  { name: 'Virus',      type: 'trigger',  description: 'При входе: -1 ATK случайному врагу', color: 'blue' },
  { name: 'Reboot',     type: 'trigger',  description: 'Возвращает одного героя (своего или чужого) в руку. +2 маны если враг', color: 'blue' },
  { name: 'Network',    type: 'passive',  description: 'Если 2+ Blue союзника на поле — тяни 1 доп. карту в начале хода', color: 'blue' },

  // Black — Gangsters
  { name: 'Drive-By',     type: 'trigger',  description: 'При входе: наносит 2 урона случайному врагу', color: 'black' },
  { name: 'Intimidate',   type: 'passive',  description: 'Враги с ATK меньше не могут блокировать', color: 'black' },
  { name: 'Blood Money',  type: 'trigger',  description: 'Убей своего союзника — получи +2 маны любого цвета', color: 'black' },
  { name: 'Double Tap',   type: 'passive',  description: 'Наносит базовый ATK дважды', color: 'black' },
  { name: 'Shakedown',    type: 'trigger',  description: 'При входе: противник сбрасывает 1 карту (1 раз за ход)', color: 'black' },
  { name: 'Bulletproof',  type: 'passive',  description: 'Первый полученный урон за ход игнорируется', color: 'black' },
  { name: 'Snitch',       type: 'trigger',  description: 'При смерти: наносит 1 урон всем врагам', color: 'black' },
  { name: 'Kingpin',      type: 'passive',  description: '+1 ATK за каждого мёртвого героя, max +3', color: 'black' },

  // Red — Artists
  { name: 'Freestyle',   type: 'trigger',  description: 'При входе: наносит 1 урон каждому врагу', color: 'red' },
  { name: 'Hype',        type: 'passive',  description: '+2 ATK в ход когда сыграл 2+ карты', color: 'red' },
  { name: 'Mixtape',     type: 'trigger',  description: 'При входе: вытяни 2 карты, сбрось 1', color: 'red' },
  { name: 'Tag',         type: 'trigger',  description: 'При входе: помечает врага — +1 урон от всех источников', color: 'red' },
  { name: 'Encore',      type: 'trigger',  description: 'При смерти: возвращается в руку (1 раз за игру)', color: 'red' },
  { name: 'Beat Drop',   type: 'trigger',  description: 'При входе: все герои (свои и чужие) получают 1 урон', color: 'red' },
  { name: 'Flow State',  type: 'passive',  description: 'Haste — может атаковать в ход выхода', color: 'red' },
  { name: 'Cypher',      type: 'passive',  description: 'Если есть другой Red союзник — оба +1 ATK', color: 'red' },
  { name: 'Diss Track',  type: 'trigger',  description: 'При входе: 2 урона напрямую игроку', color: 'red' },

  // Green — Athletes
  { name: 'Slam Dunk',   type: 'trigger',  description: 'При входе: урон = своему ATK одному врагу', color: 'green' },
  { name: 'Endurance',   type: 'passive',  description: '+1 HP в начале каждого хода', color: 'green' },
  { name: 'Coach',       type: 'passive',  description: 'Все Green союзники получают +1/+0', color: 'green' },
  { name: 'Sprint',      type: 'trigger',  description: 'При входе: получает +2 ATK до конца хода', color: 'green' },
  { name: 'Iron Jaw',    type: 'passive',  description: 'Получает максимум 3 урона за удар', color: 'green' },
  { name: 'Teamwork',    type: 'passive',  description: '+1/+1 если на поле 2+ Green героя', color: 'green' },
  { name: 'Second Wind', type: 'trigger',  description: 'При падении до 1 HP: полностью восстанавливает здоровье (1 раз)', color: 'green' },
  { name: 'MVP',         type: 'passive',  description: 'Если единственный герой на поле — +3/+3. Отключается навсегда при появлении второго', color: 'green' },
];

// ── Artifacts (10) ────────────────────────────────────

export interface ArtifactDef {
  name: string;
  subtype: ArtifactSubtype;
  rarity: RarityTier;
  effect: string;
  genericCost: number;
}

export const ARTIFACTS: ArtifactDef[] = [
  { name: 'Switchblade',  subtype: 'equipment',   rarity: 'common',    effect: '+1 ATK экипированному герою', genericCost: 1 },
  { name: 'Bandana',      subtype: 'equipment',   rarity: 'common',    effect: '+1 HP экипированному герою', genericCost: 1 },
  { name: 'Glock',        subtype: 'consumable',  rarity: 'uncommon',  effect: 'При входе: 2 урона случайному вражескому герою', genericCost: 2 },
  { name: 'Boombox',      subtype: 'equipment',   rarity: 'uncommon',  effect: 'Все союзники +0/+1 пока на поле', genericCost: 2 },
  { name: 'Kevlar Vest',  subtype: 'equipment',   rarity: 'rare',      effect: 'Экипированный герой: входящий урон -1 (min 1)', genericCost: 3 },
  { name: 'Chains',       subtype: 'consumable',  rarity: 'rare',      effect: 'При входе: один враг не атакует 1 ход', genericCost: 3 },
  { name: 'Molotov',      subtype: 'consumable',  rarity: 'epic',      effect: 'При входе: 2 урона всем вражеским героям', genericCost: 4 },
  { name: 'Gold Chain',   subtype: 'equipment',   rarity: 'epic',      effect: 'В начале хода: +1 мана любого цвета', genericCost: 4 },
  { name: 'Sawed-Off',    subtype: 'equipment',   rarity: 'legendary', effect: 'Экипированный герой наносит базовый ATK дважды', genericCost: 5 },
  { name: 'Crown',        subtype: 'equipment',   rarity: 'legendary', effect: '+2/+2, не может быть целью перков противника', genericCost: 5 },
];

// ── Hero stat ranges by rarity (ATK + HP only, no DEF) ──

export const HERO_STAT_RANGES: Record<RarityTier, { atkMin: number; atkMax: number; hpMin: number; hpMax: number; perks: number }> = {
  common:    { atkMin: 1, atkMax: 2, hpMin: 1, hpMax: 3, perks: 1 },
  uncommon:  { atkMin: 2, atkMax: 3, hpMin: 2, hpMax: 4, perks: 1 },
  rare:      { atkMin: 3, atkMax: 4, hpMin: 3, hpMax: 5, perks: 2 },
  epic:      { atkMin: 4, atkMax: 5, hpMin: 4, hpMax: 6, perks: 2 },
  legendary: { atkMin: 5, atkMax: 6, hpMin: 5, hpMax: 7, perks: 2 },
};

// ── Hero mana costs by rarity ─────────────────────────

export const HERO_MANA_COSTS: Record<RarityTier, { generic: number; colored: number }> = {
  common:    { generic: 0, colored: 1 },
  uncommon:  { generic: 1, colored: 1 },
  rare:      { generic: 1, colored: 2 },
  epic:      { generic: 2, colored: 2 },
  legendary: { generic: 2, colored: 3 },
};
