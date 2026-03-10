import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createAdminClient } from '@/lib/supabase/admin';

// ── POST /api/generate/art ──────────────────────────────
// Generate card art via Gemini and save to Supabase Storage

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  const { cardId, prompt } = await request.json();

  if (!cardId || !prompt) {
    return NextResponse.json(
      { error: 'cardId and prompt are required' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // 1. Fetch card from DB
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single();

  if (cardError || !card) {
    return NextResponse.json(
      { error: `Card not found: ${cardError?.message ?? 'unknown'}` },
      { status: 404 }
    );
  }

  // 2. Call Gemini API
  let imageBase64: string;
  let mimeType: string;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '1:1' },
      },
    });

    // Extract image from response
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      return NextResponse.json(
        { error: 'no_image_in_response', details: 'Gemini returned no parts' },
        { status: 502 }
      );
    }

    const imagePart = parts.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData?.data) {
      // Check if response was blocked
      const textPart = parts.find((p: any) => p.text);
      return NextResponse.json(
        {
          error: 'no_image_in_response',
          details: textPart?.text ?? 'No image data in response',
        },
        { status: 502 }
      );
    }

    imageBase64 = imagePart.inlineData.data;
    mimeType = imagePart.inlineData.mimeType ?? 'image/png';
  } catch (err: any) {
    // Handle Gemini API errors
    const message = err?.message ?? String(err);

    if (message.includes('SAFETY') || message.includes('blocked')) {
      return NextResponse.json(
        { error: 'blocked_by_safety', details: message },
        { status: 422 }
      );
    }
    if (message.includes('429') || message.includes('RATE') || message.includes('quota')) {
      return NextResponse.json(
        { error: 'rate_limited', details: message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'gemini_error', details: message },
      { status: 502 }
    );
  }

  // 3. Upload to Supabase Storage
  const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
  const fileName = `${String(card.card_number).padStart(3, '0')}_${card.shape}_${card.material}_${card.background}.${ext}`;
  const filePath = `raw-arts/${fileName}`;

  const buffer = Buffer.from(imageBase64, 'base64');

  const { error: uploadError } = await supabase.storage
    .from('raw-arts')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true, // overwrite if re-generating
    });

  if (uploadError) {
    return NextResponse.json(
      { error: 'upload_failed', details: uploadError.message },
      { status: 500 }
    );
  }

  // 4. Update card in DB
  const { data: updatedCard, error: updateError } = await supabase
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
      { error: 'db_update_failed', details: updateError.message },
      { status: 500 }
    );
  }

  // 5. Return result with base64 preview
  return NextResponse.json({
    success: true,
    card: updatedCard,
    filePath,
    imageBase64: `data:${mimeType};base64,${imageBase64}`,
  });
}
