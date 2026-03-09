'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useCallback, useMemo } from 'react';

export function WalletButton() {
  const { publicKey, disconnect, connecting, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const address = useMemo(() => {
    if (!publicKey) return null;
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  const handleClick = useCallback(() => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  }, [connected, disconnect, setVisible]);

  return (
    <button
      onClick={handleClick}
      disabled={connecting}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium
        transition-all border
        ${connected
          ? 'bg-green-900/40 border-green-700 text-green-300 hover:bg-green-900/60'
          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
        }
        disabled:opacity-50
      `}
    >
      {connecting ? (
        <span className="animate-pulse">Connecting...</span>
      ) : connected ? (
        <>
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="font-mono text-xs">{address}</span>
        </>
      ) : (
        <>
          <span>👛</span>
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}
