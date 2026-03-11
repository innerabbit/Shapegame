import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAllCardsV2 } from '@/lib/cards/seed-v2';

export async function POST() {
  const supabase = createAdminClient();

  // Check if v2 cards already exist
  const { count } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .not('card_type', 'is', null);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Already have ${count} v2 cards. Delete first if you want to reseed.` },
      { status: 409 }
    );
  }

  // Delete old v1 cards
  await supabase.from('user_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Generate all 125 cards
  const allCards = generateAllCardsV2();

  // Insert in batches of 25
  const batchSize = 25;
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < allCards.length; i += batchSize) {
    const batch = allCards.slice(i, i + batchSize).map(card => ({
      card_number: card.card_number,
      card_type: card.card_type,
      name: card.name,
      color: card.color,
      rarity_tier: card.rarity_tier,

      // Hero fields
      hero_class: card.hero_class || null,
      atk: card.atk ?? null,
      hp: card.hp ?? null,
      mana_cost: card.mana_cost ?? null,
      generic_cost: card.generic_cost ?? null,
      colored_cost: card.colored_cost ?? null,

      // Artifact fields
      artifact_subtype: card.artifact_subtype || null,

      // Land fields
      shape: card.shape || null,
      material: card.material || null,

      // Perks
      perk_1_name: card.perk_1_name || null,
      perk_1_type: card.perk_1_type || null,
      perk_1_desc: card.perk_1_desc || null,
      perk_2_name: card.perk_2_name || null,
      perk_2_type: card.perk_2_type || null,
      perk_2_desc: card.perk_2_desc || null,

      // Ability (artifact effect)
      ability: card.ability || null,

      // Pipeline defaults
      gen_status: 'not_started',
    }));

    const { error } = await supabase.from('cards').insert(batch);
    if (error) {
      errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  return NextResponse.json({
    inserted,
    total: allCards.length,
    errors: errors.length > 0 ? errors : undefined,
    breakdown: {
      lands: allCards.filter(c => c.card_type === 'land').length,
      heroes: allCards.filter(c => c.card_type === 'hero').length,
      artifacts: allCards.filter(c => c.card_type === 'artifact').length,
    },
  });
}
