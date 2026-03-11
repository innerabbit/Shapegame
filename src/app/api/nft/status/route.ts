import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { MIN_BALANCE_LAMPORTS, MINT_COOLDOWN_MINUTES } from '@/lib/nft/config';

/**
 * GET /api/nft/status
 * Returns mint eligibility status for the authenticated user.
 * Shows balance, cooldown timer, and whether they can mint.
 */
export async function GET() {
  // 1. Auth check
  let walletAddress: string | null = null;
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminClient();
      const { data: appUser } = await admin
        .from('users')
        .select('wallet_address')
        .eq('supabase_auth_id', user.id)
        .single();
      walletAddress = appUser?.wallet_address ?? null;
    }
  } catch {
    // Not authenticated
  }

  if (!walletAddress) {
    return NextResponse.json({
      canMint: false,
      reason: 'not_authenticated',
      requiredBalance: MIN_BALANCE_LAMPORTS / LAMPORTS_PER_SOL,
      cooldownMinutes: MINT_COOLDOWN_MINUTES,
    });
  }

  // 2. Balance check
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  let currentBalance = 0;
  try {
    currentBalance = await connection.getBalance(new PublicKey(walletAddress));
  } catch {
    // RPC error — treat as 0 balance
  }

  const hasEnoughBalance = currentBalance >= MIN_BALANCE_LAMPORTS;

  // 3. Cooldown check
  const admin = createAdminClient();
  const { data: cooldown } = await admin
    .from('mint_cooldowns')
    .select('last_mint_at, total_mints')
    .eq('wallet_address', walletAddress)
    .single();

  let canMint = hasEnoughBalance;
  let nextMintAt: string | null = null;
  let secondsRemaining = 0;
  const totalMints = cooldown?.total_mints ?? 0;

  if (cooldown?.last_mint_at) {
    const lastMint = new Date(cooldown.last_mint_at);
    const cooldownEnd = new Date(lastMint.getTime() + MINT_COOLDOWN_MINUTES * 60 * 1000);
    const now = new Date();

    if (cooldownEnd > now) {
      canMint = false;
      nextMintAt = cooldownEnd.toISOString();
      secondsRemaining = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 1000);
    }
  }

  if (!hasEnoughBalance) {
    canMint = false;
  }

  return NextResponse.json({
    canMint,
    nextMintAt,
    secondsRemaining,
    requiredBalance: MIN_BALANCE_LAMPORTS / LAMPORTS_PER_SOL,
    currentBalance: currentBalance / LAMPORTS_PER_SOL,
    hasEnoughBalance,
    totalMints,
    cooldownMinutes: MINT_COOLDOWN_MINUTES,
    walletAddress,
  });
}
