// NFT minting configuration
// All values configurable via env, with sensible defaults for devnet testing

/** Metaplex Core Collection mint address */
export const COLLECTION_ADDRESS = process.env.NEXT_PUBLIC_COLLECTION_ADDRESS || '';

/** Minimum SOL balance required to mint (lamports) */
export const MIN_BALANCE_LAMPORTS = Number(process.env.MIN_MINT_BALANCE_LAMPORTS || 10_000_000); // 0.01 SOL

/** Cooldown between mints in minutes */
export const MINT_COOLDOWN_MINUTES = Number(process.env.MINT_COOLDOWN_MINUTES || 30);

/** Base URL for metadata endpoint */
export const METADATA_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://theshapegame.app';

/** Cards per booster pack */
export const CARDS_PER_PACK = 6;

/** Cards per transaction (limited by Solana tx size) */
export const CARDS_PER_TX = 3;
