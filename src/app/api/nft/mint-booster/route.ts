import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getUmi } from '@/lib/nft/umi';
import { pickBoosterPack } from '@/lib/nft/pick-booster';
import { buildMintTransactions } from '@/lib/nft/build-mint-tx';
import { MIN_BALANCE_LAMPORTS, MINT_COOLDOWN_MINUTES } from '@/lib/nft/config';
import { randomUUID } from 'crypto';

export const maxDuration = 30; // Vercel function timeout

/**
 * POST /api/nft/mint-booster
 * 1. Verify auth + wallet
 * 2. Check SOL balance
 * 3. Atomic cooldown claim (prevents race condition)
 * 4. Pick 6 random cards (secure RNG, weighted rarity)
 * 5. Build 2 partially-signed transactions (3 mints each)
 * 6. Return serialized transactions for client to sign + send
 */
export async function POST() {
  const admin = createAdminClient();

  // 1. Auth
  let walletAddress: string | null = null;
  let userId: string | null = null;
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: appUser } = await admin
        .from('users')
        .select('id, wallet_address')
        .eq('supabase_auth_id', user.id)
        .single();
      walletAddress = appUser?.wallet_address ?? null;
      userId = appUser?.id ?? null;
    }
  } catch {
    // Not authenticated
  }

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
  }

  // 2. Balance check
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  let balance = 0;
  try {
    balance = await connection.getBalance(new PublicKey(walletAddress));
  } catch {
    return NextResponse.json({ error: 'Failed to check balance' }, { status: 503 });
  }

  if (balance < MIN_BALANCE_LAMPORTS) {
    return NextResponse.json({
      error: `Insufficient balance. Need ${MIN_BALANCE_LAMPORTS / LAMPORTS_PER_SOL} SOL, have ${balance / LAMPORTS_PER_SOL} SOL`,
    }, { status: 403 });
  }

  // 3. Atomic cooldown claim (prevents race condition)
  const { data: canMint, error: cooldownError } = await admin.rpc('try_claim_mint', {
    p_wallet: walletAddress,
    p_cooldown_minutes: MINT_COOLDOWN_MINUTES,
  });

  if (cooldownError) {
    console.warn('[nft/mint] Cooldown RPC error:', cooldownError.message);
    return NextResponse.json({ error: 'Cooldown check failed' }, { status: 500 });
  }

  if (!canMint) {
    // Get remaining cooldown time
    const { data: cd } = await admin
      .from('mint_cooldowns')
      .select('last_mint_at')
      .eq('wallet_address', walletAddress)
      .single();

    const lastMint = cd?.last_mint_at ? new Date(cd.last_mint_at) : new Date();
    const nextMintAt = new Date(lastMint.getTime() + MINT_COOLDOWN_MINUTES * 60 * 1000);

    return NextResponse.json({
      error: 'Cooldown active',
      nextMintAt: nextMintAt.toISOString(),
      secondsRemaining: Math.ceil((nextMintAt.getTime() - Date.now()) / 1000),
    }, { status: 429 });
  }

  // 4. Pick 6 cards
  const { data: allCards, error: cardsError } = await admin
    .from('cards')
    .select('*')
    .order('card_number');

  if (cardsError || !allCards || allCards.length < 6) {
    return NextResponse.json({ error: 'No cards available' }, { status: 500 });
  }

  const pack = pickBoosterPack(allCards);

  // 5. Build mint transactions
  const umi = getUmi();
  let result;
  try {
    result = await buildMintTransactions(umi, walletAddress, pack);
  } catch (err: any) {
    console.error('[nft/mint] Build tx error:', err);
    return NextResponse.json({ error: 'Failed to build mint transaction' }, { status: 500 });
  }

  // 6. Save pack info to DB (before user signs — we'll confirm after)
  const packId = randomUUID();
  const mintRows = pack.map((card, i) => ({
    user_id: userId,
    card_id: card.id,
    mint_address: result.mintAddresses[i],
    tx_signature: '', // Will be updated after confirmation
    pack_id: packId,
  }));

  await admin.from('nft_mints').insert(mintRows);

  // Also save to user_cards (existing system)
  if (userId) {
    const userCardRows = pack.map((card) => ({
      user_id: userId,
      card_id: card.id,
      source: 'nft_booster',
      pack_id: packId,
      opened_at: new Date().toISOString(),
    }));
    await admin.from('user_cards').insert(userCardRows);
  }

  // Calculate next mint time
  const nextMintAt = new Date(Date.now() + MINT_COOLDOWN_MINUTES * 60 * 1000);

  return NextResponse.json({
    transactions: result.transactions,
    mintAddresses: result.mintAddresses,
    cards: pack,
    packId,
    nextMintAt: nextMintAt.toISOString(),
  });
}
