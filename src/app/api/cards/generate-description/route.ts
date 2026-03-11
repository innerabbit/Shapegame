import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createAdminClient } from '@/lib/supabase/admin';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function buildDescriptionPrompt(card: any): string {
  const base = `You are an art director for a collectible card game set in Detroit, 1996. Everything is shot on VHS / disposable camera aesthetic — grainy, warm colors, harsh flash, lo-fi. The vibe is 90s hip-hop culture, street life, community.

Generate a vivid, cinematic visual description (2-3 sentences) for this card's artwork. The description should be specific enough for an AI image generator to create the art. Focus on composition, lighting, setting, and mood. Detroit '96 aesthetic is mandatory.

`;

  if (card.card_type === 'hero') {
    return base + `HERO CARD:
- Name: ${card.name}
- Class: ${card.hero_class} (${classContext(card.hero_class)})
- Color: ${card.color}
- Rarity: ${card.rarity_tier}
- ATK: ${card.atk}, HP: ${card.hp}
- Perk 1: ${card.perk_1_name || 'none'} — ${card.perk_1_desc || ''}
${card.perk_2_name ? `- Perk 2: ${card.perk_2_name} — ${card.perk_2_desc}` : ''}

Describe this character in a Detroit '96 scene. Include their appearance, clothing, pose, and environment. The character's power level should be reflected in the scene scale — ${card.rarity_tier === 'legendary' ? 'EPIC, larger-than-life composition' : card.rarity_tier === 'epic' ? 'dramatic, powerful presence' : 'everyday street scene'}.`;
  }

  if (card.card_type === 'land') {
    return base + `LAND CARD (Mana Source):
- Name: ${card.name}
- Color: ${card.color} (${colorContext(card.color)})
- Shape: ${card.shape}
- Material: ${card.material}
- Rarity: ${card.rarity_tier}

Describe a Detroit '96 location that embodies the ${card.color} mana color. The ${card.shape} shape in ${card.material} material should be subtly integrated into the scene — maybe as graffiti, an object, architecture detail, or held by someone. Material quality reflects rarity: ${materialContext(card.material)}.`;
  }

  if (card.card_type === 'artifact') {
    return base + `ARTIFACT CARD (Weapon/Equipment):
- Name: ${card.name}
- Type: ${card.artifact_subtype}
- Rarity: ${card.rarity_tier}
- Effect: ${card.ability}

Describe this item in a Detroit '96 context. Show the ${card.name} as if photographed on a table, in someone's hands, or in use on the street. The item's power should match its rarity: ${card.rarity_tier === 'legendary' ? 'mythical, almost glowing' : card.rarity_tier === 'epic' ? 'impressive, clearly valuable' : 'street-level, gritty'}.`;
  }

  return base + `Card: ${card.name} (${card.card_type}). Describe a scene for this card in Detroit 1996 VHS aesthetic.`;
}

function classContext(cls: string): string {
  const map: Record<string, string> = {
    preacher: 'church leaders, gospel, faith community',
    hacker: 'tech underground, computer labs, dial-up era',
    gangster: 'street hustle, corner boys, trap houses',
    artist: 'hip-hop, graffiti, open mics, DJ battles',
    athlete: 'basketball courts, boxing gyms, track meets',
  };
  return map[cls] || cls;
}

function colorContext(color: string): string {
  const map: Record<string, string> = {
    yellow: 'faith, order, churches, gospel',
    blue: 'technology, control, computer labs',
    black: 'street power, hustle, nighttime',
    red: 'art, chaos, creativity, performance',
    green: 'sport, nature, physical force',
    white: 'artifacts, neutral, equipment',
  };
  return map[color] || color;
}

function materialContext(material: string): string {
  const map: Record<string, string> = {
    flat: 'cheap looking, cardboard cutout, lo-fi',
    gradient: 'slightly better, textured, print quality',
    '3d': 'solid, glossy, catches the flash light',
    chrome: 'shiny metallic, mirror reflections, premium',
    gold: 'luxurious golden gleam, heavy, rare treasure',
  };
  return map[material] || material;
}

export async function POST(request: NextRequest) {
  const { cardIds, forceRegenerate } = await request.json();

  if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
    return NextResponse.json({ error: 'cardIds array required' }, { status: 400 });
  }

  if (cardIds.length > 50) {
    return NextResponse.json({ error: 'Max 50 cards per request' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch cards
  const { data: cards, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .in('id', cardIds);

  if (fetchError || !cards) {
    return NextResponse.json({ error: fetchError?.message || 'Cards not found' }, { status: 404 });
  }

  const results: { cardId: string; name: string; description?: string; error?: string }[] = [];

  for (const card of cards) {
    // Skip if already has description and not forcing
    if (card.art_description && !forceRegenerate) {
      results.push({ cardId: card.id, name: card.name, description: card.art_description });
      continue;
    }

    try {
      const prompt = buildDescriptionPrompt(card);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
      });

      const description = response.text?.trim();

      if (!description) {
        results.push({ cardId: card.id, name: card.name, error: 'Empty response from Gemini' });
        continue;
      }

      // Save to DB
      const { error: updateError } = await supabase
        .from('cards')
        .update({ art_description: description })
        .eq('id', card.id);

      if (updateError) {
        results.push({ cardId: card.id, name: card.name, error: updateError.message });
      } else {
        results.push({ cardId: card.id, name: card.name, description });
      }
    } catch (err: any) {
      results.push({ cardId: card.id, name: card.name, error: err.message || 'Generation failed' });
    }
  }

  return NextResponse.json({
    processed: results.length,
    success: results.filter(r => r.description && !r.error).length,
    failed: results.filter(r => r.error).length,
    results,
  });
}
