import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { createServerSupabase } from '@/lib/supabase/server';

/**
 * POST /api/nft/send-tx
 * Accepts a signed transaction (base64) and sends it via the server's RPC.
 * This avoids exposing the paid RPC URL to the client.
 * Requires authentication to prevent abuse as an open RPC proxy.
 */
export async function POST(req: Request) {
  try {
    // Auth check — only authenticated users can use our RPC proxy
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { signedTx } = await req.json();

    if (!signedTx || typeof signedTx !== 'string') {
      return NextResponse.json({ error: 'Missing signedTx' }, { status: 400 });
    }

    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    const rawTx = Buffer.from(signedTx, 'base64');
    const sig = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    await connection.confirmTransaction(sig, 'confirmed');

    return NextResponse.json({ signature: sig });
  } catch (err: any) {
    console.error('[send-tx] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to send transaction' },
      { status: 500 },
    );
  }
}
