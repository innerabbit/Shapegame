'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { Application as SplineApp } from '@splinetool/runtime';

const SCENE_URL = 'https://prod.spline.design/fNEyIuTyKEBBMlkQ/scene.splinecode?v=3';

// ── Types ──────────────────────────────────────────────────────

export interface SplineCardContent {
  title: string;         // shape name, e.g. "TRIANGLE"
  description: string;   // ability text or empty string
  cardNumber: string;    // e.g. "#042 / 03.10.2026"
  rarity: string;        // e.g. "RARE"
  stats: string;         // e.g. "5 / 8"
  manaCost: string;      // e.g. "2"
  material: string;      // e.g. "3D"
  artUrl?: string;       // optional URL for card art texture
}

export interface SplineCardHandle {
  triggerFlip: () => void;
  getApp: () => SplineApp | null;
}

interface SplineCardProps {
  className?: string;
  style?: React.CSSProperties;
  /** Dynamic card content to inject into the Spline scene */
  cardContent?: SplineCardContent;
  /** Called when the Spline scene finishes loading */
  onLoad?: () => void;
  onClick?: () => void;
  /** Name of the Spline object that has the flip animation (default: 'Card') */
  flipObjectName?: string;
}

// ── Text field mapping ────────────────────────────────────────
// Maps Spline scene object names → cardContent property keys
// defaultHint: expected default text in Spline scene (used to disambiguate duplicates)

const TEXT_FIELDS: { objectName: string; contentKey: keyof SplineCardContent; defaultHint?: string }[] = [
  { objectName: 'CardTitle',       contentKey: 'title',       defaultHint: 'SHAPE' },
  { objectName: 'CardDescription', contentKey: 'description', defaultHint: 'Base power' },
  { objectName: '#date',           contentKey: 'cardNumber' },
  { objectName: 'CardRare',        contentKey: 'rarity' },
  { objectName: 'CardStats',       contentKey: 'stats' },
  { objectName: 'Mana Cost',       contentKey: 'manaCost' },  // Spline name may have trailing space
  { objectName: 'Cardtype',        contentKey: 'material' },
];

// ── Apply content to Spline scene ─────────────────────────────
// Uses internal scene API to access raw text objects (bypassing proxy)
// Each SplineCard instance creates its own Application, so scene is NOT shared.

const MAX_RETRIES = 30;
const RETRY_DELAY = 150; // ms

function findScene(app: any): any {
  return app._scene || app.scene || app._proxyScene || app._world || null;
}

function findSharedAssets(app: any): any {
  return app._sharedAssetsManager || app._sharedAssets || app.sharedAssets || null;
}

/** Get the current text value of a text object */
function getTextValue(obj: any): string {
  const text = obj.textGeometry?.text;
  if (typeof text === 'object') return text?.textValue || '';
  return typeof text === 'string' ? text : '';
}

/**
 * Build a map of text objects by name (trimmed).
 * Prefers Spline's traverseEntity() which covers the full internal tree,
 * then falls back to THREE.js recursive .children traversal.
 */
function buildTextObjectMap(scene: any): Map<string, any[]> {
  const map = new Map<string, any[]>();

  const addObj = (obj: any) => {
    if (!obj.textGeometry) return;
    const name = (obj.data?.name || obj.name || '').trim();
    if (!name) return;
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(obj);
  };

  // Prefer Spline's own traversal (covers full entity tree)
  if (typeof scene.traverseEntity === 'function') {
    scene.traverseEntity((obj: any) => addObj(obj));
  } else {
    // Fallback: THREE.js recursive children
    const walk = (obj: any) => {
      addObj(obj);
      for (const child of obj.children || []) walk(child);
    };
    walk(scene);
  }

  return map;
}

/**
 * Find the right text object for a field, handling duplicates.
 * If there are multiple objects with the same name, prefer the one whose
 * current text matches the defaultHint (e.g. "SHAPE" for CardTitle).
 */
function findTextObject(
  textMap: Map<string, any[]>,
  objectName: string,
  defaultHint?: string
): any | null {
  // Try exact name first
  let matches = textMap.get(objectName);

  // If not found, try trimmed comparison (handles "Mana Cost " trailing space)
  if (!matches) {
    const trimmed = objectName.trim();
    for (const [key, objs] of textMap) {
      if (key.trim() === trimmed) {
        matches = objs;
        break;
      }
    }
  }

  if (!matches || matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Multiple matches — pick by defaultHint
  if (defaultHint) {
    const hintMatch = matches.find(obj => getTextValue(obj).trim() === defaultHint);
    if (hintMatch) return hintMatch;
  }

  // Fallback: return last match (card content objects tend to be deeper in hierarchy)
  return matches[matches.length - 1];
}

let discoveryCount = 0;

function applyContent(spline: SplineApp, content: SplineCardContent, attempt = 0) {
  const app = spline as any;
  const scene = findScene(app);
  const sharedAssets = findSharedAssets(app);

  if (!scene) {
    if (attempt < MAX_RETRIES) {
      setTimeout(() => applyContent(spline, content, attempt + 1), RETRY_DELAY);
    } else {
      console.warn('[Spline] applyContent: scene not available after retries');
    }
    return;
  }

  // Expose for debugging
  if (typeof window !== 'undefined') {
    if (!(window as any).__splineApps) (window as any).__splineApps = [];
    if (!(window as any).__splineApps.includes(spline)) {
      (window as any).__splineApps.push(spline);
    }
  }

  // Build text object map from scene traversal (handles duplicates + trimmed names)
  const textMap = buildTextObjectMap(scene);

  // Discovery logging (first instance only)
  if (discoveryCount < 1) {
    discoveryCount++;
    console.log(`[Spline] Card "${content.title}" — found ${textMap.size} text object names`);
  }

  // Skip if content already applied (avoids duplicate work from safety-net re-apply)
  const titleObj = findTextObject(textMap, 'CardTitle', 'SHAPE');
  if (titleObj && getTextValue(titleObj).trim() === content.title.trim()) {
    return; // Already applied
  }

  // Apply text fields
  const setTextPromises: Promise<void>[] = [];

  for (const field of TEXT_FIELDS) {
    const value = content[field.contentKey] as string;
    if (value === undefined || value === null) continue;
    const displayValue = value || ' '; // Use space for empty to avoid layout collapse

    const rawObj = findTextObject(textMap, field.objectName, field.defaultHint);
    if (!rawObj) {
      console.warn(`[Spline] ⚠️ Text object "${field.objectName}" not found`);
      continue;
    }

    if (rawObj.textGeometry && typeof rawObj.textGeometry.setText === 'function') {
      const p = rawObj.textGeometry
        .setText(displayValue, sharedAssets)
        .then(() => {
          // Request render — text geometry may need an extra frame
          const render = () => {
            if (sharedAssets?.requestRender) sharedAssets.requestRender();
            else if (app.requestRender) app.requestRender();
          };
          render();
          setTimeout(render, 200);
        })
        .catch((e: any) => {
          console.warn(`[Spline] ❌ setText failed on "${field.objectName}":`, e);
        });
      setTextPromises.push(p);
    }
  }

  // Summary log once all text fields applied
  Promise.all(setTextPromises).then(() => {
    console.log(`[Spline] ✅ "${content.title}" — ${setTextPromises.length} text fields applied`);
  });

  // Update card art texture if URL provided
  // NOTE: updateTexture() exists on the PROXY material layers, NOT on internal objects.
  // So we use spline.findObjectByName() (public API) instead of scene.getObjectByName().
  if (content.artUrl) {
    try {
      const artProxy = spline.findObjectByName('CardArt');
      if (artProxy?.material?.layers) {
        const textureLayer = (artProxy.material as any).layers.find(
          (l: any) => l.type === 'texture'
        );
        if (textureLayer && typeof textureLayer.updateTexture === 'function') {
          textureLayer.updateTexture(content.artUrl)
            .then(() => {
              if (sharedAssets?.requestRender) sharedAssets.requestRender();
              else if (app.requestRender) app.requestRender();
            })
            .catch((e: any) => {
              console.warn('[Spline] ❌ CardArt texture update failed:', e);
            });
        }
      }
    } catch (e) {
      console.warn('[Spline] ⚠️ CardArt texture error:', e);
    }
  }
}

// ── Loader ─────────────────────────────────────────────────────

function SplineLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#ff660044', borderTopColor: 'transparent' }}
        />
        <span className="text-[9px] text-[#ff660066] tracking-[0.3em] uppercase">
          Loading 3D
        </span>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────
// Uses @splinetool/runtime directly (NOT the React wrapper) to ensure
// each card instance gets its own Application and scene.
// The React <Spline> component shares a single Application for same URLs,
// which breaks per-card text injection.

export const SplineCard = forwardRef<SplineCardHandle, SplineCardProps>(
  function SplineCard({ className = '', style, cardContent, onLoad, onClick, flipObjectName = 'Card' }, ref) {
    const [loaded, setLoaded] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<SplineApp | null>(null);
    const disposedRef = useRef(false);

    // Expose imperative handle for parent to trigger flip animation
    useImperativeHandle(ref, () => ({
      triggerFlip() {
        const app = appRef.current;
        if (!app) return;
        try {
          app.emitEvent('mouseDown', flipObjectName);
          console.log(`[Spline] 🔄 flip → "${flipObjectName}"`);
        } catch (e) {
          console.warn(`[Spline] ❌ emitEvent failed:`, e);
        }
      },
      getApp() {
        return appRef.current;
      },
    }), [flipObjectName]);

    // Initialize Spline runtime — each card gets its own Application instance
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      disposedRef.current = false;

      import('@splinetool/runtime').then(({ Application }) => {
        if (disposedRef.current) return;

        const app = new Application(canvas);
        app.load(SCENE_URL).then(() => {
          if (disposedRef.current) {
            app.dispose();
            return;
          }
          appRef.current = app;

          // Scale canvas to fit container via CSS transform.
          // Spline renders at its native frame size (600×800) — setSize() is unreliable.
          // Instead we CSS-scale the canvas down to fit the parent container.
          requestAnimationFrame(() => {
            const container = canvas.parentElement;
            if (container && canvas.clientWidth > 0) {
              const scaleX = container.clientWidth / canvas.clientWidth;
              const scaleY = container.clientHeight / canvas.clientHeight;
              const scale = Math.min(scaleX, scaleY);
              // Center the scaled canvas within the container
              const offsetX = (container.clientWidth - canvas.clientWidth * scale) / 2;
              const offsetY = (container.clientHeight - canvas.clientHeight * scale) / 2;
              canvas.style.transformOrigin = 'top left';
              canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
            }
          });

          setLoaded(true);
          onLoad?.();
        }).catch((err) => {
          console.warn('[Spline] Failed to load scene:', err);
        });
      });

      return () => {
        disposedRef.current = true;
        if (appRef.current) {
          try { appRef.current.dispose(); } catch (_) {}
          appRef.current = null;
        }
        setLoaded(false);
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Apply content when Spline loads or cardContent changes
    // Delay is critical: app.load() resolves before the text rendering pipeline
    // (fonts, glyphs) is fully initialized. Without delay, setText "succeeds"
    // (promise resolves) but the visual doesn't update because glyphs aren't ready.
    useEffect(() => {
      if (!loaded || !appRef.current || !cardContent) return;

      const timers: ReturnType<typeof setTimeout>[] = [];

      // First attempt — give fonts/glyphs ~800ms to initialize
      timers.push(setTimeout(() => {
        if (appRef.current && !disposedRef.current) {
          applyContent(appRef.current, cardContent);
        }
      }, 800));

      // Safety-net re-apply — catches edge cases where first apply was too early
      timers.push(setTimeout(() => {
        if (appRef.current && !disposedRef.current) {
          applyContent(appRef.current, cardContent);
        }
      }, 2000));

      return () => timers.forEach(clearTimeout);
    }, [loaded, cardContent]);

    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ ...style }}
        onClick={onClick}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            background: 'transparent',
          }}
        />

        {/* Loading placeholder while Spline loads */}
        {!loaded && <SplineLoader />}
      </div>
    );
  }
);
