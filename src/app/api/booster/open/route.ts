import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';
import type { RarityTier } from '@/types/cards';
import { randomUUID } from 'crypto';

// ── Weighted rarity pick ────────────────────────────────

const RARITY_ORDER: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_WEIGHTS: Record<RarityTier, number> = {
  common: 55,
  uncommon: 25,
  rare: 12,
  epic: 6,
  legendary: 2,
};

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ── Pick 6 cards with rarity distribution ───────────────

function pickBoosterPack(pool: any[]): any[] {
  const byRarity: Record<RarityTier, any[]> = {
    common: [], uncommon: [], rare: [], epic: [], legendary: [],
  };
  for (const c of pool) {
    const tier = c.rarity_tier as RarityTier;
    if (byRarity[tier]) byRarity[tier].push(c);
  }

  const pack: any[] = [];
  const usedIds = new Set<string>();

  // Guaranteed: at least 1 rare or better
  const rarePool = [...byRarity.rare, ...byRarity.epic, ...byRarity.legendary];
  if (rarePool.length > 0) {
    const guaranteed = rarePool[Math.floor(Math.random() * rarePool.length)];
    pack.push(guaranteed);
    usedIds.add(guaranteed.id || guaranteed.card_number);
  }

  // Fill remaining slots
  while (pack.length < 6) {
    const rarity = weightedPick(RARITY_ORDER, RARITY_ORDER.map(r => RARITY_WEIGHTS[r]));
    const candidates = byRarity[rarity].filter(
      c => !usedIds.has(c.id || c.card_number)
    );

    if (candidates.length === 0) continue;

    const card = candidates[Math.floor(Math.random() * candidates.length)];
    pack.push(card);
    usedIds.add(card.id || card.card_number);
  }

  // Sort: commons first, legendaries last
  pack.sort((a, b) =>
    RARITY_ORDER.indexOf(a.rarity_tier) - RARITY_ORDER.indexOf(b.rarity_tier)
  );

  return pack;
}

// ── POST /api/booster/open ──────────────────────────────

export async function POST() {
  const admin = createAdminClient();

  // Check if user is authenticated
  let userId: string | null = null;
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Look up app user
      const { data: appUser } = await admin
        .from('users')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .single();
      userId = appUser?.id ?? null;
    }
  } catch {
    // Not authenticated — continue without saving
  }

  // Try 1: Fetch approved/finalized cards with art
  const { data: readyCards } = await admin
    .from('cards')
    .select('*')
    .in('gen_status', ['approved', 'finalized'])
    .not('raw_art_path', 'is', null);

  let pack: any[];
  let source: string;

  if (readyCards && readyCards.length >= 6) {
    pack = pickBoosterPack(readyCards);
    source = 'approved';
  } else {
    // Try 2: Fallback — use ALL cards in DB
    const { data: allCards, error } = await admin
      .from('cards')
      .select('*')
      .order('card_number');

    if (error || !allCards || allCards.length === 0) {
      return NextResponse.json(
        { error: 'No cards in database. Run seed first.' },
        { status: 500 }
      );
    }

    pack = pickBoosterPack(allCards);
    source = 'all_cards';
  }

  // Save cards to user_cards if authenticated
  let saved = false;
  if (userId) {
    const packId = randomUUID();
    const rows = pack.map((card) => ({
      user_id: userId,
      card_id: card.id,
      source: 'booster',
      pack_id: packId,
      opened_at: new Date().toISOString(),
    }));

    const { error: insertError } = await admin
      .from('user_cards')
      .insert(rows);

    if (!insertError) {
      saved = true;
    }
  }

  return NextResponse.json({ cards: pack, source, saved, userId });
}
