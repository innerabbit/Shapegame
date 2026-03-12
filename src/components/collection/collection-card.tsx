'use client';

import { useRef, useState, useCallback } from 'react';
import { SHAPES, RARITY_LABELS } from '@/lib/constants';

interface CollectionCardProps {
  card: {
    card_number: number;
    shape: string;
    material: string;
    rarity_tier: string;
    mana_color: string;
    atk: number;
    def: number;
    hp: number;
    mana_cost: number;
    ability: string | null;
    raw_art_path: string | null;
    processed_card_path: string | null;
    thumb_path: string | null;
  };
  onClick?: () => void;
}

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(120,120,120,0.3)',
  uncommon: 'rgba(34,197,94,0.35)',
  rare: 'rgba(59,130,246,0.4)',
  epic: 'rgba(168,85,247,0.45)',
  legendary: 'rgba(234,179,8,0.5)',
};

const RARITY_BORDER_HEX: Record<string, string> = {
  common: '#555',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#eab308',
};

const RARITY_BG: Record<string, string> = {
  common: 'linear-gradient(145deg, #1a1a2e 0%, #16162a 100%)',
  uncommon: 'linear-gradient(145deg, #0a1f0a 0%, #16162a 100%)',
  rare: 'linear-gradient(145deg, #0a0f2e 0%, #16162a 100%)',
  epic: 'linear-gradient(145deg, #1a0a2e 0%, #16162a 100%)',
  legendary: 'linear-gradient(145deg, #2e1a0a 0%, #1a1a2e 100%)',
};

export function CollectionCard({ card, onClick }: CollectionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [shimmerPos, setShimmerPos] = useState({ x: 50, y: 50 });

  const shapeDef = SHAPES.find((s) => s.shape === card.shape);
  const artUrl = card.thumb_path || card.processed_card_path || card.raw_art_path;
  const artSrc = artUrl ? `/api/art-proxy?path=${encodeURIComponent(artUrl)}` : null;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * -20,
      y: (x - 0.5) * 20,
    });
    setShimmerPos({ x: x * 100, y: y * 100 });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const borderColor = RARITY_BORDER_HEX[card.rarity_tier] || '#555';
  const glowColor = RARITY_GLOW[card.rarity_tier] || 'rgba(120,120,120,0.3)';
  const bg = RARITY_BG[card.rarity_tier] || RARITY_BG.common;

  return (
    <div
      className="cursor-pointer"
      style={{ perspective: '800px' }}
      onClick={onClick}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-xl overflow-hidden select-none"
        style={{
          width: '100%',
          aspectRatio: '5 / 7',
          background: bg,
          border: `2px solid ${borderColor}`,
          boxShadow: isHovered
            ? `0 8px 32px ${glowColor}, 0 0 16px ${glowColor}`
            : `0 2px 8px rgba(0,0,0,0.4)`,
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.05 : 1})`,
          transition: isHovered
            ? 'box-shadow 0.3s ease'
            : 'transform 0.4s ease, box-shadow 0.3s ease',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* Holographic shimmer overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-xl"
          style={{
            background: isHovered
              ? `radial-gradient(circle at ${shimmerPos.x}% ${shimmerPos.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`
              : 'none',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Rainbow holo effect for epic/legendary */}
        {(card.rarity_tier === 'epic' || card.rarity_tier === 'legendary') && isHovered && (
          <div
            className="absolute inset-0 pointer-events-none z-10 rounded-xl opacity-30"
            style={{
              background: `linear-gradient(${shimmerPos.x * 3.6}deg,
                rgba(255,0,0,0.2), rgba(255,165,0,0.2), rgba(255,255,0,0.2),
                rgba(0,255,0,0.2), rgba(0,0,255,0.2), rgba(128,0,255,0.2))`,
              mixBlendMode: 'color-dodge',
            }}
          />
        )}

        {/* Card art or shape placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          {artSrc ? (
            <img
              src={artSrc}
              alt={`${card.shape} ${card.material}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-5xl opacity-30 select-none">
              {shapeDef?.emoji || '?'}
            </span>
          )}
        </div>

        {/* Top bar — rarity + card number */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-2 py-1.5"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
        >
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: borderColor }}
          >
            {RARITY_LABELS[card.rarity_tier as keyof typeof RARITY_LABELS] || card.rarity_tier}
          </span>
          <span className="text-[9px] font-mono text-white/50">
            #{String(card.card_number).padStart(3, '0')}
          </span>
        </div>

        {/* Bottom info — shape name + stats */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-2 py-2"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs">{shapeDef?.emoji}</span>
            <span className="text-[11px] font-bold text-white capitalize truncate">
              {card.shape}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-white/40 ml-auto">
              {card.material}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold">
            <span className="text-red-400">{card.atk} ATK</span>
            <span className="text-blue-400">{card.def} DEF</span>
            <span className="text-green-400">{card.hp} HP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
