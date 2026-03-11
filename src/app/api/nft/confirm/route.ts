import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Connection } from '@solana/web3.js';

/**
 * POST /api/nft/confirm
 * Called after client signs + sends the mint transactions.
 * Verifies the tx signatures on-chain and updates nft_mints records.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { packId, txSignatures } = body as {
    packId: string;
    txSignatures: string[];
  };

  if (!packId || !txSignatures?.length) {
    return NextResponse.json({ error: 'Missing packId or txSignatures' }, { status: 400 });
  }

  const admin = createAdminClient();
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  // Verify each transaction on-chain
  const confirmedSigs: string[] = [];
  for (const sig of txSignatures) {
    try {
      const status = await connection.getSignatureStatus(sig);
      if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
        confirmedSigs.push(sig);
      }
    } catch {
      // Ignore — will count as unconfirmed
    }
  }

  // Update nft_mints records with tx signatures
  const { data: mints } = await admin
    .from('nft_mints')
    .select('id, mint_address')
    .eq('pack_id', packId)
    .order('minted_at');

  if (mints && confirmedSigs.length > 0) {
    // Assign tx signatures to mints (3 mints per tx)
    for (let i = 0; i < mints.length; i++) {
      const txIndex = Math.floor(i / 3);
      const sig = confirmedSigs[txIndex] || '';
      if (sig) {
        await admin
          .from('nft_mints')
          .update({ tx_signature: sig })
          .eq('id', mints[i].id);
      }
    }
  }

  return NextResponse.json({
    confirmed: confirmedSigs.length,
    total: txSignatures.length,
    packId,
  });
}
