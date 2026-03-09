import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/cards — List all cards with optional filters
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  let query = supabase.from('cards').select('*');

  // Apply filters
  const wave = searchParams.get('wave');
  if (wave) query = query.eq('wave', Number(wave));

  const status = searchParams.get('status');
  if (status) query = query.eq('gen_status', status);

  const rarity = searchParams.get('rarity');
  if (rarity) query = query.eq('rarity_tier', rarity);

  const material = searchParams.get('material');
  if (material) query = query.eq('material', material);

  const shape = searchParams.get('shape');
  if (shape) query = query.eq('shape', shape);

  const background = searchParams.get('background');
  if (background) query = query.eq('background', background);

  // Order
  query = query.order('card_number', { ascending: true });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
