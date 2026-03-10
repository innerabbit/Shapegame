'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { HoloPack, type PackPhase } from './holo-pack';
import { CardReveal, type CardData } from './card-reveal';
import { PackParticles } from './particles';
import { fetchBoosterPack } from '@/lib/cards/fetch-pack';
import type { RarityTier } from '@/types/cards';
import { MANA_COLORS, RARITY_LABELS } from '@/lib/constants';
import type { SplineCardHandle } from './spline-card';

// ── Rarity colors ─────────────────────────────────────────────

const RARITY_HEX: Record<RarityTier, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#eab308',
};

type OverlayStage = 'pack' | 'revealing' | 'summary';

interface BoosterOverlayProps {
  onClose: () => void;
}

export function BoosterOverlay({ onClose }: BoosterOverlayProps) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [packLoading, setPackLoading] = useState(true);
  const [stage, setStage] = useState<OverlayStage>('pack');
  const [packPhase, setPackPhase] = useState<PackPhase>('entering');
  const [revealed, setRevealed] = useState<number[]>([]);
  const [showParticles, setShowParticles] = useState(false);
  const [visible, setVisible] = useState(false);
  const revealAllTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cardRefs = useRef<(SplineCardHandle | null)[]>([]);

  // Derived state
  const lastRevealed = revealed.length > 0 ? revealed[revealed.length - 1] : null;
  const allRevealed = revealed.length >= cards.length;

  // Fetch booster pack from API (fallback to local)
  useEffect(() => {
    fetchBoosterPack().then(result => {
      setCards(result.cards);
      setPackLoading(false);
    });
  }, []);

  // Fade in overlay — double-RAF to ensure browser paints initial state first
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Pack enters → idle
  useEffect(() => {
    const t = setTimeout(() => setPackPhase('idle'), 800);
    return () => clearTimeout(t);
  }, []);

  // Transition to summary when all cards revealed
  useEffect(() => {
    if (allRevealed && stage === 'revealing') {
      const t = setTimeout(() => setStage('summary'), 1500);
      return () => clearTimeout(t);
    }
  }, [allRevealed, stage]);

  // Cleanup stagger timers
  useEffect(() => {
    return () => revealAllTimers.current.forEach(clearTimeout);
  }, []);

  const handlePackClick = useCallback(() => {
    if (packPhase !== 'idle' || packLoading) return;
    setPackPhase('shaking');
    setTimeout(() => {
      setPackPhase('tearing');
      setShowParticles(true);
    }, 600);
    setTimeout(() => {
      setPackPhase('done');
      setStage('revealing');
    }, 1400);
  }, [packPhase]);

  /** Click any unrevealed card to flip it */
  const handleCardClick = useCallback((index: number) => {
    setRevealed(prev => {
      if (prev.includes(index)) return prev; // already revealed
      return [...prev, index];
    });
    // Trigger Spline flip animation
    cardRefs.current[index]?.triggerFlip();
  }, []);

  /** Reveal all remaining cards with stagger */
  const handleRevealAll = useCallback(() => {
    const unrevealed = cards
      .map((_, i) => i)
      .filter(i => !revealed.includes(i));

    unrevealed.forEach((cardIndex, i) => {
      const timer = setTimeout(() => {
        setRevealed(prev => {
          if (prev.includes(cardIndex)) return prev;
          return [...prev, cardIndex];
        });
        // Trigger Spline flip animation
        cardRefs.current[cardIndex]?.triggerFlip();
      }, i * 250);
      revealAllTimers.current.push(timer);
    });
  }, [cards, revealed]);

  const handleNewPack = useCallback(() => {
    setPackLoading(true);
    setStage('pack');
    setPackPhase('entering');
    setRevealed([]);
    setShowParticles(false);
    revealAllTimers.current.forEach(clearTimeout);
    revealAllTimers.current = [];

    fetchBoosterPack().then(result => {
      setCards(result.cards);
      setPackLoading(false);
      // Re-enter pack animation
      setTimeout(() => setPackPhase('idle'), 800);
    });
  }, []);

  // ── Hint text ──────────────────────────────────────────────────

  const hintText =
    packLoading ? 'Loading pack...' :
    stage === 'pack' && packPhase === 'idle' ? 'Click the pack to open' :
    stage === 'pack' && (packPhase === 'shaking' || packPhase === 'tearing') ? 'Opening...' :
    stage === 'revealing' && !allRevealed ? `Click any card to reveal \u2022 ${revealed.length} of ${cards.length}` :
    null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Fully transparent backdrop (no grey overlay) */}

      {/* Particles */}
      <PackParticles active={showParticles} />

      {/* Hint + Reveal All button */}
      {stage === 'revealing' && !allRevealed && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2"
          style={{
            opacity: visible ? 1 : 0,
            transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          }}
        >
          <div className="xp-window p-0">
            <div className="px-4 py-1.5 text-[11px] text-[#222]">{hintText}</div>
          </div>
          <button
            onClick={handleRevealAll}
            className="xp-button px-3 py-1 text-[11px] whitespace-nowrap"
          >
            Reveal All
          </button>
        </div>
      )}

      {/* Pack-stage hint (separate from revealing) */}
      {stage === 'pack' && hintText && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[60]"
          style={{
            opacity: visible ? 1 : 0,
            transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          }}
        >
          <div className="xp-window p-0">
            <div className="px-4 py-1.5 text-[11px] text-[#222]">{hintText}</div>
          </div>
        </div>
      )}

      {/* Close button */}
      {stage !== 'summary' && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] xp-button px-3 py-1 text-[11px]"
        >
          Close
        </button>
      )}

      {/* Pack */}
      {stage === 'pack' && (
        <div className="absolute inset-0 flex items-center justify-center z-[52]">
          <HoloPack phase={packPhase} onClick={handlePackClick} />
        </div>
      )}

      {/* Cards — 6 Spline 3D cards */}
      {stage === 'revealing' && (
        <div className="absolute inset-0 flex items-center justify-center z-[52]">
          <div className="flex gap-3 flex-wrap justify-center max-w-[900px] px-4">
            {cards.map((card, i) => (
              <CardReveal
                key={i}
                ref={(handle) => { cardRefs.current[i] = handle; }}
                card={card}
                index={i}
                revealed={revealed.includes(i)}
                onClick={() => handleCardClick(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Card reveal info popup — shows for the last revealed card */}
      {stage === 'revealing' && lastRevealed !== null && (
        <div
          key={lastRevealed}
          className="absolute bottom-20 left-1/2 z-[60] animate-popup-in"
          style={{ transform: 'translateX(-50%)' }}
        >
          <CardInfoPopup card={cards[lastRevealed]} />
        </div>
      )}

      {/* Summary */}
      {stage === 'summary' && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <PackSummary
            cards={cards}
            onNewPack={handleNewPack}
            onClose={onClose}
          />
        </div>
      )}
    </div>
  );
}

// ── Card info popup ─────────────────────────────────────────────

function CardInfoPopup({ card }: { card: CardData }) {
  return (
    <div className="xp-window p-0" style={{ minWidth: 240 }}>
      <div className="xp-title-bar" style={{ background: RARITY_HEX[card.rarity_tier] }}>
        <div className="flex items-center gap-[6px]">
          <span className="text-sm">{MANA_COLORS[card.mana_color].emoji}</span>
          <span className="xp-title-text uppercase tracking-wider">{card.shape}</span>
        </div>
        <span className="xp-title-text text-[10px]">#{card.card_number}</span>
      </div>
      <div className="p-2.5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5"
            style={{ color: RARITY_HEX[card.rarity_tier], border: `1px solid ${RARITY_HEX[card.rarity_tier]}` }}
          >
            {RARITY_LABELS[card.rarity_tier]}
          </span>
          <span className="text-[#666] text-[9px] uppercase tracking-wider">{card.material}</span>
        </div>
        <div className="flex justify-center gap-2.5 text-[10px]">
          <span className="text-[#c00]">ATK {card.atk}</span>
          <span className="text-[#36c]">DEF {card.def}</span>
          <span className="text-[#060]">HP {card.hp}</span>
          <span className="text-[#c90]">MANA {card.mana_cost}</span>
        </div>
        {card.ability && (
          <div className="mt-1 text-[#639] text-[9px]">{card.ability}</div>
        )}
      </div>
    </div>
  );
}

// ── Pack summary ────────────────────────────────────────────────

function PackSummary({ cards, onNewPack, onClose }: {
  cards: CardData[];
  onNewPack: () => void;
  onClose: () => void;
}) {
  const bestCard = cards.reduce((best, c) => {
    const order: RarityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    return order.indexOf(c.rarity_tier) > order.indexOf(best.rarity_tier) ? c : best;
  }, cards[0]);

  return (
    <div
      className="xp-window animate-scale-in"
      style={{ maxWidth: 360, width: '90%' }}
    >
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
  );
}
