import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH /api/cards/[id]/status — Update card generation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { gen_status } = body;

  if (!gen_status) {
    return NextResponse.json({ error: 'gen_status is required' }, { status: 400 });
  }

  const validStatuses = [
    'not_started', 'generating', 'generated',
    'approved', 'rejected', 'compositing', 'finalized',
  ];

  if (!validStatuses.includes(gen_status)) {
    return NextResponse.json({ error: 'Invalid gen_status' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Build update object with appropriate timestamp
  const update: Record<string, unknown> = { gen_status };

  if (gen_status === 'generated') update.generated_at = new Date().toISOString();
  if (gen_status === 'approved') update.approved_at = new Date().toISOString();
  if (gen_status === 'finalized') update.finalized_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('cards')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
