'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useCards } from '@/lib/hooks/use-cards';
import { MANA_COLORS, RARITY_LABELS, SHAPES } from '@/lib/constants';
import type { Card as CardType, RarityTier } from '@/types/cards';
import { toast } from 'sonner';
import { SplineCard, type SplineCardContent, type SplineCardHandle } from '@/components/booster/spline-card';

// ── Storage keys ───────────────────────────────────────────

const KEY_STYLE = 'sc-prompt-style';
const KEY_SHAPE = 'sc-prompt-shape';
const KEY_SCENE = 'sc-prompt-scene';

// ── Default prompts ────────────────────────────────────────

const DEFAULT_STYLE = `A photo found in a shoebox in an abandoned house, 1996. Shot on a Kodak FunSaver disposable camera, night, harsh on-camera flash. Kodak Gold 800 film pushed two stops — the silver halide grain is thick and clumpy, especially in the shadows where the emulsion was underexposed. The cheap f/11 plastic meniscus lens couldn't resolve detail past 3 feet, so the background dissolves into muddy blur. The on-camera flash fired at full power from 2 inches above the lens, creating harsh specular highlights on the nearest surfaces and pitch-black falloff beyond flash range. Red-eye from the direct flash axis. The 4x6 print sat in a humid shoebox for years — the cyan dye layer has faded, shifting everything warm. Then someone scanned it on a $50 flatbed scanner at 72dpi with dust on the glass and the lid slightly open, washing out the blacks. Orange date stamp burned into the emulsion: random date 1994-1998.

Found photo album photo, photo scan, taken on disposable camera, night flash photo. Accidental composition, subject partially cut off, snapshot quality, not professional photography, no bokeh effect, flat unflattering flash lighting.`;

const DEFAULT_SHAPE_TEMPLATE = `In the center of the photo, held up by someone's hands or prominently placed: a {color_adj} {shape} shape, {material_desc}. This geometric shape is the main focal point — everything else is secondary. The shape catches the flash light directly.`;

const DEFAULT_SCENE_TEMPLATE = `Scene: {scene_desc}

The geometric {shape} trading card or foam shape is clearly visible among the scene. Colorful trading card booster packs scattered around.`;

// ── Material descriptions ──────────────────────────────────

const MATERIAL_DESC: Record<string, string> = {
  flat: 'a flat matte colored foam shape, simple and cheap-looking, like a craft store cutout',
  '3d': 'a solid 3D plastic shape with some depth and weight, glossy surface catching the flash',
  chrome: 'a shiny chrome-plated metallic shape, mirror-like reflections from the flash, premium feel',
  gold: 'a gold-plated heavy shape, rich warm metallic gleam, luxurious and rare-looking',
};

// ── Color adjective from mana ──────────────────────────────

const MANA_COLOR_ADJ: Record<string, string> = {
  red: 'bright red',
  blue: 'deep blue',
  green: 'vivid green',
  white: 'clean white',
  gold: 'golden',
  chrome: 'silver chrome',
};

// ── Scene descriptions by power level ──────────────────────
// Power = ATK + DEF + HP, mapped to scene complexity

interface SceneTier {
  threshold: number;
  label: string;
  desc: string;
}

const DEFAULT_SCENE_TIERS: SceneTier[] = [
  {
    threshold: 0,
    label: 'Quiet',
    desc: 'afro american person alone in a dark empty parking lot, wearing a plain grey hoodie and baggy jeans. Quiet night, nothing happening. Basic 90s streetwear.',
  },
  {
    threshold: 10,
    label: 'Casual',
    desc: 'two afro american people hanging out on a concrete stoop at night, wearing 90s hip-hop fashion — oversized hoodies, snapbacks, timberlands. Casual vibe, just chilling.',
  },
  {
    threshold: 15,
    label: 'Crew',
    desc: 'a small crew of 3-4 afro american people posing on a street corner at night, 90s hip-hop fashion — baggy jeans, gold chains, starter jackets, snapbacks. Some confidence and energy.',
  },
  {
    threshold: 20,
    label: 'Squad',
    desc: 'afro american squad of 5-6 people in front of a car at night, full 90s hip-hop drip — oversized jackets, gold chains, timberlands, bandanas, snapbacks. Animated poses, someone holding up the shape proudly.',
  },
  {
    threshold: 25,
    label: 'Legendary',
    desc: 'epic night scene — large crew of afro american people in premium 90s fashion, gold chains stacked, fur coats, timberlands, someone standing on a car hood. The geometric shape held up like a trophy, catching flash. Maximum energy and flex.',
  },
];

function getSceneTier(card: CardType, tiers: SceneTier[]): SceneTier {
  const power = card.atk + card.def + card.hp;
  let tier = tiers[0];
  for (const t of tiers) {
    if (power >= t.threshold) tier = t;
  }
  return tier;
}

// ── Helpers ────────────────────────────────────────────────

function getShapeEmoji(shape: string): string {
  return SHAPES.find(s => s.shape === shape)?.emoji ?? '?';
}

function replaceVars(template: string, card: CardType, tiers: SceneTier[]): string {
  const sceneTier = getSceneTier(card, tiers);
  return template
    .replace(/\{shape\}/g, card.shape)
    .replace(/\{material\}/g, card.material)
    .replace(/\{material_desc\}/g, MATERIAL_DESC[card.material] ?? card.material)
    .replace(/\{background\}/g, card.background.replace(/_/g, ' '))
    .replace(/\{mana_color\}/g, card.mana_color)
    .replace(/\{color_adj\}/g, MANA_COLOR_ADJ[card.mana_color] ?? card.mana_color)
    .replace(/\{rarity\}/g, card.rarity_tier)
    .replace(/\{wave\}/g, String(card.wave))
    .replace(/\{card_number\}/g, String(card.card_number))
    .replace(/\{atk\}/g, String(card.atk))
    .replace(/\{def\}/g, String(card.def))
    .replace(/\{hp\}/g, String(card.hp))
    .replace(/\{power\}/g, String(card.atk + card.def + card.hp))
    .replace(/\{scene_desc\}/g, sceneTier.desc)
    .replace(/\{scene_label\}/g, sceneTier.label);
}

// ── Rarity colors ──────────────────────────────────────────

const RARITY_HEX: Record<string, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#eab308',
};

// ── Page Component ─────────────────────────────────────────

export default function GeneratePage() {
  const { cards, loading, source } = useCards();

  // Three prompt sections — all persisted
  const [stylePrompt, setStylePrompt] = useState(DEFAULT_STYLE);
  const [shapeTemplate, setShapeTemplate] = useState(DEFAULT_SHAPE_TEMPLATE);
  const [sceneTemplate, setSceneTemplate] = useState(DEFAULT_SCENE_TEMPLATE);

  // Editable scene tiers
  const [sceneTiers, setSceneTiers] = useState<SceneTier[]>(DEFAULT_SCENE_TIERS);

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    imageBase64: string;
    card: CardType;
    filePath: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{
    imageBase64: string;
    card: CardType;
    prompt: string;
    timestamp: number;
  }>>([]);

  // Track saved state for dirty detection
  const [savedPrompts, setSavedPrompts] = useState<{ style: string; shape: string; scene: string; sceneTiers: SceneTier[] } | null>(null);
  const [saving, setSaving] = useState(false);

  // Per-section dirty flags
  const isStyleDirty = savedPrompts ? stylePrompt !== savedPrompts.style : false;
  const isShapeDirty = savedPrompts ? shapeTemplate !== savedPrompts.shape : false;
  const isSceneDirty = savedPrompts ? sceneTemplate !== savedPrompts.scene : false;
  const isTiersDirty = savedPrompts ? JSON.stringify(sceneTiers) !== JSON.stringify(savedPrompts.sceneTiers) : false;

  // Load prompts: API first → localStorage fallback → defaults
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/prompts');
        const { prompts } = await res.json();
        if (!cancelled && prompts) {
          if (prompts.style) setStylePrompt(prompts.style);
          if (prompts.shape) setShapeTemplate(prompts.shape);
          if (prompts.scene) setSceneTemplate(prompts.scene);
          if (prompts.sceneTiers) setSceneTiers(prompts.sceneTiers);
          setSavedPrompts({
            style: prompts.style || DEFAULT_STYLE,
            shape: prompts.shape || DEFAULT_SHAPE_TEMPLATE,
            scene: prompts.scene || DEFAULT_SCENE_TEMPLATE,
            sceneTiers: prompts.sceneTiers || DEFAULT_SCENE_TIERS,
          });
          return;
        }
      } catch { /* API unavailable — fall through */ }

      if (cancelled) return;
      // Fallback to localStorage
      const s1 = localStorage.getItem(KEY_STYLE);
      const s2 = localStorage.getItem(KEY_SHAPE);
      const s3 = localStorage.getItem(KEY_SCENE);
      if (s1) setStylePrompt(s1);
      if (s2) setShapeTemplate(s2);
      if (s3) setSceneTemplate(s3);
      setSavedPrompts({
        style: s1 || DEFAULT_STYLE,
        shape: s2 || DEFAULT_SHAPE_TEMPLATE,
        scene: s3 || DEFAULT_SCENE_TEMPLATE,
        sceneTiers: DEFAULT_SCENE_TIERS,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  // Save prompts to API + localStorage
  const savePrompts = useCallback(async () => {
    setSaving(true);
    try {
      const body = { style: stylePrompt, shape: shapeTemplate, scene: sceneTemplate, sceneTiers };
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      // Also persist to localStorage as backup
      localStorage.setItem(KEY_STYLE, stylePrompt);
      localStorage.setItem(KEY_SHAPE, shapeTemplate);
      localStorage.setItem(KEY_SCENE, sceneTemplate);
      setSavedPrompts(body);
      toast.success('Prompts saved');
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
      // Still save to localStorage
      localStorage.setItem(KEY_STYLE, stylePrompt);
      localStorage.setItem(KEY_SHAPE, shapeTemplate);
      localStorage.setItem(KEY_SCENE, sceneTemplate);
    } finally {
      setSaving(false);
    }
  }, [stylePrompt, shapeTemplate, sceneTemplate, sceneTiers]);

  // Local update helpers (just state, no auto-save)
  const updateStyle = useCallback((v: string) => {
    setStylePrompt(v);
  }, []);
  const updateShape = useCallback((v: string) => {
    setShapeTemplate(v);
  }, []);
  const updateScene = useCallback((v: string) => {
    setSceneTemplate(v);
  }, []);

  // Scene tier for selected card
  const sceneTier = useMemo(
    () => selectedCard ? getSceneTier(selectedCard, sceneTiers) : null,
    [selectedCard, sceneTiers]
  );

  // Assembled prompts per section (with vars replaced)
  const assembledShape = useMemo(
    () => selectedCard ? replaceVars(shapeTemplate, selectedCard, sceneTiers) : '',
    [shapeTemplate, selectedCard, sceneTiers]
  );
  const assembledScene = useMemo(
    () => selectedCard ? replaceVars(sceneTemplate, selectedCard, sceneTiers) : '',
    [sceneTemplate, selectedCard, sceneTiers]
  );

  // Final prompt = style + shape + scene
  const finalPrompt = useMemo(() => {
    if (!selectedCard) return '';
    return [stylePrompt, assembledShape, assembledScene].filter(Boolean).join('\n\n');
  }, [stylePrompt, assembledShape, assembledScene, selectedCard]);

  // Cards without art
  const cardsWithoutArt = useMemo(
    () => cards.filter(c => !c.raw_art_path),
    [cards]
  );

  // ── Pick random card ────────────────────────────────────

  const pickRandom = useCallback((pool: CardType[]) => {
    if (pool.length === 0) { toast.error('No cards available'); return; }
    const card = pool[Math.floor(Math.random() * pool.length)];
    setSelectedCard(card);
    setResult(null);
    setError(null);
  }, []);

  // ── Generate art ────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!selectedCard || !finalPrompt) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    const isLocal = selectedCard.id.startsWith('local-');

    try {
      const res = await fetch('/api/generate/art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: selectedCard.id,
          prompt: finalPrompt,
          cardData: selectedCard,
          // Test mode: skip DB/Storage when cards table doesn't exist yet
          testOnly: isLocal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error === 'blocked_by_safety'
          ? 'Blocked by safety filter. Try adjusting the prompt.'
          : data.error === 'rate_limited'
            ? 'Rate limited. Wait a moment and try again.'
            : data.error === 'no_image_in_response'
              ? `Gemini returned no image. ${data.details ?? ''}`
              : `Error: ${data.error} — ${data.details ?? ''}`;
        setError(msg);
        toast.error(msg);
        return;
      }

      setResult({
        imageBase64: data.imageBase64,
        card: data.card ?? selectedCard,
        filePath: data.filePath ?? '',
      });
      setHistory(prev => [{
        imageBase64: data.imageBase64,
        card: data.card ?? selectedCard,
        prompt: finalPrompt,
        timestamp: Date.now(),
      }, ...prev].slice(0, 10));
      toast.success(
        data.testOnly
          ? `Preview generated for #${selectedCard.card_number} (test mode — not saved to DB)`
          : `Art generated for #${selectedCard.card_number}`
      );
    } catch (err: any) {
      const msg = `Network error: ${err.message}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [selectedCard, finalPrompt]);

  // ── UI ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400">
        Loading cards...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Art Generation</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Generate card art via Gemini AI
            <span className="ml-2 text-xs text-neutral-500">
              {cards.length} cards ({source}) · {cardsWithoutArt.length} without art
            </span>
          </p>
        </div>
{/* Save button removed — now inside each PromptSection */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Column: Prompts ─────────────────── */}
        <div className="space-y-4">

          {/* Card Selector — first, so shape/scene react to it */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Select Card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => pickRandom(cards)} disabled={cards.length === 0}>
                  🎲 Random Card
                </Button>
                <Button variant="outline" size="sm" onClick={() => pickRandom(cardsWithoutArt)} disabled={cardsWithoutArt.length === 0}>
                  🎲 Random (no art)
                </Button>
              </div>
              {selectedCard && <SelectedCardInfo card={selectedCard} sceneTier={sceneTier} />}
            </CardContent>
          </Card>

          {/* 1. Style Prompt */}
          <PromptSection
            label="🎞 Style"
            hint="Camera, film, texture — same for all cards"
            value={stylePrompt}
            onChange={updateStyle}
            onReset={() => updateStyle(DEFAULT_STYLE)}
            rows={8}
            dirty={isStyleDirty}
            onSave={savePrompts}
            saving={saving}
          />

          {/* 2. Shape Focus */}
          <PromptSection
            label="🔺 Shape Focus"
            hint="Focal point — auto-fills from card data. Vars: {shape} {material_desc} {color_adj}"
            value={shapeTemplate}
            onChange={updateShape}
            onReset={() => updateShape(DEFAULT_SHAPE_TEMPLATE)}
            rows={3}
            preview={selectedCard ? assembledShape : undefined}
            dirty={isShapeDirty}
            onSave={savePrompts}
            saving={saving}
          />

          {/* 3. Scene */}
          <PromptSection
            label="🎬 Scene"
            hint="Scene complexity scales with card power (ATK+DEF+HP). Vars: {scene_desc} {scene_label}"
            value={sceneTemplate}
            onChange={updateScene}
            onReset={() => updateScene(DEFAULT_SCENE_TEMPLATE)}
            rows={3}
            preview={selectedCard ? assembledScene : undefined}
            dirty={isSceneDirty}
            onSave={savePrompts}
            saving={saving}
          />

          {/* 4. Scene Tiers — editable desc per power level */}
          <Card className={isTiersDirty ? 'ring-1 ring-amber-600/50' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">🎭 Scene Tiers</CardTitle>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Scene description per power level (ATK+DEF+HP). Used as {'{scene_desc}'} in Scene template.
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {isTiersDirty && (
                    <Button size="sm" onClick={savePrompts} disabled={saving}
                      className="text-xs h-6 bg-amber-600 hover:bg-amber-700 text-white">
                      {saving ? '...' : '💾 Save'}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs text-neutral-500 h-6"
                    onClick={() => setSceneTiers(DEFAULT_SCENE_TIERS)}>
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sceneTiers.map((tier, i) => (
                <div key={tier.threshold}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      ⚡ {tier.threshold}+
                    </Badge>
                    <span className="text-xs font-medium text-neutral-300">{tier.label}</span>
                    {selectedCard && sceneTier?.threshold === tier.threshold && (
                      <Badge className="text-[9px] bg-amber-600/20 text-amber-400 border-amber-600/30">
                        active
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    value={tier.desc}
                    onChange={(e) => {
                      const updated = [...sceneTiers];
                      updated[i] = { ...tier, desc: e.target.value };
                      setSceneTiers(updated);
                    }}
                    rows={2}
                    className="font-mono text-xs bg-neutral-900 border-neutral-700 resize-none"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Generate & Result ───────── */}
        <div className="space-y-4">

          {/* Final Assembled Prompt */}
          {selectedCard && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Final Prompt</CardTitle>
                  <span className="text-xs text-neutral-500">{finalPrompt.length} chars</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-neutral-900 border border-neutral-700 rounded-md p-3 text-xs font-mono text-neutral-400 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                  {finalPrompt}
                </div>
                <div className="mt-3">
                  <Button onClick={handleGenerate} disabled={generating || !selectedCard} className="w-full">
                    {generating ? (
                      <span className="flex items-center gap-2"><Spinner /> Generating...</span>
                    ) : (
                      '✨ Generate Art'
                    )}
                  </Button>
                </div>
                {error && (
                  <div className="mt-3 bg-red-900/30 border border-red-800 rounded-md p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Result — 3D Card + Raw Art side by side */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Result</CardTitle>
                {result && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    {result.filePath ? (
                      <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-800">
                        Saved to DB ✓
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-900/30 text-amber-400 border-amber-800">
                        Test mode
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="flex items-center justify-center h-96 bg-neutral-900 rounded-md border border-neutral-700">
                  <div className="text-center space-y-3">
                    <Spinner size="lg" />
                    <p className="text-sm text-neutral-400">Generating with Gemini 3.1...</p>
                    <p className="text-xs text-neutral-500">This may take 10-20 seconds</p>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  {/* 3D Card Preview */}
                  <div className="flex justify-center items-center">
                    <div style={{ width: 300, height: 400 }}>
                      <SplineCard
                        className="w-full h-full"
                        cardContent={{
                          title: result.card.shape.toUpperCase(),
                          description: result.card.ability || '',
                          cardNumber: `#${String(result.card.card_number).padStart(3, '0')}`,
                          rarity: RARITY_LABELS[result.card.rarity_tier as RarityTier]?.toUpperCase() ?? '',
                          stats: `${result.card.atk} / ${result.card.def}`,
                          manaCost: String(result.card.mana_cost),
                          material: result.card.material.toUpperCase(),
                          artUrl: result.imageBase64,
                        }}
                      />
                    </div>
                  </div>
                  {/* Raw art — full width */}
                  <div className="relative aspect-[4/3] bg-neutral-900 rounded-md border border-neutral-700 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result.imageBase64}
                      alt={`Generated art for card #${result.card.card_number}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 bg-neutral-900 rounded-md border border-neutral-700 border-dashed">
                  <p className="text-sm text-neutral-500">
                    {selectedCard ? 'Click "Generate Art" to create artwork' : 'Select a card first'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent ({history.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {history.map((item) => (
                    <button
                      key={item.timestamp}
                      onClick={() => {
                        setSelectedCard(item.card);
                        setResult({ imageBase64: item.imageBase64, card: item.card, filePath: '' });
                      }}
                      className="group relative aspect-square bg-neutral-900 rounded-md border border-neutral-700 overflow-hidden hover:border-neutral-500 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageBase64} alt={`#${item.card.card_number}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center py-0.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        #{item.card.card_number} {item.card.shape}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Prompt Section ──────────────────────────────────────────

function PromptSection({
  label, hint, value, onChange, onReset, rows, preview, dirty, onSave, saving,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  rows: number;
  preview?: string;
  dirty?: boolean;
  onSave?: () => void;
  saving?: boolean;
}) {
  return (
    <Card className={dirty ? 'ring-1 ring-amber-600/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <p className="text-[11px] text-neutral-500 mt-0.5">{hint}</p>
          </div>
          <div className="flex items-center gap-1">
            {dirty && onSave && (
              <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                className="text-xs h-6 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {saving ? '...' : '💾 Save'}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-xs text-neutral-500 h-6" onClick={onReset}>
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="bg-neutral-900 border-neutral-700 text-xs font-mono resize-y leading-relaxed"
        />
        {preview && (
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded p-2 text-[11px] text-neutral-400 whitespace-pre-wrap max-h-24 overflow-y-auto">
            <span className="text-neutral-500 text-[10px] uppercase tracking-wider">Preview: </span>
            {preview}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Selected Card Info ──────────────────────────────────────

function SelectedCardInfo({ card, sceneTier }: { card: CardType; sceneTier: SceneTier | null }) {
  const mana = MANA_COLORS[card.mana_color];
  const rarityColor = RARITY_HEX[card.rarity_tier] ?? '#666';
  const power = card.atk + card.def + card.hp;

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-md p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{getShapeEmoji(card.shape)}</span>
        <span className="text-sm font-medium capitalize">{card.shape}</span>
        <span className="text-xs text-neutral-400 capitalize">• {card.material} • {card.background.replace(/_/g, ' ')}</span>
        <Badge variant="outline" className="ml-auto text-[10px]" style={{ color: rarityColor, borderColor: rarityColor }}>
          {RARITY_LABELS[card.rarity_tier]}
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span>#{String(card.card_number).padStart(3, '0')}</span>
        <span>{mana.emoji} {mana.label}</span>
        <span>W{card.wave}</span>
        <span className="text-red-400">ATK {card.atk}</span>
        <span className="text-blue-400">DEF {card.def}</span>
        <span className="text-green-400">HP {card.hp}</span>
        <span className="ml-auto font-medium text-neutral-300">
          Power {power} → {sceneTier?.label ?? '?'}
        </span>
      </div>
      {card.raw_art_path && (
        <div className="mt-2 text-xs text-amber-400">⚠ Has existing art — will be overwritten</div>
      )}
    </div>
  );
}

// ── Spinner ─────────────────────────────────────────────────

function Spinner({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const s = size === 'lg' ? 'h-8 w-8' : 'h-4 w-4';
  return (
    <svg className={`${s} animate-spin text-neutral-400`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ── Types ───────────────────────────────────────────────────

interface SceneTier {
  threshold: number;
  label: string;
  desc: string;
}
