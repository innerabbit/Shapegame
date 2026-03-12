import {
  createNoopSigner,
  generateSigner,
  publicKey,
  transactionBuilder,
  type TransactionBuilder,
  type Umi,
} from '@metaplex-foundation/umi';
import { create, fetchCollection } from '@metaplex-foundation/mpl-core';
import { COLLECTION_ADDRESS, METADATA_BASE_URL, CARDS_PER_TX } from './config';
import type { BoosterCard } from './pick-booster';

export interface MintTransactionResult {
  /** Base64-encoded partially signed transactions */
  transactions: string[];
  /** Mint addresses for each card (in order) */
  mintAddresses: string[];
}

/**
 * Build partially-signed mint transactions for a booster pack.
 * Splits into multiple transactions of CARDS_PER_TX each (3 per tx).
 * Server signs as collection authority + asset keypairs.
 * Client will sign as payer.
 */
export async function buildMintTransactions(
  umi: Umi,
  walletAddress: string,
  cards: BoosterCard[],
): Promise<MintTransactionResult> {
  if (!COLLECTION_ADDRESS) {
    throw new Error('NEXT_PUBLIC_COLLECTION_ADDRESS env var is required');
  }

  const collectionPk = publicKey(COLLECTION_ADDRESS);
  const collection = await fetchCollection(umi, collectionPk);
  const buyerSigner = createNoopSigner(publicKey(walletAddress));

  const mintAddresses: string[] = [];
  const transactions: string[] = [];

  // Split cards into chunks of CARDS_PER_TX
  for (let i = 0; i < cards.length; i += CARDS_PER_TX) {
    const chunk = cards.slice(i, i + CARDS_PER_TX);
    let builder = transactionBuilder();

    for (const card of chunk) {
      const asset = generateSigner(umi);
      mintAddresses.push(asset.publicKey.toString());

      builder = builder.add(
        create(umi, {
          asset,
          collection,
          authority: umi.identity,
          payer: buyerSigner,
          owner: publicKey(walletAddress),
          name: `Shape Card #${String(card.card_number).padStart(3, '0')}`,
          uri: `${METADATA_BASE_URL}/api/nft/metadata/${card.card_number}`,
        }),
      );
    }

    // Build with v0 transaction format and sign with server keypair
    const blockhash = await umi.rpc.getLatestBlockhash();
    const tx = await builder
      .setBlockhash(blockhash)
      .buildAndSign(umi);

    const serialized = umi.transactions.serialize(tx);
    const encoded = Buffer.from(serialized).toString('base64');
    transactions.push(encoded);
  }

  return { transactions, mintAddresses };
}
