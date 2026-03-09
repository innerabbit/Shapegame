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
      className={`xp-button flex items-center gap-[6px] px-3 py-[2px] text-[11px] ${
        connected ? 'xp-button-primary' : ''
      }`}
    >
      {connecting ? (
        <span>Connecting...</span>
      ) : connected ? (
        <>
          <span style={{ color: '#22a846', fontSize: 8 }}>&#9679;</span>
          <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{address}</span>
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
