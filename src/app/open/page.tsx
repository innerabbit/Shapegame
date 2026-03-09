'use client';

import { useState, useCallback, useEffect } from 'react';
import { generateBoosterPack } from '@/lib/cards/generate-pack';
import type { BoosterStage, PackCard } from '@/components/three/booster-scene';
import type { RarityTier } from '@/types/cards';
import { MANA_COLORS, RARITY_LABELS } from '@/lib/constants';

// ── Rarity colors for UI ──────────────────────────────────────

const RARITY_HEX: Record<RarityTier, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#eab308',
};

// ── Card reveal popup ─────────────────────────────────────────

function CardRevealInfo({ card }: { card: PackCard | null }) {
  if (!card) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="bg-black/80 backdrop-blur-md border rounded-xl px-6 py-4 text-center min-w-[280px]"
        style={{ borderColor: RARITY_HEX[card.rarity_tier] }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl">{MANA_COLORS[card.mana_color].emoji}</span>
          <span className="text-white text-xl font-bold uppercase tracking-wider">
            {card.shape}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span
            className="text-xs font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded"
            style={{
              color: RARITY_HEX[card.rarity_tier],
              backgroundColor: `${RARITY_HEX[card.rarity_tier]}20`,
            }}
          >
            {RARITY_LABELS[card.rarity_tier]}
          </span>
          <span className="text-neutral-400 text-xs uppercase tracking-wider">
            {card.material}
          </span>
        </div>
        <div className="flex justify-center gap-4 text-sm">
          <span className="text-red-400">ATK {card.atk}</span>
          <span className="text-blue-400">DEF {card.def}</span>
          <span className="text-green-400">HP {card.hp}</span>
          <span className="text-yellow-400">⚡{card.mana_cost}</span>
        </div>
        {card.ability && (
          <div className="mt-2 text-purple-400 text-xs">
            ✦ {card.ability}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stage indicator ────────────────────────────────────────────

function StageHint({ stage, revealedCount, total }: {
  stage: BoosterStage;
  revealedCount: number;
  total: number;
}) {
  const hints: Record<BoosterStage, string> = {
    idle: 'Click the booster pack to open',
    opening: 'Opening...',
    revealing: `Click to reveal card ${revealedCount + 1} of ${total}`,
    showcase: 'Your cards!',
    done: '',
  };

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2.5">
        <span className="text-white/80 text-sm font-medium tracking-wide">
          {hints[stage]}
        </span>
      </div>
    </div>
  );
}

// ── Summary overlay after all cards revealed ───────────────────

function PackSummary({ cards, onNewPack }: { cards: PackCard[]; onNewPack: () => void }) {
  const bestCard = cards.reduce((best, c) => {
    const order: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    return order.indexOf(c.rarity_tier) > order.indexOf(best.rarity_tier) ? c : best;
  }, cards[0]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center animate-in fade-in duration-1000">
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white text-center mb-1">Pack Opened!</h2>
        <p className="text-neutral-400 text-center text-sm mb-6">{cards.length} cards revealed</p>

        <div
          className="border rounded-xl p-4 mb-6 text-center"
          style={{
            borderColor: RARITY_HEX[bestCard.rarity_tier],
            backgroundColor: `${RARITY_HEX[bestCard.rarity_tier]}10`,
          }}
        >
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Best Pull</div>
          <div className="text-2xl mb-1">{MANA_COLORS[bestCard.mana_color].emoji}</div>
          <div className="text-white font-bold text-lg uppercase">{bestCard.shape}</div>
          <div className="text-sm font-bold uppercase tracking-wider" style={{ color: RARITY_HEX[bestCard.rarity_tier] }}>
            {RARITY_LABELS[bestCard.rarity_tier]} {bestCard.material}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {cards.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span>{MANA_COLORS[c.mana_color].emoji}</span>
                <span className="text-white text-sm font-medium capitalize">{c.shape}</span>
                <span className="text-neutral-500 text-xs capitalize">{c.material}</span>
              </div>
              <span className="text-xs font-bold uppercase" style={{ color: RARITY_HEX[c.rarity_tier] }}>
                {c.rarity_tier}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onNewPack}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
        >
          Open Another Pack
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function OpenBoosterPage() {
  const [mounted, setMounted] = useState(false);
  const [SceneComponent, setSceneComponent] = useState<React.ComponentType<any> | null>(null);
  const [packCards, setPackCards] = useState<PackCard[]>(() => generateBoosterPack());
  const [stage, setStage] = useState<BoosterStage>('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [lastRevealed, setLastRevealed] = useState<PackCard | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Client-only dynamic import
  useEffect(() => {
    setMounted(true);
    import('@/components/three/booster-scene')
      .then(mod => {
        setSceneComponent(() => mod.BoosterScene);
      })
      .catch(err => {
        console.error('Failed to load 3D scene:', err);
        setLoadError(err.message || 'Failed to load 3D scene');
      });
  }, []);

  const handleStageChange = useCallback((newStage: BoosterStage) => {
    setStage(newStage);
    if (newStage === 'showcase') {
      setLastRevealed(null);
    }
  }, []);

  const handleCardReveal = useCallback((card: PackCard, index: number) => {
    setLastRevealed(card);
    setRevealedCount(index + 1);
  }, []);

  const handleComplete = useCallback(() => {
    setShowSummary(true);
  }, []);

  const handleNewPack = useCallback(() => {
    setPackCards(generateBoosterPack());
    setStage('idle');
    setRevealedCount(0);
    setLastRevealed(null);
    setShowSummary(false);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f]">
      {/* 3D Scene */}
      {SceneComponent ? (
        <SceneComponent
          cards={packCards}
          onStageChange={handleStageChange}
          onCardReveal={handleCardReveal}
          onComplete={handleComplete}
          className="absolute inset-0"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            {loadError ? (
              <>
                <p className="text-red-400 text-sm mb-2">Error loading 3D scene</p>
                <p className="text-neutral-500 text-xs font-mono">{loadError}</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/60 text-sm">Loading 3D scene...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* UI Overlays */}
      <StageHint stage={stage} revealedCount={revealedCount} total={packCards.length} />

      {stage === 'revealing' && lastRevealed && <CardRevealInfo card={lastRevealed} />}
      {showSummary && <PackSummary cards={packCards} onNewPack={handleNewPack} />}

      {/* VHS decorations */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none">
        <div className="flex justify-between items-center px-4 h-full">
          <span className="text-orange-500/60 text-[10px] font-mono tracking-widest">SHAPE CARDS™</span>
          <span className="text-white/30 text-[10px] font-mono">REC ●</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none">
        <div className="flex justify-between items-center px-4 h-full">
          <span className="text-white/20 text-[10px] font-mono">PLAY ▶</span>
          <span className="text-white/20 text-[10px] font-mono">00:00:00</span>
        </div>
      </div>
      {/* VHS scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />
      {/* VHS vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
        }}
      />
      <a href="/admin" className="absolute top-4 right-4 z-20 text-white/40 hover:text-white/80 text-xs font-mono transition-colors">
        ADMIN →
      </a>
    </div>
  );
}
