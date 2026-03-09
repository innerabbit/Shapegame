'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { XpWindow } from '@/components/xp';
import { generateBoosterPack } from '@/lib/cards/generate-pack';
import type { BoosterStage, PackCard } from '@/components/three/booster-scene';
import type { RarityTier } from '@/types/cards';
import { MANA_COLORS, RARITY_LABELS } from '@/lib/constants';

type PackType = 'booster' | 'display';

const PACKS = {
  booster: {
    name: 'Booster Pack',
    icon: '\u{1F4E6}',
    cards: 6,
    price: 0.05,
    description: '6 random cards. Guaranteed 1 Rare or better.',
    features: ['6 cards per pack', '1 guaranteed Rare+', 'Chance for Legendary'],
  },
  display: {
    name: 'Display Box',
    icon: '\u{1F381}',
    cards: 36,
    price: 0.25,
    description: '6 booster packs (36 cards). Better value, more chances.',
    features: ['6 packs (36 cards)', '6 guaranteed Rare+', 'Bonus foil card', 'Best value'],
  },
} as const;

const RARITY_HEX: Record<RarityTier, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#eab308',
};

// ── Card reveal popup ───────────────────────────────────────────

function CardRevealInfo({ card }: { card: PackCard | null }) {
  if (!card) return null;
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="xp-window p-0" style={{ minWidth: 260 }}>
        <div className="xp-title-bar" style={{ background: RARITY_HEX[card.rarity_tier] }}>
          <div className="flex items-center gap-[6px]">
            <span className="text-sm">{MANA_COLORS[card.mana_color].emoji}</span>
            <span className="xp-title-text uppercase tracking-wider">{card.shape}</span>
          </div>
          <span className="xp-title-text text-[10px]">#{card.card_number}</span>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5"
              style={{ color: RARITY_HEX[card.rarity_tier], border: `1px solid ${RARITY_HEX[card.rarity_tier]}` }}>
              {RARITY_LABELS[card.rarity_tier]}
            </span>
            <span className="text-[#666] text-[10px] uppercase tracking-wider">{card.material}</span>
          </div>
          <div className="flex justify-center gap-3 text-[11px]">
            <span className="text-[#c00]">ATK {card.atk}</span>
            <span className="text-[#36c]">DEF {card.def}</span>
            <span className="text-[#060]">HP {card.hp}</span>
            <span className="text-[#c90]">MANA {card.mana_cost}</span>
          </div>
          {card.ability && <div className="mt-1.5 text-[#639] text-[10px]">{card.ability}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Stage hint ──────────────────────────────────────────────────

function StageHint({ stage, revealedCount, total }: { stage: BoosterStage; revealedCount: number; total: number }) {
  const hints: Record<BoosterStage, string> = {
    idle: 'Click the booster pack to open',
    opening: 'Opening...',
    revealing: `Click to reveal card ${revealedCount + 1} of ${total}`,
    showcase: 'Your cards!',
    done: '',
  };
  if (!hints[stage]) return null;
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60]">
      <div className="xp-window p-0">
        <div className="px-4 py-1.5 text-[11px] text-[#222]">{hints[stage]}</div>
      </div>
    </div>
  );
}

// ── Pack summary ────────────────────────────────────────────────

function PackSummary({ cards, onNewPack, onClose }: { cards: PackCard[]; onNewPack: () => void; onClose: () => void }) {
  const bestCard = cards.reduce((best, c) => {
    const order: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    return order.indexOf(c.rarity_tier) > order.indexOf(best.rarity_tier) ? c : best;
  }, cards[0]);

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/20 animate-in fade-in duration-700">
      <div className="xp-window" style={{ maxWidth: 380, width: '90%' }}>
        <div className="xp-title-bar">
          <div className="flex items-center gap-[6px]">
            <span className="text-sm">🎴</span>
            <span className="xp-title-text">Pack Opened!</span>
          </div>
          <button className="xp-btn-close" aria-label="Close" onClick={onClose}>
            <svg width="8" height="8" viewBox="0 0 8 8"><path d="M0 0L8 8M8 0L0 8" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
        </div>
        <div className="xp-body p-4">
          <p className="text-[11px] text-[#666] text-center mb-3">{cards.length} cards revealed</p>
          <div className="border p-3 mb-3 text-center" style={{ borderColor: RARITY_HEX[bestCard.rarity_tier] }}>
            <div className="text-[10px] text-[#888] uppercase tracking-wider mb-1">Best Pull</div>
            <div className="text-xl mb-0.5">{MANA_COLORS[bestCard.mana_color].emoji}</div>
            <div className="text-[13px] font-bold uppercase">{bestCard.shape}</div>
            <div className="text-[11px] font-bold uppercase" style={{ color: RARITY_HEX[bestCard.rarity_tier] }}>
              {RARITY_LABELS[bestCard.rarity_tier]} {bestCard.material}
            </div>
          </div>
          <div className="space-y-1 mb-4">
            {cards.map((c, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1" style={{ background: i % 2 === 0 ? '#f0f0f0' : 'transparent' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{MANA_COLORS[c.mana_color].emoji}</span>
                  <span className="text-[11px] capitalize">{c.shape}</span>
                  <span className="text-[10px] text-[#888] capitalize">{c.material}</span>
                </div>
                <span className="text-[10px] font-bold uppercase" style={{ color: RARITY_HEX[c.rarity_tier] }}>{c.rarity_tier}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onNewPack} className="xp-button flex-1 text-center">Open Another</button>
            <button onClick={onClose} className="xp-button flex-1 text-center">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Booster Overlay (inline on shop page) ────────────────────────

function BoosterOverlay({ onClose }: { onClose: () => void }) {
  const [SceneComponent, setSceneComponent] = useState<React.ComponentType<any> | null>(null);
  const [packCards, setPackCards] = useState<PackCard[]>(() => generateBoosterPack());
  const [stage, setStage] = useState<BoosterStage>('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [lastRevealed, setLastRevealed] = useState<PackCard | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    import('@/components/three/booster-scene')
      .then(mod => setSceneComponent(() => mod.BoosterScene))
      .catch(err => console.error('Failed to load 3D scene:', err));
  }, []);

  const handleStageChange = useCallback((newStage: BoosterStage) => {
    setStage(newStage);
    if (newStage === 'showcase') setLastRevealed(null);
  }, []);

  const handleCardReveal = useCallback((card: PackCard, index: number) => {
    setLastRevealed(card);
    setRevealedCount(index + 1);
  }, []);

  const handleNewPack = useCallback(() => {
    setPackCards(generateBoosterPack());
    setStage('idle');
    setRevealedCount(0);
    setLastRevealed(null);
    setShowSummary(false);
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div className="w-full h-full">
        {SceneComponent ? (
          <SceneComponent
            cards={packCards}
            onStageChange={handleStageChange}
            onCardReveal={handleCardReveal}
            onComplete={() => setShowSummary(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="xp-window p-0">
              <div className="px-6 py-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#316ac5] border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] text-[#666]">Loading 3D...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <StageHint stage={stage} revealedCount={revealedCount} total={packCards.length} />
      {stage === 'revealing' && lastRevealed && <CardRevealInfo card={lastRevealed} />}
      {showSummary && <PackSummary cards={packCards} onNewPack={handleNewPack} onClose={onClose} />}

      {!showSummary && (
        <button onClick={onClose} className="absolute top-4 right-4 z-[60] xp-button px-3 py-1 text-[11px]">
          Close
        </button>
      )}
    </div>
  );
}

// ── Main Shop Page ──────────────────────────────────────────────

export default function ShopPage() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [selectedPack, setSelectedPack] = useState<PackType>('booster');
  const [quantity, setQuantity] = useState(1);
  const [showBooster, setShowBooster] = useState(false);

  const pack = PACKS[selectedPack];
  const total = pack.price * quantity;

  const handleBuy = () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    // Open booster overlay
    setShowBooster(true);
  };

  // Also allow testing without wallet
  const handleTestOpen = () => setShowBooster(true);

  return (
    <>
      <div className="space-y-4">
        <XpWindow title="SHAPE_CARDS Shop" icon="\u{1F6D2}">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left — pack selection */}
            <div className="flex-1">
              <fieldset className="xp-groupbox">
                <legend className="xp-groupbox-legend">Select Pack Type</legend>
                <div className="space-y-2">
                  {(Object.entries(PACKS) as [PackType, typeof PACKS[PackType]][]).map(
                    ([key, p]) => {
                      const isSelected = selectedPack === key;
                      return (
                        <label
                          key={key}
                          className={`flex items-start gap-3 p-3 border cursor-pointer ${
                            isSelected
                              ? 'border-[#003c74] bg-[#e8f0fe]'
                              : 'border-[#c3c0b6] bg-white hover:bg-[#f5f3ee]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="pack"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedPack(key);
                              setQuantity(1);
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{p.icon}</span>
                              <span className="text-[12px] font-bold text-[#222]">{p.name}</span>
                              {key === 'display' && (
                                <span className="text-[9px] bg-[#eab308] text-black px-1.5 py-[1px] font-bold">
                                  BEST VALUE
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#666] mt-1">{p.description}</p>
                            <div className="mt-2 space-y-0.5">
                              {p.features.map((f) => (
                                <div key={f} className="text-[11px] text-[#444] flex items-center gap-1">
                                  <span className="text-[#22a846]">&#10003;</span>
                                  {f}
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-[14px] font-bold text-[#003399]">
                              {p.price} SOL
                            </div>
                          </div>
                        </label>
                      );
                    },
                  )}
                </div>
              </fieldset>
            </div>

            {/* Right — purchase */}
            <div className="lg:w-64">
              <fieldset className="xp-groupbox">
                <legend className="xp-groupbox-legend">Purchase</legend>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-[#222] block mb-1">Quantity:</label>
                    <div className="flex items-center gap-1">
                      <button className="xp-button px-2 py-0" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                      <input type="text" readOnly value={quantity} className="xp-input w-12 text-center" />
                      <button className="xp-button px-2 py-0" onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
                    </div>
                  </div>

                  <div className="border border-[#c3c0b6] bg-[#f5f3ee] p-2 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#666]">{quantity}x {pack.name}</span>
                      <span className="font-bold">{total.toFixed(2)} SOL</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#666]">Cards total</span>
                      <span className="font-bold">{pack.cards * quantity}</span>
                    </div>
                    <div className="border-t border-[#c3c0b6] pt-1 flex justify-between text-[12px]">
                      <span className="font-bold text-[#222]">Total:</span>
                      <span className="font-bold text-[#003399]">{total.toFixed(2)} SOL</span>
                    </div>
                  </div>

                  <button
                    onClick={handleBuy}
                    className={`xp-button w-full py-[5px] text-[12px] font-bold ${connected ? 'xp-button-primary' : ''}`}
                  >
                    {connected
                      ? `\u{1F6D2} Buy for ${total.toFixed(2)} SOL`
                      : '\u{1F45B} Connect Wallet to Buy'
                    }
                  </button>

                  {/* Test button — always available */}
                  <button
                    onClick={handleTestOpen}
                    className="xp-button w-full py-[5px] text-[12px] text-[#666]"
                  >
                    📦 Test Open Pack
                  </button>

                  {!connected && (
                    <p className="text-[10px] text-[#888] text-center">
                      You need a Solana wallet (Phantom, Solflare)
                    </p>
                  )}
                </div>
              </fieldset>
            </div>
          </div>
        </XpWindow>

        {/* Drop rates window */}
        <XpWindow title="Drop Rate Information" icon="\u{1F4CA}">
          <fieldset className="xp-groupbox">
            <legend className="xp-groupbox-legend">What&apos;s Inside a Pack</legend>
            <div className="xp-listview">
              <div className="xp-listview-header grid grid-cols-4">
                <span>Tier</span>
                <span>Material</span>
                <span>Drop Rate</span>
                <span>Probability</span>
              </div>
              {[
                { tier: 'Common', material: 'Flat', chance: '58%', bar: 58, color: '#808080' },
                { tier: 'Rare', material: '3D', chance: '14%', bar: 14, color: '#3b82f6' },
                { tier: 'Epic', material: 'Chrome', chance: '3%', bar: 3, color: '#8b5cf6' },
                { tier: 'Legendary', material: 'Gold', chance: '0.5%', bar: 0.5, color: '#eab308' },
              ].map(({ tier, material, chance, bar, color }) => (
                <div key={tier} className="xp-listview-row grid grid-cols-4 items-center">
                  <span className="font-bold" style={{ color }}>{tier}</span>
                  <span>{material}</span>
                  <span>{chance}</span>
                  <div className="xp-progress h-[10px]">
                    <div className="h-full" style={{ width: `${Math.max(2, bar)}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </XpWindow>
      </div>

      {/* Booster overlay — renders on top of everything */}
      {showBooster && <BoosterOverlay onClose={() => setShowBooster(false)} />}
    </>
  );
}
