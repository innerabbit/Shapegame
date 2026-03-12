'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWindowManager } from '@/lib/stores/window-manager';
import { useUserCards } from '@/hooks/use-user-cards';
import { CollectionCard } from '@/components/collection/collection-card';

export function CollectionContent() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const openWindow = useWindowManager((s) => s.openWindow);
  const { ownedCards, isLoading } = useUserCards();

  const collectionAddress = process.env.NEXT_PUBLIC_COLLECTION_ADDRESS;

  // Not connected
  if (!connected) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="text-5xl mb-4">🃏</div>
        <h2 className="text-[14px] font-bold text-[#003399] mb-2">Your Card Collection</h2>
        <p className="text-[11px] text-[#666] max-w-sm mb-4">
          Connect your Solana wallet to view your cards.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="xp-button xp-button-primary px-6 py-[5px] text-[12px] font-bold"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-[11px] text-[#666]">Loading cards...</span>
      </div>
    );
  }

  // No cards
  if (ownedCards.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="text-5xl mb-4">📦</div>
        <h2 className="text-[14px] font-bold text-[#003399] mb-2">No Cards Yet</h2>
        <p className="text-[11px] text-[#666] max-w-sm mb-4">
          Open a booster pack to start your collection!
        </p>
        <button
          onClick={() => openWindow('shop')}
          className="xp-button xp-button-primary px-6 py-[5px] text-[12px] font-bold"
        >
          Visit Shop
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header stats */}
      <div className="flex items-center justify-between mb-3 text-[11px]">
        <span className="text-[#222] font-bold">
          {ownedCards.length} {ownedCards.length === 1 ? 'card' : 'cards'}
        </span>
        {collectionAddress && (
          <div className="flex items-center gap-3">
            <a
              href={`https://magiceden.io/marketplace/${collectionAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#003399] hover:underline flex items-center gap-1"
            >
              <img src="/me-icon.png" alt="" className="w-3.5 h-3.5" />
              Magic Eden
            </a>
            <a
              href={`https://solscan.io/account/${collectionAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#003399] hover:underline flex items-center gap-1"
            >
              <img src="/solscan-icon.png" alt="" className="w-3.5 h-3.5" />
              Solscan
            </a>
          </div>
        )}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {ownedCards.map((uc) => (
          <CollectionCard
            key={uc.id}
            card={uc.cards}
          />
        ))}
      </div>
    </div>
  );
}
