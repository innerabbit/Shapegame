'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles, PerspectiveCamera, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { RarityTier, ManaColor, MaterialType, ShapeType } from '@/types/cards';

// ── Types ──────────────────────────────────────────────────────

export type BoosterStage = 'idle' | 'opening' | 'revealing' | 'showcase' | 'done';

export interface PackCard {
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
}

// ── Constants ─────────────────────────────────────────────────

const RARITY_CONFIG: Record<RarityTier, {
  emissiveColor: string;
  emissiveIntensity: number;
  borderColor: string;
}> = {
  common:    { emissiveColor: '#444444', emissiveIntensity: 0.1, borderColor: '#666666' },
  uncommon:  { emissiveColor: '#22c55e', emissiveIntensity: 0.3, borderColor: '#22c55e' },
  rare:      { emissiveColor: '#3b82f6', emissiveIntensity: 0.5, borderColor: '#3b82f6' },
  epic:      { emissiveColor: '#a855f7', emissiveIntensity: 0.8, borderColor: '#a855f7' },
  legendary: { emissiveColor: '#eab308', emissiveIntensity: 1.2, borderColor: '#eab308' },
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

// ── Inline Card Component ──────────────────────────────────────

function Card3D({
  card, position, rotation, scale = 1,
  revealed = false, index = 0, onClick, flyIn = false,
}: {
  card: PackCard;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  revealed?: boolean;
  index?: number;
  onClick?: () => void;
  flyIn?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const flipRef = useRef(0);
  const flyInRef = useRef(0);
  const config = RARITY_CONFIG[card.rarity_tier];
  const manaHex = MANA_HEX[card.mana_color];
  const symbol = SHAPE_SYMBOLS[card.shape];

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Fly-in animation: lerp from center to target position
    if (flyIn && flyInRef.current < 1) {
      flyInRef.current = Math.min(1, flyInRef.current + delta * 2.5);
      const ease = easeOutBack(Math.min(flyInRef.current, 1));
      groupRef.current.position.x = THREE.MathUtils.lerp(0, position[0], ease);
      groupRef.current.position.y = THREE.MathUtils.lerp(0, position[1], ease);
      groupRef.current.position.z = THREE.MathUtils.lerp(0, position[2], ease);
    } else {
      // Settled position — lerp smoothly to target (handles showcase repositioning)
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], 0.08);
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        position[1] + (revealed ? Math.sin(t * 1.5 + index * 0.8) * 0.03 : 0),
        0.08,
      );
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], 0.08);
    }

    // Flip animation: rotate on Y when revealed (instant in showcase)
    const flipTarget = revealed ? Math.PI : 0;
    if (!flyIn && revealed) {
      flipRef.current = Math.PI; // Instant flip in showcase mode
    } else {
      flipRef.current = THREE.MathUtils.lerp(flipRef.current, flipTarget, 0.08);
    }
    groupRef.current.rotation.x = rotation[0];
    groupRef.current.rotation.y = rotation[1] + flipRef.current + (revealed ? Math.sin(t * 0.8 + index) * 0.05 : 0);
    groupRef.current.rotation.z = rotation[2];

    const targetScale = hovered && revealed ? scale * 1.08 : scale;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    if (glowRef.current && card.rarity_tier !== 'common') {
      const pulse = Math.sin(t * 3 + index) * 0.5 + 0.5;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.15 * config.emissiveIntensity;
    }
  });

  const cardColor = card.material === 'gold' ? '#c8a000' : card.material === 'chrome' ? '#c0c0c0' : '#1a1a2e';
  const metalness = card.material === 'gold' ? 0.95 : card.material === 'chrome' ? 0.95 : card.material === '3d' ? 0.3 : 0;
  const roughness = card.material === 'gold' ? 0.2 : card.material === 'chrome' ? 0.05 : card.material === '3d' ? 0.5 : 0.8;

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
          color={cardColor}
          metalness={metalness}
          roughness={roughness}
          emissive={config.emissiveColor}
          emissiveIntensity={revealed ? config.emissiveIntensity * 0.3 : 0}
        />
      </RoundedBox>

      {/* Border glow */}
      <RoundedBox args={[1.45, 2.05, 0.02]} radius={0.07} smoothness={4} position={[0, 0, -0.015]}>
        <meshBasicMaterial color={config.borderColor} transparent opacity={revealed ? 0.6 : 0} />
      </RoundedBox>

      {/* Outer glow for rare+ */}
      {card.rarity_tier !== 'common' && (
        <mesh ref={glowRef} position={[0, 0, -0.03]}>
          <planeGeometry args={[1.8, 2.4]} />
          <meshBasicMaterial color={config.emissiveColor} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      {/* Card front content — on the -Z face so it's visible when flipped (Y+=π) */}
      {revealed && (
        <group position={[0, 0, -0.025]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0.85, 0]}>
            <planeGeometry args={[1.2, 0.12]} />
            <meshBasicMaterial color={manaHex} />
          </mesh>

          <Text position={[0, 0.25, 0]} fontSize={0.55} color={manaHex} anchorX="center" anchorY="middle">
            {symbol}
          </Text>
          <Text position={[0, -0.15, 0]} fontSize={0.12} color="#ffffff" anchorX="center" anchorY="middle" letterSpacing={0.08}>
            {card.shape.toUpperCase()}
          </Text>
          <Text position={[0, -0.32, 0]} fontSize={0.08} color={config.borderColor} anchorX="center" anchorY="middle" letterSpacing={0.12}>
            {card.material.toUpperCase()}
          </Text>

          <group position={[0, -0.65, 0]}>
            <Text position={[-0.4, 0, 0]} fontSize={0.07} color="#ef4444" anchorX="center">{`ATK ${card.atk}`}</Text>
            <Text position={[-0.13, 0, 0]} fontSize={0.07} color="#3b82f6" anchorX="center">{`DEF ${card.def}`}</Text>
            <Text position={[0.13, 0, 0]} fontSize={0.07} color="#22c55e" anchorX="center">{`HP ${card.hp}`}</Text>
            <Text position={[0.4, 0, 0]} fontSize={0.07} color="#eab308" anchorX="center">{`⚡${card.mana_cost}`}</Text>
          </group>

          {card.ability && (
            <Text position={[0, -0.82, 0]} fontSize={0.065} color="#c084fc" anchorX="center" anchorY="middle" maxWidth={1.1}>
              {card.ability}
            </Text>
          )}

          <Text position={[0.55, 0.85, 0]} fontSize={0.06} color="#666666" anchorX="right" anchorY="middle">{`#${card.card_number}`}</Text>
          <Text position={[-0.55, 0.85, 0]} fontSize={0.06} color={config.borderColor} anchorX="left" anchorY="middle">{card.rarity_tier.toUpperCase()}</Text>
        </group>
      )}

      {/* Card back — on the +Z face (hidden once revealed to save rendering) */}
      {!revealed && (
        <group position={[0, 0, 0.025]}>
          <Text position={[0, 0.15, 0]} fontSize={0.13} color="#ff6600" anchorX="center" anchorY="middle" letterSpacing={0.15}>
            SHAPE
          </Text>
          <Text position={[0, -0.05, 0]} fontSize={0.13} color="#ff6600" anchorX="center" anchorY="middle" letterSpacing={0.15}>
            CARDS
          </Text>
          <RoundedBox args={[1.2, 1.7, 0.001]} radius={0.04} smoothness={4} position={[0, 0, -0.001]}>
            <meshBasicMaterial color="#ff6600" transparent opacity={0.15} />
          </RoundedBox>
        </group>
      )}
    </group>
  );
}

// ── Inline Booster Pack ────────────────────────────────────────

// Easing functions
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInQuad(t: number): number {
  return t * t;
}

function Pack3D({
  state, onClick, openProgress = 0,
}: {
  state: 'idle' | 'hover' | 'opening' | 'opened';
  onClick?: () => void;
  openProgress?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const topRef = useRef<THREE.Group>(null);
  const bottomRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((frameState) => {
    if (!groupRef.current) return;
    const t = frameState.clock.elapsedTime;

    if (state === 'idle' || state === 'hover') {
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.05;
      const sc = state === 'hover' ? 1.05 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(sc, sc, sc), 0.1);
    }

    if (state === 'opening' && topRef.current && bottomRef.current) {
      // Phase 1: Shake anticipation (0–0.3)
      // Phase 2: Tear open with easing (0.3–1.0)
      if (openProgress < 0.3) {
        const shakePhase = openProgress / 0.3;
        const shakeIntensity = shakePhase * 0.06;
        groupRef.current.position.x = Math.sin(t * 40) * shakeIntensity;
        groupRef.current.rotation.z = Math.sin(t * 35) * shakeIntensity * 0.5;
        // Squeeze slightly during shake
        const squeeze = 1 - shakePhase * 0.05;
        groupRef.current.scale.set(1 + shakePhase * 0.02, squeeze, 1);
      } else {
        // Reset shake
        groupRef.current.position.x = 0;
        groupRef.current.rotation.z = 0;

        const tearProgress = (openProgress - 0.3) / 0.7; // 0→1 over the tear phase
        const easedTear = easeOutBack(tearProgress);

        topRef.current.position.y = easedTear * 2.5;
        topRef.current.rotation.x = -easedTear * Math.PI * 0.4;
        topRef.current.position.z = -easeInQuad(tearProgress) * 0.5;
        bottomRef.current.position.y = -easedTear * 0.3;
      }

      if (glowRef.current) {
        const mat = glowRef.current.material as THREE.MeshBasicMaterial;
        const glowPhase = Math.min(openProgress * 3, 1);
        mat.opacity = glowPhase * 0.8 * (1 - Math.max(0, (openProgress - 0.7) / 0.3));
        glowRef.current.scale.setScalar(1 + openProgress * 3);
      }
    }

    if (state === 'opened' && groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), 0.05);
    }
  });

  return (
    <group ref={groupRef} onClick={state === 'idle' || state === 'hover' ? onClick : undefined}>
      <group ref={topRef}>
        <RoundedBox args={[2, 1.5, 0.3]} radius={0.08} smoothness={4} position={[0, 0.75, 0]}>
          <meshStandardMaterial color="#0d0520" metalness={0.7} roughness={0.25} emissive="#ff6600" emissiveIntensity={state === 'hover' ? 0.15 : 0.05} />
        </RoundedBox>
      </group>

      <group ref={bottomRef}>
        <RoundedBox args={[2, 1.5, 0.3]} radius={0.08} smoothness={4} position={[0, -0.75, 0]}>
          <meshStandardMaterial color="#0d0520" metalness={0.7} roughness={0.25} emissive="#ff6600" emissiveIntensity={0.05} />
        </RoundedBox>
      </group>

      <Text position={[0, 0.8, 0.17]} fontSize={0.2} color="#ff6600" anchorX="center" anchorY="middle" letterSpacing={0.2}>SHAPE</Text>
      <Text position={[0, 0.55, 0.17]} fontSize={0.2} color="#ff6600" anchorX="center" anchorY="middle" letterSpacing={0.2}>CARDS</Text>
      <Text position={[0, 0.2, 0.17]} fontSize={0.09} color="#888888" anchorX="center" anchorY="middle" letterSpacing={0.3}>BOOSTER PACK</Text>
      <Text position={[0, -0.6, 0.17]} fontSize={0.08} color="#555555" anchorX="center" anchorY="middle" letterSpacing={0.15}>6 COLLECTIBLE CARDS</Text>

      <mesh ref={glowRef} position={[0, 0, 0.2]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Particle Burst on Pack Open ──────────────────────────────────

const PARTICLE_COUNT = 80;

function ParticleBurst({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const startedRef = useRef(false);
  const timeRef = useRef(0);

  // Create geometry + velocity data once
  const { geometry, velocities } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const vels: THREE.Vector3[] = [];
    const colorOptions = [
      new THREE.Color('#ff6600'),
      new THREE.Color('#ff8800'),
      new THREE.Color('#ffaa00'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#ff4400'),
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Random burst direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI - Math.PI / 2;
      const speed = 2 + Math.random() * 4;
      vels.push(new THREE.Vector3(
        Math.cos(theta) * Math.cos(phi) * speed,
        Math.sin(phi) * speed * 0.5 + Math.random() * 2,
        Math.sin(theta) * Math.cos(phi) * speed,
      ));

      const col = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return { geometry: geo, velocities: vels };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    if (active && !startedRef.current) {
      startedRef.current = true;
      timeRef.current = 0;
    }

    if (!startedRef.current) return;

    timeRef.current += delta;
    const positions = geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const vel = velocities[i];
      positions.setXYZ(
        i,
        vel.x * timeRef.current,
        vel.y * timeRef.current - 4.9 * timeRef.current * timeRef.current, // gravity
        vel.z * timeRef.current,
      );
    }
    positions.needsUpdate = true;

    // Fade out
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - timeRef.current * 0.7);
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.08} vertexColors transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ── Card layout helpers ────────────────────────────────────────

function getCardFanPosition(index: number, total: number): [number, number, number] {
  const spread = 3.8;
  const offset = (index - (total - 1) / 2) / Math.max(total - 1, 1);
  return [offset * spread, -Math.abs(offset) * 0.3 + 0.2, -Math.abs(offset) * 0.5];
}

function getCardFanRotation(index: number, total: number): [number, number, number] {
  const offset = (index - (total - 1) / 2) / Math.max(total - 1, 1);
  return [0, offset * -0.15, offset * -0.08];
}

function getShowcasePosition(index: number): [number, number, number] {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return [(col - 1) * 1.8, (0.5 - row) * 2.5, 0];
}

// ── Animated Camera ──────────────────────────────────────────────

const CAMERA_TARGETS: Record<BoosterStage, { pos: THREE.Vector3; lookAt: THREE.Vector3 }> = {
  idle:      { pos: new THREE.Vector3(0, 0.3, 5),   lookAt: new THREE.Vector3(0, 0, 0) },
  opening:   { pos: new THREE.Vector3(0, 0.4, 4.5), lookAt: new THREE.Vector3(0, 0, 0) },
  revealing: { pos: new THREE.Vector3(0, 0.2, 5.5), lookAt: new THREE.Vector3(0, 0, 0) },
  showcase:  { pos: new THREE.Vector3(0, 0.3, 6),   lookAt: new THREE.Vector3(0, 0, 0) },
  done:      { pos: new THREE.Vector3(0, 0.3, 6),   lookAt: new THREE.Vector3(0, 0, 0) },
};

function AnimatedCamera({ stage }: { stage: BoosterStage }) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const currentPos = useRef(new THREE.Vector3(0, 0.3, 5));

  useFrame(() => {
    if (!camRef.current) return;
    const target = CAMERA_TARGETS[stage];
    currentPos.current.lerp(target.pos, 0.03);
    camRef.current.position.copy(currentPos.current);
    camRef.current.lookAt(target.lookAt);
  });

  return <PerspectiveCamera ref={camRef} makeDefault position={[0, 0.3, 5]} fov={50} />;
}

// ── Scene Controller (inside Canvas) ───────────────────────────

function SceneController({
  cards, stage, setStage, revealedCount, setRevealedCount, onCardClick,
}: {
  cards: PackCard[];
  stage: BoosterStage;
  setStage: (s: BoosterStage) => void;
  revealedCount: number;
  setRevealedCount: (n: number) => void;
  onCardClick?: (card: PackCard, index: number) => void;
}) {
  const openProgressRef = useRef(0);
  const [openProgress, setOpenProgress] = useState(0);
  const [packState, setPackState] = useState<'idle' | 'hover' | 'opening' | 'opened'>('idle');

  useFrame((_, delta) => {
    if (stage === 'opening') {
      openProgressRef.current = Math.min(1, openProgressRef.current + delta * 0.6);
      setOpenProgress(openProgressRef.current);
      if (openProgressRef.current >= 1) {
        setStage('revealing');
        setPackState('opened');
      }
    }
  });

  const handlePackClick = useCallback(() => {
    if (stage !== 'idle') return;
    setStage('opening');
    setPackState('opening');
    openProgressRef.current = 0;
  }, [stage, setStage]);

  const handleCardClick = useCallback((index: number) => {
    if (stage !== 'revealing') return;
    if (index !== revealedCount) return;
    setRevealedCount(revealedCount + 1);
    if (revealedCount + 1 >= cards.length) {
      setTimeout(() => setStage('showcase'), 800);
    }
    onCardClick?.(cards[index], index);
  }, [stage, revealedCount, cards, setRevealedCount, setStage, onCardClick]);

  return (
    <>
      {/* Animated Camera */}
      <AnimatedCamera stage={stage} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-3, 2, 3]} intensity={0.4} color="#ff6600" />
      <pointLight position={[3, -1, 2]} intensity={0.3} color="#3b82f6" />
      <pointLight position={[0, -2, 4]} intensity={0.2} color="#a855f7" />

      {/* Background */}
      <Stars radius={50} depth={50} count={2000} factor={3} saturation={0.5} fade speed={0.5} />
      <Sparkles count={60} scale={15} size={2} speed={0.3} opacity={0.4} color="#ff6600" />

      {/* Particle burst on open */}
      <ParticleBurst active={stage === 'opening' || stage === 'revealing'} />

      {/* Booster Pack */}
      {stage !== 'showcase' && stage !== 'done' && (
        <Pack3D state={packState} onClick={handlePackClick} openProgress={openProgress} />
      )}

      {/* Cards */}
      {(stage === 'revealing' || stage === 'showcase') && cards.map((card, i) => {
        if (stage === 'revealing' && i > revealedCount) return null;
        const pos = stage === 'showcase' ? getShowcasePosition(i) : getCardFanPosition(i, cards.length);
        const rot = stage === 'showcase' ? [0, 0, 0] as [number, number, number] : getCardFanRotation(i, cards.length);
        return (
          <Card3D
            key={i}
            card={card}
            position={pos}
            rotation={rot}
            scale={stage === 'showcase' ? 0.85 : 0.9}
            revealed={i < revealedCount || stage === 'showcase'}
            index={i}
            onClick={() => handleCardClick(i)}
            flyIn={stage === 'revealing'}
          />
        );
      })}
    </>
  );
}

// ── Public Component ───────────────────────────────────────────

interface BoosterSceneProps {
  cards: PackCard[];
  onStageChange?: (stage: BoosterStage) => void;
  onCardReveal?: (card: PackCard, index: number) => void;
  onComplete?: () => void;
  className?: string;
}

export function BoosterScene({
  cards, onStageChange, onCardReveal, onComplete, className = '',
}: BoosterSceneProps) {
  const [stage, setStage] = useState<BoosterStage>('idle');
  const [revealedCount, setRevealedCount] = useState(0);

  const handleStageChange = useCallback((newStage: BoosterStage) => {
    setStage(newStage);
    onStageChange?.(newStage);
    if (newStage === 'showcase') {
      setTimeout(() => onComplete?.(), 2000);
    }
  }, [onStageChange, onComplete]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        dpr={[1, 2]}
        style={{ background: '#0a0a0f' }}
      >
        <SceneController
          cards={cards}
          stage={stage}
          setStage={handleStageChange}
          revealedCount={revealedCount}
          setRevealedCount={setRevealedCount}
          onCardClick={onCardReveal}
        />
      </Canvas>
    </div>
  );
}
