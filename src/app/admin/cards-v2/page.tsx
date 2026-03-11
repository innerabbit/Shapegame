'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CardV2, CardType, CardColor, RarityTier, HeroClass } from '@/types/cards';
import {
  CARD_COLORS,
  HERO_CLASSES,
  RARITY_LABELS,
  RARITY_COLORS,
} from '@/lib/constants';
import { SplineCard, type SplineCardContent } from '@/components/booster/spline-card';
import { cardToSplineContent } from '@/components/booster/card-reveal';

type FilterStatus = 'all' | 'no-description' | 'no-art' | 'complete';

export default function CardsV2Page() {
  const [cards, setCards] = useState<CardV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CardV2 | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<CardType | 'all'>('all');
  const [colorFilter, setColorFilter] = useState<CardColor | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<RarityTier | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk action state
  const [bulkAction, setBulkAction] = useState<'description' | 'art'>('description');
  const [bulkTarget, setBulkTarget] = useState<'missing' | 'all' | 'filtered'>('missing');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  // Editing
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Fetch cards
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cards');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setCards([]);
      } else {
        const allCards = Array.isArray(data) ? data : (data.cards || []);
        const v2Cards = allCards.filter((c: any) => c.card_type);
        setCards(v2Cards);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch cards');
      setCards([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  // Filtered cards
  const filteredCards = useMemo(() => {
    let result = cards;
    if (typeFilter !== 'all') result = result.filter(c => c.card_type === typeFilter);
    if (colorFilter !== 'all') result = result.filter(c => c.color === colorFilter);
    if (rarityFilter !== 'all') result = result.filter(c => c.rarity_tier === rarityFilter);
    if (statusFilter === 'no-description') result = result.filter(c => !c.art_description);
    if (statusFilter === 'no-art') result = result.filter(c => !c.raw_art_path);
    if (statusFilter === 'complete') result = result.filter(c => c.art_description && c.raw_art_path);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name?.toLowerCase().includes(q) || c.hero_class?.includes(q));
    }
    return result;
  }, [cards, typeFilter, colorFilter, rarityFilter, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: cards.length,
    withDesc: cards.filter(c => c.art_description).length,
    withArt: cards.filter(c => c.raw_art_path).length,
    lands: cards.filter(c => c.card_type === 'land').length,
    heroes: cards.filter(c => c.card_type === 'hero').length,
    artifacts: cards.filter(c => c.card_type === 'artifact').length,
  }), [cards]);

  // Generate description for a single card
  const generateDescription = async (cardId: string, force = false) => {
    setGeneratingDesc(true);
    try {
      const res = await fetch('/api/cards/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: [cardId], forceRegenerate: force }),
      });
      const data = await res.json();
      if (data.results?.[0]?.description) {
        toast.success('Description generated');
        await fetchCards();
        // Update selected card
        if (selectedCard?.id === cardId) {
          setSelectedCard(prev => prev ? { ...prev, art_description: data.results[0].description } : null);
        }
      } else {
        toast.error(data.results?.[0]?.error || 'Failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
    setGeneratingDesc(false);
  };

  // Save edited description
  const saveDescription = async (cardId: string, desc: string) => {
    const res = await fetch('/api/cards/' + cardId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ art_description: desc }),
    });
    if (res.ok) {
      toast.success('Description saved');
      setEditingDesc(false);
      await fetchCards();
      if (selectedCard?.id === cardId) {
        setSelectedCard(prev => prev ? { ...prev, art_description: desc } : null);
      }
    }
  };

  // Bulk generate descriptions
  const runBulkAction = async () => {
    let targetCards = filteredCards;
    if (bulkTarget === 'missing') {
      targetCards = targetCards.filter(c => !c.art_description);
    }
    if (targetCards.length === 0) {
      toast.info('No cards to process');
      return;
    }

    setBulkProcessing(true);
    setBulkProgress({ done: 0, total: targetCards.length });

    // Process in batches of 5
    const batchSize = 5;
    for (let i = 0; i < targetCards.length; i += batchSize) {
      const batch = targetCards.slice(i, i + batchSize);
      try {
        await fetch('/api/cards/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardIds: batch.map(c => c.id),
            forceRegenerate: bulkTarget === 'all',
          }),
        });
      } catch {}
      setBulkProgress({ done: Math.min(i + batchSize, targetCards.length), total: targetCards.length });
    }

    setBulkProcessing(false);
    toast.success('Bulk generation complete');
    fetchCards();
  };

  // Seed button
  const seedCards = async () => {
    const res = await fetch('/api/cards/seed-v2', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Seeded ${data.inserted} cards`);
      fetchCards();
    } else {
      toast.error(data.error || 'Seed failed');
    }
  };

  // Type icon
  const typeIcon = (t: string) => t === 'land' ? '🌍' : t === 'hero' ? '⚔️' : '🔧';

  if (loading) {
    return <div className="text-center py-20 text-neutral-500">Loading cards...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-2 font-medium">Failed to load cards</p>
        <p className="text-neutral-500 text-sm mb-6 max-w-lg mx-auto font-mono">{error}</p>
        <p className="text-neutral-400 text-sm mb-4">Run the v2 migration SQL in Supabase Dashboard first, then seed the cards.</p>
        <button onClick={seedCards} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-md text-sm font-medium">
          🌱 Seed 125 Cards
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-400 mb-4">No v2 cards found. Seed the database first.</p>
        <button onClick={seedCards} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-md text-sm font-medium">
          🌱 Seed 125 Cards
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Cards v2</h2>
          <span className="text-sm text-neutral-400">
            {stats.total} total — {stats.lands} lands, {stats.heroes} heroes, {stats.artifacts} artifacts
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span>📝 {stats.withDesc}/{stats.total} descriptions</span>
          <span>🎨 {stats.withArt}/{stats.total} art</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-neutral-900 p-3 rounded-lg border border-neutral-800">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="bg-neutral-800 text-sm rounded px-2 py-1 border border-neutral-700">
          <option value="all">All Types</option>
          <option value="land">🌍 Lands</option>
          <option value="hero">⚔️ Heroes</option>
          <option value="artifact">🔧 Artifacts</option>
        </select>
        <select value={colorFilter} onChange={e => setColorFilter(e.target.value as any)} className="bg-neutral-800 text-sm rounded px-2 py-1 border border-neutral-700">
          <option value="all">All Colors</option>
          {(Object.keys(CARD_COLORS) as CardColor[]).map(c => (
            <option key={c} value={c}>{CARD_COLORS[c].emoji} {CARD_COLORS[c].label}</option>
          ))}
        </select>
        <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value as any)} className="bg-neutral-800 text-sm rounded px-2 py-1 border border-neutral-700">
          <option value="all">All Rarities</option>
          {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as RarityTier[]).map(r => (
            <option key={r} value={r}>{RARITY_LABELS[r]}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-neutral-800 text-sm rounded px-2 py-1 border border-neutral-700">
          <option value="all">All Status</option>
          <option value="no-description">❌ No Description</option>
          <option value="no-art">❌ No Art</option>
          <option value="complete">✅ Complete</option>
        </select>
        <input
          type="text"
          placeholder="Search name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-neutral-800 text-sm rounded px-3 py-1 border border-neutral-700 w-44"
        />
        <span className="text-xs text-neutral-500 ml-auto">{filteredCards.length} cards</span>
      </div>

      {/* Bulk Actions */}
      <details className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
        <summary className="text-sm font-medium cursor-pointer text-neutral-300">⚡ Bulk Actions</summary>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value as any)} className="bg-neutral-800 text-sm rounded px-2 py-1 border border-neutral-700">
            <option value="description">Generate Descriptions</option>
            <option value="art">Generate Art</option>
          </select>
          <select value={bulkTarget} onChange={e => setBulkTarget(e.target.value as any)} className="bg-neutral-800 text-sm rounded px-2 py-1 border border-neutral-700">
            <option value="missing">Missing only</option>
            <option value="all">All (regenerate)</option>
            <option value="filtered">Current filter ({filteredCards.length})</option>
          </select>
          <span className="text-xs text-neutral-400">
            Will process: {bulkTarget === 'missing' ? filteredCards.filter(c => !c.art_description).length : filteredCards.length} cards
          </span>
          <button
            onClick={runBulkAction}
            disabled={bulkProcessing}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white px-4 py-1 rounded text-sm font-medium"
          >
            {bulkProcessing ? `Processing ${bulkProgress.done}/${bulkProgress.total}...` : 'Run'}
          </button>
        </div>
        {bulkProcessing && (
          <div className="mt-2 w-full bg-neutral-800 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
            />
          </div>
        )}
      </details>

      {/* Card Grid + Detail Panel */}
      <div className="flex gap-4">
        {/* Card List */}
        <div className={`flex-1 ${selectedCard ? 'max-w-[55%]' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredCards.map(card => (
              <button
                key={card.id}
                onClick={() => {
                  setSelectedCard(card);
                  setEditingDesc(false);
                }}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  selectedCard?.id === card.id
                    ? 'border-blue-500 bg-blue-950/30'
                    : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{typeIcon(card.card_type)}</span>
                      <span className="text-sm font-medium truncate">{card.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-neutral-500">#{String(card.card_number).padStart(3, '0')}</span>
                      <span className="text-[10px]">{CARD_COLORS[card.color]?.emoji}</span>
                      <span className={`text-[10px] px-1.5 py-0 rounded ${RARITY_COLORS[card.rarity_tier]?.bg} ${RARITY_COLORS[card.rarity_tier]?.text}`}>
                        {RARITY_LABELS[card.rarity_tier]}
                      </span>
                      {card.hero_class && (
                        <span className="text-[10px] text-neutral-500 capitalize">{card.hero_class}</span>
                      )}
                    </div>
                    {card.card_type === 'hero' && (
                      <div className="text-[10px] text-neutral-400 mt-1">
                        ATK {card.atk} / HP {card.hp} / Cost {card.mana_cost}
                        {card.perk_1_name && <span className="ml-2 text-amber-400">{card.perk_1_name}</span>}
                        {card.perk_2_name && <span className="ml-1 text-amber-400">+ {card.perk_2_name}</span>}
                      </div>
                    )}
                    {card.card_type === 'artifact' && card.ability && (
                      <div className="text-[10px] text-neutral-400 mt-1 truncate">{card.ability}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-[10px]" title={card.art_description ? 'Has description' : 'No description'}>
                      {card.art_description ? '📝' : '⬜'}
                    </span>
                    <span className="text-[10px]" title={card.raw_art_path ? 'Has art' : 'No art'}>
                      {card.raw_art_path ? '🎨' : '⬜'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedCard && (
          <div className="w-[45%] sticky top-20 self-start bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeIcon(selectedCard.card_type)}</span>
                  <h3 className="text-lg font-bold">{selectedCard.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-neutral-500">#{String(selectedCard.card_number).padStart(3, '0')}</span>
                  <span>{CARD_COLORS[selectedCard.color]?.emoji} {CARD_COLORS[selectedCard.color]?.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${RARITY_COLORS[selectedCard.rarity_tier]?.bg} ${RARITY_COLORS[selectedCard.rarity_tier]?.text}`}>
                    {RARITY_LABELS[selectedCard.rarity_tier]}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedCard(null)} className="text-neutral-500 hover:text-neutral-300 text-lg">✕</button>
            </div>

            {/* Hero Details */}
            {selectedCard.card_type === 'hero' && (
              <div className="space-y-2">
                <div className="text-sm text-neutral-400 capitalize">
                  Class: <span className="text-neutral-200">{selectedCard.hero_class}</span>
                  {selectedCard.hero_class && HERO_CLASSES[selectedCard.hero_class] && (
                    <span className="text-neutral-500 ml-2">— {HERO_CLASSES[selectedCard.hero_class].description}</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-neutral-800 rounded p-2">
                    <div className="text-[10px] text-neutral-500">ATK</div>
                    <div className="text-lg font-bold text-red-400">{selectedCard.atk}</div>
                  </div>
                  <div className="bg-neutral-800 rounded p-2">
                    <div className="text-[10px] text-neutral-500">HP</div>
                    <div className="text-lg font-bold text-green-400">{selectedCard.hp}</div>
                  </div>
                  <div className="bg-neutral-800 rounded p-2">
                    <div className="text-[10px] text-neutral-500">COST</div>
                    <div className="text-lg font-bold text-blue-400">{selectedCard.mana_cost}</div>
                  </div>
                </div>
                {selectedCard.perk_1_name && (
                  <div className="bg-neutral-800/50 rounded p-2 text-sm">
                    <span className="text-amber-400 font-medium">{selectedCard.perk_1_name}</span>
                    <span className="text-neutral-500 text-xs ml-2">({selectedCard.perk_1_type})</span>
                    <div className="text-neutral-400 text-xs mt-0.5">{selectedCard.perk_1_desc}</div>
                  </div>
                )}
                {selectedCard.perk_2_name && (
                  <div className="bg-neutral-800/50 rounded p-2 text-sm">
                    <span className="text-amber-400 font-medium">{selectedCard.perk_2_name}</span>
                    <span className="text-neutral-500 text-xs ml-2">({selectedCard.perk_2_type})</span>
                    <div className="text-neutral-400 text-xs mt-0.5">{selectedCard.perk_2_desc}</div>
                  </div>
                )}
              </div>
            )}

            {/* Land Details */}
            {selectedCard.card_type === 'land' && (
              <div className="text-sm text-neutral-400">
                Shape: <span className="text-neutral-200 capitalize">{selectedCard.shape}</span> —
                Material: <span className="text-neutral-200 capitalize">{selectedCard.material}</span>
              </div>
            )}

            {/* Artifact Details */}
            {selectedCard.card_type === 'artifact' && (
              <div className="space-y-2">
                <div className="text-sm text-neutral-400">
                  Type: <span className="text-neutral-200 capitalize">{selectedCard.artifact_subtype}</span> —
                  Cost: <span className="text-neutral-200">{selectedCard.mana_cost} generic</span>
                </div>
                {selectedCard.ability && (
                  <div className="bg-neutral-800/50 rounded p-2 text-sm text-neutral-300">
                    {selectedCard.ability}
                  </div>
                )}
              </div>
            )}

            {/* 3D Card Preview */}
            <div className="bg-neutral-800 rounded-lg overflow-hidden" style={{ aspectRatio: '5/7' }}>
              <SplineCard
                className="w-full h-full"
                cardContent={cardToSplineContent({
                  card_type: selectedCard.card_type,
                  name: selectedCard.name,
                  hero_class: selectedCard.hero_class,
                  perk_1_desc: selectedCard.perk_1_desc,
                  color: selectedCard.color,
                  shape: selectedCard.shape || ('circle' as any),
                  material: selectedCard.material || ('flat' as any),
                  background: selectedCard.background || ('default' as any),
                  mana_color: selectedCard.mana_color || ('yellow' as any),
                  rarity_tier: selectedCard.rarity_tier,
                  atk: selectedCard.atk ?? 0,
                  def: selectedCard.def ?? 0,
                  hp: selectedCard.hp ?? 0,
                  mana_cost: selectedCard.mana_cost ?? 0,
                  ability: selectedCard.ability,
                  card_number: selectedCard.card_number,
                  raw_art_path: selectedCard.raw_art_path,
                })}
              />
            </div>

            {/* Art Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-neutral-300">Art Description</h4>
                <div className="flex gap-1">
                  {selectedCard.art_description && !editingDesc && (
                    <button
                      onClick={() => { setEditingDesc(true); setDescDraft(selectedCard.art_description || ''); }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => generateDescription(selectedCard.id, !!selectedCard.art_description)}
                    disabled={generatingDesc}
                    className="text-xs bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white px-2 py-0.5 rounded"
                  >
                    {generatingDesc ? 'Generating...' : selectedCard.art_description ? 'Regenerate' : 'Generate'}
                  </button>
                </div>
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={descDraft}
                    onChange={e => setDescDraft(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-neutral-200 min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveDescription(selectedCard.id, descDraft)}
                      className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingDesc(false)} className="text-xs text-neutral-400 hover:text-neutral-200">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-neutral-400 bg-neutral-800/50 rounded p-2 min-h-[40px]">
                  {selectedCard.art_description || <span className="italic text-neutral-600">No description yet. Click Generate.</span>}
                </div>
              )}
            </div>

            {/* Art Preview */}
            {selectedCard.raw_art_path && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-neutral-300">Art</h4>
                <div className="bg-neutral-800 rounded overflow-hidden">
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/raw-arts/${selectedCard.raw_art_path.replace(/^raw-arts\//, '')}`}
                    alt={selectedCard.name}
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              </div>
            )}

            {/* Generate Art Button */}
            {selectedCard.art_description && (
              <button
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-700 text-white py-2 rounded text-sm font-medium"
                disabled={generatingDesc}
                onClick={async () => {
                  setGeneratingDesc(true);
                  try {
                    const res = await fetch('/api/generate/art', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        cardId: selectedCard.id,
                        prompt: selectedCard.art_description,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success('Art generated!');
                      await fetchCards();
                      setSelectedCard(prev => prev ? { ...prev, raw_art_path: data.filePath } : null);
                    } else {
                      toast.error(data.error || 'Art generation failed');
                    }
                  } catch (err) {
                    toast.error('Network error generating art');
                  }
                  setGeneratingDesc(false);
                }}
              >
                {generatingDesc ? 'Generating Art...' : selectedCard.raw_art_path ? '🎨 Regenerate Art' : '🎨 Generate Art'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
