import {
  publicKey,
  transactionBuilder,
  type Umi,
} from '@metaplex-foundation/umi';
import { mintV2, findLeafAssetIdPda, parseLeafFromMintV2Transaction } from '@metaplex-foundation/mpl-bubblegum';
import { COLLECTION_ADDRESS, MERKLE_TREE_ADDRESS, METADATA_BASE_URL } from './config';
import type { BoosterCard } from './pick-booster';
import bs58 from 'bs58';

export interface MintResult {
  /** cNFT asset IDs (derived from leaf schema) */
  assetIds: string[];
  /** Transaction signatures */
  signatures: string[];
}

/**
 * Mint compressed NFTs (cNFTs) via Bubblegum V2.
 * Server fully signs and sends — no client signing needed.
 * Mints all cards in a single transaction.
 */
export async function mintCompressedCards(
  umi: Umi,
  walletAddress: string,
  cards: BoosterCard[],
): Promise<MintResult> {
  if (!COLLECTION_ADDRESS) {
    throw new Error('NEXT_PUBLIC_COLLECTION_ADDRESS env var is required');
  }
  if (!MERKLE_TREE_ADDRESS) {
    throw new Error('MERKLE_TREE_ADDRESS env var is required');
  }

  const collectionPk = publicKey(COLLECTION_ADDRESS);
  const merkleTreePk = publicKey(MERKLE_TREE_ADDRESS);
  const leafOwner = publicKey(walletAddress);

  // Build a single transaction with all card mints
  let builder = transactionBuilder();

  for (const card of cards) {
    builder = builder.add(
      mintV2(umi, {
        merkleTree: merkleTreePk,
        leafOwner,
        coreCollection: collectionPk,
        metadata: {
          name: `Shape Card #${String(card.card_number).padStart(3, '0')}`,
          uri: `${METADATA_BASE_URL}/api/nft/metadata/${card.card_number}`,
          sellerFeeBasisPoints: 500, // 5% royalties
          creators: [
            {
              address: umi.identity.publicKey,
              verified: true,
              share: 100,
            },
          ],
          collection: collectionPk,
        },
      }),
    );
  }

  // Server fully signs and sends
  const result = await builder.sendAndConfirm(umi);
  const signature = bs58.encode(result.signature);

  // Derive asset IDs from the Merkle tree leaf indices
  // We need to fetch the tree config to know the current leaf count
  const assetIds: string[] = [];

  try {
    const leaf = await parseLeafFromMintV2Transaction(umi, result.signature);
    // parseLeafFromMintV2Transaction returns the first leaf in the tx
    const firstNonce = Number(leaf.nonce);
    for (let i = 0; i < cards.length; i++) {
      const [assetId] = findLeafAssetIdPda(umi, {
        merkleTree: merkleTreePk,
        leafIndex: firstNonce + i,
      });
      assetIds.push(assetId.toString());
    }
  } catch (err) {
    console.warn('[mint] Could not parse leaf from tx, using signature as reference:', err);
    // Fallback: use signature + index as identifier
    for (let i = 0; i < cards.length; i++) {
      assetIds.push(`${signature}:${i}`);
    }
  }

  return {
    assetIds,
    signatures: [signature],
  };
}
