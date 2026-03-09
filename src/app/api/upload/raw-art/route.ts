import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/upload/raw-art — Upload raw art for a card
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const cardId = formData.get('cardId') as string | null;
  const cardNumber = formData.get('cardNumber') as string | null;
  const shape = formData.get('shape') as string | null;
  const material = formData.get('material') as string | null;
  const background = formData.get('background') as string | null;

  if (!file || !cardId) {
    return NextResponse.json(
      { error: 'file and cardId are required' },
      { status: 400 }
    );
  }

  // Validate file type
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    return NextResponse.json(
      { error: 'Only PNG and JPEG files are allowed' },
      { status: 400 }
    );
  }

  // Max 20MB
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File size must be under 20MB' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Generate filename
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const fileName = `${String(cardNumber).padStart(3, '0')}_${shape}_${material}_${background}.${ext}`;
  const filePath = `raw-arts/${fileName}`;

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('raw-arts')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Update card record
  const { data, error: updateError } = await supabase
    .from('cards')
    .update({
      raw_art_path: filePath,
      gen_status: 'generated',
      generated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: `DB update failed: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    card: data,
    filePath,
  });
}
