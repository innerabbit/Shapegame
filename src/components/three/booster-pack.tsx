'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

// ── Types ──────────────────────────────────────────────────────

export type PackState = 'entering' | 'idle' | 'anticipation' | 'tearing' | 'opened' | 'gone';

interface BoosterPackProps {
  state: PackState;
  onClick?: () => void;
  onTearComplete?: () => void;
}

// ── Easing ─────────────────────────────────────────────────────

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInQuad(t: number): number {
  return t * t;
}

// ── Pack Component ─────────────────────────────────────────────

export function BoosterPack({ state, onClick, onTearComplete }: BoosterPackProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const flapRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  // Animation progress trackers
  const enterProgress = useRef(0);
  const anticipationProgress = useRef(0);
  const tearProgress = useRef(0);
  const exitProgress = useRef(0);
  const [tearDone, setTearDone] = useState(false);
  const [hovered, setHovered] = useState(false);

  useFrame((frameState, delta) => {
    if (!groupRef.current) return;
    const t = frameState.clock.elapsedTime;

    // ── Enter animation: fly in from top-right ──
    if (state === 'entering') {
      enterProgress.current = Math.min(1, enterProgress.current + delta * 1.8);
      const ease = easeOutBack(enterProgress.current);
      groupRef.current.position.x = THREE.MathUtils.lerp(3, 0, ease);
      groupRef.current.position.y = THREE.MathUtils.lerp(4, 0, ease);
      groupRef.current.position.z = THREE.MathUtils.lerp(-2, 0, ease);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(-0.5, 0, ease);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(0.8, 0, ease);
    }

    // ── Idle: gentle float + slow rotation ──
    if (state === 'idle') {
      groupRef.current.position.y = Math.sin(t * 1.0) * 0.06;
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.08;
      groupRef.current.rotation.x = Math.sin(t * 0.6) * 0.02;
      // Hover scale
      const sc = hovered ? 1.04 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(sc, sc, sc), 0.1);
    }

    // ── Anticipation: shake + squeeze ──
    if (state === 'anticipation') {
      anticipationProgress.current = Math.min(1, anticipationProgress.current + delta * 2.5);
      const p = anticipationProgress.current;
      const shakeIntensity = p * 0.04;
      groupRef.current.position.x = Math.sin(t * 50) * shakeIntensity;
      groupRef.current.position.y = Math.cos(t * 45) * shakeIntensity * 0.5;
      groupRef.current.rotation.z = Math.sin(t * 40) * shakeIntensity * 0.8;
      // Squeeze
      const squeezeX = 1 + p * 0.03;
      const squeezeY = 1 - p * 0.04;
      groupRef.current.scale.set(squeezeX, squeezeY, 1);
    }

    // ── Tearing: flap rotates open, light beam ──
    if (state === 'tearing') {
      tearProgress.current = Math.min(1, tearProgress.current + delta * 1.2);
      const p = tearProgress.current;

      // Reset shake
      groupRef.current.position.x = 0;
      groupRef.current.rotation.z = 0;
      groupRef.current.scale.set(1, 1, 1);

      // Flap rotates open (hinge at bottom of flap)
      if (flapRef.current) {
        const flapAngle = easeOutCubic(p) * Math.PI * 0.85;
        flapRef.current.rotation.x = -flapAngle;
        // Slight upward drift
        flapRef.current.position.y = easeOutCubic(p) * 0.3;
      }

      // Light beam from inside
      if (lightRef.current) {
        lightRef.current.intensity = Math.sin(p * Math.PI) * 8;
        lightRef.current.position.y = p * 0.5;
      }

      // Inner glow
      if (glowRef.current) {
        const mat = glowRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.sin(p * Math.PI) * 0.6;
        glowRef.current.scale.setScalar(1 + p * 2);
      }

      // Trigger tear complete
      if (p >= 1 && !tearDone) {
        setTearDone(true);
        onTearComplete?.();
      }
    }

    // ── Opened → shrink away ──
    if (state === 'opened' || state === 'gone') {
      exitProgress.current = Math.min(1, exitProgress.current + delta * 2);
      const p = easeInQuad(exitProgress.current);
      groupRef.current.scale.lerp(new THREE.Vector3(1 - p, 1 - p, 1 - p), 0.15);
      groupRef.current.position.y = -p * 2;
      if (glowRef.current) {
        const mat = glowRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity *= 0.95;
      }
    }
  });

  const isClickable = state === 'idle';

  return (
    <group
      ref={groupRef}
      position={[3, 4, -2]} // starts off-screen, enters via animation
      onClick={isClickable ? onClick : undefined}
      onPointerOver={() => { if (isClickable) { setHovered(true); document.body.style.cursor = 'pointer'; } }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* ── Pack body ── */}
      <group ref={bodyRef}>
        <RoundedBox args={[1.8, 2.6, 0.35]} radius={0.06} smoothness={4} position={[0, -0.2, 0]}>
          <meshPhysicalMaterial
            color="#0d0520"
            metalness={0.6}
            roughness={0.3}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            emissive="#ff6600"
            emissiveIntensity={hovered && isClickable ? 0.12 : 0.03}
          />
        </RoundedBox>

        {/* Pack face decoration */}
        <group position={[0, 0, 0.19]}>
          {/* Orange accent line at top */}
          <mesh position={[0, 0.65, 0]}>
            <planeGeometry args={[1.5, 0.04]} />
            <meshBasicMaterial color="#ff6600" />
          </mesh>

          <Text
            position={[0, 0.35, 0]}
            fontSize={0.2}
            color="#ff6600"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff2"
            letterSpacing={0.2}
          >
            SHAPE
          </Text>
          <Text
            position={[0, 0.1, 0]}
            fontSize={0.2}
            color="#ff6600"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff2"
            letterSpacing={0.2}
          >
            CARDS
          </Text>
          <Text
            position={[0, -0.2, 0]}
            fontSize={0.065}
            color="#888888"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff2"
            letterSpacing={0.35}
          >
            BOOSTER PACK
          </Text>

          {/* Orange accent line at bottom */}
          <mesh position={[0, -0.65, 0]}>
            <planeGeometry args={[1.5, 0.04]} />
            <meshBasicMaterial color="#ff6600" transparent opacity={0.5} />
          </mesh>

          <Text
            position={[0, -0.85, 0]}
            fontSize={0.05}
            color="#555555"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff2"
            letterSpacing={0.15}
          >
            6 COLLECTIBLE CARDS
          </Text>
        </group>
      </group>

      {/* ── Flap (top, tears off) ── */}
      {/* Pivot group positioned at the seam line between body and flap */}
      <group position={[0, 1.1, 0]}>
        <group ref={flapRef}>
          <RoundedBox args={[1.8, 0.7, 0.35]} radius={0.06} smoothness={4} position={[0, 0.35, 0]}>
            <meshPhysicalMaterial
              color="#0d0520"
              metalness={0.6}
              roughness={0.3}
              clearcoat={0.8}
              clearcoatRoughness={0.2}
              emissive="#ff6600"
              emissiveIntensity={0.03}
            />
          </RoundedBox>
          {/* Seam line (tear line visual) */}
          <mesh position={[0, 0, 0.18]}>
            <planeGeometry args={[1.6, 0.02]} />
            <meshBasicMaterial color="#ff6600" transparent opacity={0.3} />
          </mesh>
        </group>
      </group>

      {/* ── Light beam from inside (during tear) ── */}
      <pointLight ref={lightRef} position={[0, 0.5, 0]} intensity={0} color="#ffaa44" distance={5} />

      {/* ── Glow effect ── */}
      <mesh ref={glowRef} position={[0, 0.5, 0.2]}>
        <planeGeometry args={[1, 1.5]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
