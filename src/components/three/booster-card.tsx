'use client';

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { RarityTier, ManaColor, MaterialType, ShapeType } from '@/types/cards';

// ── Rarity → visual config ────────────────────────────────────

const RARITY_CONFIG: Record<RarityTier, {
  emissiveColor: string;
  emissiveIntensity: number;
  particleColor: string;
  borderColor: string;
}> = {
  common:    { emissiveColor: '#444444', emissiveIntensity: 0.1, particleColor: '#888888', borderColor: '#666666' },
  uncommon:  { emissiveColor: '#22c55e', emissiveIntensity: 0.3, particleColor: '#4ade80', borderColor: '#22c55e' },
  rare:      { emissiveColor: '#3b82f6', emissiveIntensity: 0.5, particleColor: '#60a5fa', borderColor: '#3b82f6' },
  epic:      { emissiveColor: '#a855f7', emissiveIntensity: 0.8, particleColor: '#c084fc', borderColor: '#a855f7' },
  legendary: { emissiveColor: '#eab308', emissiveIntensity: 1.2, particleColor: '#fde047', borderColor: '#eab308' },
};

const MANA_HEX: Record<ManaColor, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
  white: '#e5e7eb', gold: '#eab308', chrome: '#94a3b8',
};

const SHAPE_SYMBOLS: Record<ShapeType, string> = {
  circle: '●', square: '■', triangle: '▲', star: '★', hexagon: '⬡',
  cube: '◆', cylinder: '◎', pentagon: '⬠',
  diamond: '◇', torus: '◉', heart: '♥', pyramid: '△', knot: '∞',
};

// ── 3D Card Component ──────────────────────────────────────────

interface BoosterCardProps {
  card: {
    shape: ShapeType;
    material: MaterialType;
    mana_color: ManaColor;
    rarity_tier: RarityTier;
    atk: number;
    def: number;
    hp: number;
    mana_cost: number;
    ability: string | null;
    card_number: number;
  };
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  revealed?: boolean;
  index?: number;
  onClick?: () => void;
}

export function BoosterCard({
  card, position, rotation, scale = 1,
  revealed = false, index = 0, onClick,
}: BoosterCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const config = RARITY_CONFIG[card.rarity_tier];
  const manaHex = MANA_HEX[card.mana_color];
  const symbol = SHAPE_SYMBOLS[card.shape];

  // Floating animation
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Gentle hover float
    if (revealed) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + index * 0.8) * 0.03;
      groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.8 + index) * 0.05;
    }

    // Hover scale
    const targetScale = hovered && revealed ? scale * 1.08 : scale;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );

    // Glow pulse for rares+
    if (glowRef.current && card.rarity_tier !== 'common') {
      const pulse = Math.sin(t * 3 + index) * 0.5 + 0.5;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.15 * config.emissiveIntensity;
    }
  });

  // Card material based on rarity
  const cardMaterial = useMemo(() => {
    if (card.material === 'chrome' || card.material === 'gold') {
      return {
        metalness: 0.95,
        roughness: card.material === 'gold' ? 0.2 : 0.05,
        envMapIntensity: 2.5,
        color: card.material === 'gold' ? '#c8a000' : '#c0c0c0',
      };
    }
    return {
      metalness: card.material === '3d' ? 0.3 : 0.0,
      roughness: card.material === '3d' ? 0.5 : 0.8,
      envMapIntensity: 1,
      color: '#1a1a2e',
    };
  }, [card.material]);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Card body */}
      <RoundedBox args={[1.4, 2, 0.04]} radius={0.06} smoothness={4}>
        <meshStandardMaterial
          ref={materialRef}
          color={cardMaterial.color}
          metalness={cardMaterial.metalness}
          roughness={cardMaterial.roughness}
          envMapIntensity={cardMaterial.envMapIntensity}
          emissive={config.emissiveColor}
          emissiveIntensity={revealed ? config.emissiveIntensity * 0.3 : 0}
        />
      </RoundedBox>

      {/* Card border glow */}
      <RoundedBox args={[1.45, 2.05, 0.02]} radius={0.07} smoothness={4} position={[0, 0, -0.015]}>
        <meshBasicMaterial
          color={config.borderColor}
          transparent
          opacity={revealed ? 0.6 : 0}
        />
      </RoundedBox>

      {/* Outer glow (rare+) */}
      {card.rarity_tier !== 'common' && (
        <mesh ref={glowRef} position={[0, 0, -0.03]}>
          <planeGeometry args={[1.8, 2.4]} />
          <meshBasicMaterial
            color={config.emissiveColor}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Card content (only when revealed) */}
      {revealed && (
        <group position={[0, 0, 0.025]}>
          {/* Mana color bar at top */}
          <mesh position={[0, 0.85, 0]}>
            <planeGeometry args={[1.2, 0.12]} />
            <meshBasicMaterial color={manaHex} />
          </mesh>

          {/* Shape symbol */}
          <Text
            position={[0, 0.25, 0]}
            fontSize={0.55}
            color={manaHex}
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff2"
          >
            {symbol}
          </Text>

          {/* Shape name */}
          <Text
            position={[0, -0.15, 0]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
            font="/fonts/inter-bold.woff2"
          >
            {card.shape.toUpperCase()}
          </Text>

          {/* Material badge */}
          <Text
            position={[0, -0.32, 0]}
            fontSize={0.08}
            color={config.borderColor}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.12}
            font="/fonts/inter-bold.woff2"
          >
            {card.material.toUpperCase()}
          </Text>

          {/* Stats bar at bottom */}
          <group position={[0, -0.65, 0]}>
            {/* ATK */}
            <Text position={[-0.4, 0, 0]} fontSize={0.07} color="#ef4444" anchorX="center" font="/fonts/inter-bold.woff2">
              {`ATK ${card.atk}`}
            </Text>
            {/* DEF */}
            <Text position={[-0.13, 0, 0]} fontSize={0.07} color="#3b82f6" anchorX="center" font="/fonts/inter-bold.woff2">
              {`DEF ${card.def}`}
            </Text>
            {/* HP */}
            <Text position={[0.13, 0, 0]} fontSize={0.07} color="#22c55e" anchorX="center" font="/fonts/inter-bold.woff2">
              {`HP ${card.hp}`}
            </Text>
            {/* Mana cost */}
            <Text position={[0.4, 0, 0]} fontSize={0.07} color="#eab308" anchorX="center" font="/fonts/inter-bold.woff2">
              {`⚡${card.mana_cost}`}
            </Text>
          </group>

          {/* Ability (if present) */}
          {card.ability && (
            <Text
              position={[0, -0.82, 0]}
              fontSize={0.065}
              color="#c084fc"
              anchorX="center"
              anchorY="middle"
              maxWidth={1.1}
              font="/fonts/inter-bold.woff2"
            >
              {card.ability}
            </Text>
          )}

          {/* Card number */}
          <Text
            position={[0.55, 0.85, 0]}
            fontSize={0.06}
            color="#666666"
            anchorX="right"
            anchorY="middle"
            font="/fonts/inter-bold.woff2"
          >
            {`#${card.card_number}`}
          </Text>

          {/* Rarity indicator */}
          <Text
            position={[-0.55, 0.85, 0]}
            fontSize={0.06}
            color={config.borderColor}
            anchorX="left"
            anchorY="middle"
            font="/fonts/inter-bold.woff2"
          >
            {card.rarity_tier.toUpperCase()}
          </Text>
        </group>
      )}

      {/* Card back (when not revealed) */}
      {!revealed && (
        <group position={[0, 0, 0.025]}>
          {/* SHAPE CARDS logo */}
          <Text
            position={[0, 0.15, 0]}
            fontSize={0.13}
            color="#ff6600"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.15}
            font="/fonts/inter-bold.woff2"
          >
            SHAPE
          </Text>
          <Text
            position={[0, -0.05, 0]}
            fontSize={0.13}
            color="#ff6600"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.15}
            font="/fonts/inter-bold.woff2"
          >
            CARDS
          </Text>

          {/* Decorative border */}
          <RoundedBox args={[1.2, 1.7, 0.001]} radius={0.04} smoothness={4} position={[0, 0, -0.001]}>
            <meshBasicMaterial color="#ff6600" transparent opacity={0.15} />
          </RoundedBox>
        </group>
      )}
    </group>
  );
}
