import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { createSignerFromKeypair, signerIdentity, type Umi } from '@metaplex-foundation/umi';
import bs58 from 'bs58';

let _umi: Umi | null = null;

/**
 * Server-side Umi singleton.
 * Uses MINT_AUTHORITY_SECRET_KEY as the identity (collection authority).
 * RPC endpoint configured via SOLANA_RPC_URL env var.
 */
export function getUmi(): Umi {
  if (_umi) return _umi;

  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const secretKey = process.env.MINT_AUTHORITY_SECRET_KEY;

  if (!secretKey) {
    throw new Error('MINT_AUTHORITY_SECRET_KEY env var is required');
  }

  const umi = createUmi(rpcUrl, 'confirmed').use(mplTokenMetadata()).use(mplBubblegum());

  const secretKeyBytes = bs58.decode(secretKey);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKeyBytes);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));

  _umi = umi;
  return umi;
}
