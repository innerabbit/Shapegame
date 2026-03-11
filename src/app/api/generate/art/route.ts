import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createAdminClient } from '@/lib/supabase/admin';

// ── POST /api/generate/art ──────────────────────────────
// Generate card art via Gemini and optionally save to Supabase Storage

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  const { cardId, prompt, cardData, testOnly } = await request.json();

  if (!prompt) {
    return NextResponse.json(
      { error: 'prompt is required' },
      { status: 400 }
    );
  }

  // ── 1. Call Gemini API (always — this is the core) ──────
  let imageBase64: string;
  let mimeType: string;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '4:3' },
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

  // ── Test-only mode: return image without touching DB ────
  if (testOnly) {
    return NextResponse.json({
      success: true,
      testOnly: true,
      card: cardData ?? null,
      filePath: null,
      imageBase64: `data:${mimeType};base64,${imageBase64}`,
    });
  }

  // ── 2. Resolve card in DB ───────────────────────────────
  const supabase = createAdminClient();
  let card: Record<string, any>;

  if (cardId?.startsWith('local-') && cardData) {
    // Local card — insert into DB so we can save art
    const {
      id: _localId,
      created_at: _ca,
      updated_at: _ua,
      generated_at: _ga,
      approved_at: _aa,
      finalized_at: _fa,
      ...insertData
    } = cardData;

    const { data: created, error: createError } = await supabase
      .from('cards')
      .upsert(
        { ...insertData, gen_status: 'generating' },
        { onConflict: 'card_number' }
      )
      .select()
      .single();

    if (createError || !created) {
      return NextResponse.json(
        { error: `Failed to create card: ${createError?.message ?? 'unknown'}` },
        { status: 500 }
      );
    }
    card = created;
  } else if (cardId) {
    const { data: found, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (cardError || !found) {
      return NextResponse.json(
        { error: `Card not found: ${cardError?.message ?? 'unknown'}` },
        { status: 404 }
      );
    }
    card = found;
  } else {
    return NextResponse.json(
      { error: 'cardId or cardData is required' },
      { status: 400 }
    );
  }

  // ── 3. Upload to Supabase Storage ──────────────────────
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

  // ── 4. Update card in DB ───────────────────────────────
  const { data: updatedCard, error: updateError } = await supabase
    .from('cards')
    .update({
      raw_art_path: filePath,
      gen_status: 'generated',
      generated_at: new Date().toISOString(),
    })
    .eq('id', card.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: 'db_update_failed', details: updateError.message },
      { status: 500 }
    );
  }

  // ── 5. Return result with base64 preview ───────────────
  return NextResponse.json({
    success: true,
    card: updatedCard,
    filePath,
    imageBase64: `data:${mimeType};base64,${imageBase64}`,
  });
}
