'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { useAuth } from '@/hooks/use-auth';
import { BoosterOverlay } from '@/components/booster/booster-overlay';

interface MintStatus {
  canMint: boolean;
  nextMintAt: string | null;
  secondsRemaining: number;
  requiredBalance: number;
  currentBalance: number;
  hasEnoughBalance: boolean;
  totalMints: number;
  cooldownMinutes: number;
  holdingPeriodMinutes: number;
  holdingComplete: boolean;
  holdingSecondsRemaining: number;
  holdingFirstSeenAt: string | null;
  walletAddress?: string;
  reason?: string;
}

type MintStage =
  | 'idle'
  | 'checking'
  | 'building'
  | 'signing_1'
  | 'signing_2'
  | 'confirming_1'
  | 'confirming_2'
  | 'saving'
  | 'done'
  | 'error'
  | 'partial';

export function MintContent() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const { isAuthenticated } = useAuth();

  const [status, setStatus] = useState<MintStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [holdingCountdown, setHoldingCountdown] = useState(0);
  const [stage, setStage] = useState<MintStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mintedCards, setMintedCards] = useState<any[] | null>(null);
  const [showBooster, setShowBooster] = useState(false);
  const [txSignatures, setTxSignatures] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch mint status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/nft/status');
      const data: MintStatus = await res.json();
      setStatus(data);
      setCountdown(data.secondsRemaining);
      setHoldingCountdown(data.holdingSecondsRemaining || 0);
    } catch {
      // Silently fail — will show as not authenticated
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll status when wallet is connected
  useEffect(() => {
    if (connected && isAuthenticated) {
      fetchStatus();
    } else {
      setLoading(false);
      setStatus(null);
    }
  }, [connected, isAuthenticated, fetchStatus]);

  // Countdown timer (cooldown + holding)
  useEffect(() => {
    const activeCountdown = countdown > 0 || holdingCountdown > 0;
    if (!activeCountdown) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      let shouldRefresh = false;
      if (countdown > 0) {
        setCountdown((prev) => {
          if (prev <= 1) { shouldRefresh = true; return 0; }
          return prev - 1;
        });
      }
      if (holdingCountdown > 0) {
        setHoldingCountdown((prev) => {
          if (prev <= 1) { shouldRefresh = true; return 0; }
          return prev - 1;
        });
      }
      if (shouldRefresh) fetchStatus();
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [countdown, holdingCountdown, fetchStatus]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Main mint flow
  const handleMint = async () => {
    if (!connected || !signTransaction || !publicKey) {
      setVisible(true);
      return;
    }

    setStage('building');
    setError(null);
    setMintedCards(null);
    setTxSignatures([]);

    try {
      // 1. Request mint from server
      const mintRes = await fetch('/api/nft/mint-booster', { method: 'POST' });
      const mintData = await mintRes.json();

      if (!mintRes.ok) {
        if (mintRes.status === 429) {
          setCountdown(mintData.secondsRemaining || 0);
          throw new Error(`Cooldown active. Wait ${formatTime(mintData.secondsRemaining || 0)}`);
        }
        throw new Error(mintData.error || 'Mint failed');
      }

      const { transactions, cards, packId, nextMintAt } = mintData;
      setMintedCards(cards);

      // 2. Sign & send transactions
      const sigs: string[] = [];
      for (let i = 0; i < transactions.length; i++) {
        setStage(i === 0 ? 'signing_1' : 'signing_2');

        // Deserialize the partially-signed tx
        const txBuffer = Buffer.from(transactions[i], 'base64');
        const tx = Transaction.from(txBuffer);

        // User signs
        const signedTx = await signTransaction(tx);

        setStage(i === 0 ? 'confirming_1' : 'confirming_2');

        // Send and confirm
        const rawTx = signedTx.serialize();
        const sig = await connection.sendRawTransaction(rawTx, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });

        await connection.confirmTransaction(sig, 'confirmed');
        sigs.push(sig);
        setTxSignatures([...sigs]);
      }

      // 3. Confirm with server
      setStage('saving');
      await fetch('/api/nft/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId, txSignatures: sigs }),
      });

      // 4. Update status
      if (nextMintAt) {
        const remaining = Math.ceil((new Date(nextMintAt).getTime() - Date.now()) / 1000);
        setCountdown(remaining);
        setStatus((prev) => prev ? {
          ...prev,
          canMint: false,
          nextMintAt,
          secondsRemaining: remaining,
          totalMints: prev.totalMints + 1,
        } : prev);
      }

      setStage('done');
      setShowBooster(true);
    } catch (err: any) {
      console.error('[mint] Error:', err);

      // Check if partial mint happened
      if (txSignatures.length > 0) {
        setStage('partial');
        setError(`Partial mint: ${txSignatures.length}/2 transactions succeeded. Your ${txSignatures.length * 3} cards are minted.`);
      } else {
        setStage('error');
        setError(err.message || 'Mint failed. Please try again.');
      }

      // Refresh status to get accurate cooldown
      fetchStatus();
    }
  };

  const isProcessing = !['idle', 'done', 'error', 'partial'].includes(stage);

  const stageLabels: Record<MintStage, string> = {
    idle: '',
    checking: 'Checking eligibility...',
    building: 'Building transactions...',
    signing_1: 'Sign transaction 1/2 in wallet...',
    signing_2: 'Sign transaction 2/2 in wallet...',
    confirming_1: 'Confirming transaction 1/2...',
    confirming_2: 'Confirming transaction 2/2...',
    saving: 'Saving mint records...',
    done: 'Minted successfully!',
    error: 'Mint failed',
    partial: 'Partially minted',
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <fieldset className="xp-groupbox">
          <legend className="xp-groupbox-legend">NFT Booster Pack</legend>
          <p className="text-[11px] text-[#444] mb-2">
            Mint 6 random NFT cards on Solana. Hold enough SOL to mint for free every {status?.cooldownMinutes ?? 30} minutes.
          </p>
          <div className="flex gap-3 text-[11px]">
            <div className="border border-[#c3c0b6] bg-white px-2 py-1">
              <span className="text-[#888]">Cards per pack:</span>{' '}
              <span className="font-bold">6</span>
            </div>
            <div className="border border-[#c3c0b6] bg-white px-2 py-1">
              <span className="text-[#888]">Cost:</span>{' '}
              <span className="font-bold text-[#22a846]">FREE</span>
            </div>
            <div className="border border-[#c3c0b6] bg-white px-2 py-1">
              <span className="text-[#888]">Network:</span>{' '}
              <span className="font-bold">Solana</span>
            </div>
          </div>
        </fieldset>

        {/* Status panel */}
        <fieldset className="xp-groupbox">
          <legend className="xp-groupbox-legend">Mint Status</legend>

          {!connected ? (
            <div className="text-center py-4">
              <p className="text-[11px] text-[#666] mb-3">Connect your Solana wallet to mint NFT boosters</p>
              <button
                onClick={() => setVisible(true)}
                className="xp-button xp-button-primary px-4 py-[4px] text-[12px]"
              >
                Connect Wallet
              </button>
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center py-4">
              <p className="text-[11px] text-[#666]">Sign in with your wallet to continue...</p>
            </div>
          ) : loading ? (
            <div className="text-center py-4">
              <p className="text-[11px] text-[#666]">Loading mint status...</p>
            </div>
          ) : status ? (
            <div className="space-y-3">
              {/* Balance */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#666]">Wallet Balance:</span>
                <span className={`font-bold ${status.hasEnoughBalance ? 'text-[#22a846]' : 'text-[#cc0000]'}`}>
                  {status.currentBalance.toFixed(4)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#666]">Required Balance:</span>
                <span className="font-bold">{status.requiredBalance} SOL</span>
              </div>

              {/* Holding period */}
              {holdingCountdown > 0 && (
                <div className="border border-[#c3c0b6] bg-[#f0f4ff] p-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#003c74]">Holding period:</span>
                    <span className="font-bold text-[#003c74] font-mono text-[14px]">
                      {formatTime(holdingCountdown)}
                    </span>
                  </div>
                  <div className="xp-progress mt-1 h-[8px]">
                    <div
                      className="h-full bg-[#003c74] transition-all duration-1000"
                      style={{
                        width: `${Math.max(0, 100 - (holdingCountdown / ((status?.holdingPeriodMinutes ?? 30) * 60)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#666] mt-1">
                    Hold {status?.requiredBalance ?? 0.01} SOL for {status?.holdingPeriodMinutes ?? 30} min to unlock minting
                  </p>
                </div>
              )}
              {status?.holdingComplete && !holdingCountdown && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#666]">Holding period:</span>
                  <span className="font-bold text-[#22a846]">Complete</span>
                </div>
              )}

              {/* Cooldown */}
              {countdown > 0 && (
                <div className="border border-[#c3c0b6] bg-[#fff8e8] p-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#996600]">Cooldown:</span>
                    <span className="font-bold text-[#996600] font-mono text-[14px]">
                      {formatTime(countdown)}
                    </span>
                  </div>
                  <div className="xp-progress mt-1 h-[8px]">
                    <div
                      className="h-full bg-[#eab308] transition-all duration-1000"
                      style={{
                        width: `${Math.max(0, 100 - (countdown / ((status?.cooldownMinutes ?? 30) * 60)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Total mints */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#666]">Total Packs Minted:</span>
                <span className="font-bold">{status.totalMints}</span>
              </div>

              {/* Balance warning */}
              {!status.hasEnoughBalance && (
                <div className="border border-[#cc0000] bg-[#fff0f0] p-2 text-[11px] text-[#cc0000]">
                  Insufficient SOL balance. You need at least {status.requiredBalance} SOL.
                </div>
              )}
            </div>
          ) : null}
        </fieldset>

        {/* Mint button & progress */}
        {connected && isAuthenticated && (
          <fieldset className="xp-groupbox">
            <legend className="xp-groupbox-legend">Mint</legend>
            <div className="space-y-3">
              {/* Progress indicator */}
              {isProcessing && (
                <div className="border border-[#003c74] bg-[#e8f0fe] p-2">
                  <p className="text-[11px] text-[#003c74] font-bold">{stageLabels[stage]}</p>
                  <div className="xp-progress mt-1 h-[8px]">
                    <div
                      className="h-full bg-[#003c74] transition-all duration-300"
                      style={{
                        width: `${
                          stage === 'building' ? 15 :
                          stage === 'signing_1' ? 30 :
                          stage === 'confirming_1' ? 45 :
                          stage === 'signing_2' ? 60 :
                          stage === 'confirming_2' ? 75 :
                          stage === 'saving' ? 90 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className={`border p-2 text-[11px] ${
                  stage === 'partial'
                    ? 'border-[#eab308] bg-[#fff8e8] text-[#996600]'
                    : 'border-[#cc0000] bg-[#fff0f0] text-[#cc0000]'
                }`}>
                  {error}
                </div>
              )}

              {/* Success */}
              {stage === 'done' && (
                <div className="border border-[#22a846] bg-[#f0fff0] p-2 text-[11px] text-[#006600]">
                  <p className="font-bold">6 NFT cards minted!</p>
                  {txSignatures.map((sig, i) => (
                    <a
                      key={sig}
                      href={`https://solscan.io/tx/${sig}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[#003399] underline mt-1"
                    >
                      TX {i + 1}: {sig.slice(0, 8)}...{sig.slice(-8)}
                    </a>
                  ))}
                </div>
              )}

              {/* Mint button */}
              <button
                onClick={handleMint}
                disabled={isProcessing || (status ? !status.canMint : true)}
                className={`xp-button w-full py-[6px] text-[12px] font-bold ${
                  status?.canMint && !isProcessing ? 'xp-button-primary' : ''
                }`}
              >
                {isProcessing
                  ? stageLabels[stage]
                  : status?.canMint
                  ? 'Mint NFT Booster (6 Cards)'
                  : holdingCountdown > 0
                  ? `Hold SOL: ${formatTime(holdingCountdown)}`
                  : countdown > 0
                  ? `Cooldown: ${formatTime(countdown)}`
                  : !status?.hasEnoughBalance
                  ? `Need ${status?.requiredBalance ?? 0.01} SOL`
                  : 'Mint NFT Booster (6 Cards)'
                }
              </button>

              {stage === 'done' && (
                <button
                  onClick={() => setShowBooster(true)}
                  className="xp-button w-full py-[4px] text-[11px]"
                >
                  View Cards
                </button>
              )}
            </div>
          </fieldset>
        )}
      </div>

      {/* Booster reveal overlay */}
      {showBooster && mintedCards && (
        <BoosterOverlay
          onClose={() => setShowBooster(false)}
          preloadedCards={mintedCards}
        />
      )}
    </>
  );
}
