import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'raw-arts';
const FILE = '_prompts.json';

// Ensure bucket exists (creates if missing)
async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, { public: false });
  }
}

// ── GET /api/prompts ────────────────────────────────
// Load saved prompts from Supabase Storage

export async function GET() {
  const supabase = createAdminClient();

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(FILE);

    if (error || !data) {
      // File doesn't exist yet — return empty
      return NextResponse.json({ prompts: null });
    }

    const text = await data.text();
    const prompts = JSON.parse(text);
    return NextResponse.json({ prompts });
  } catch {
    return NextResponse.json({ prompts: null });
  }
}

// ── POST /api/prompts ───────────────────────────────
// Save prompts to Supabase Storage as JSON

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { style, shape, scene, sceneTiers } = body;

  if (!style && !shape && !scene && !sceneTiers) {
    return NextResponse.json(
      { error: 'At least one prompt field required' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Ensure bucket exists before uploading
  await ensureBucket(supabase);

  const payload = JSON.stringify({ style, shape, scene, sceneTiers }, null, 2);
  const buffer = Buffer.from(payload, 'utf-8');

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(FILE, buffer, {
      contentType: 'application/json',
      upsert: true,
    });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to save prompts', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
