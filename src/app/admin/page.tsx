'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCards } from '@/lib/hooks/use-cards';
import {
  RARITY_LABELS,
  RARITY_COLORS,
  MANA_COLORS,
  WAVES,
} from '@/lib/constants';

export default function AdminDashboard() {
  const { cards, loading, source, refetch } = useCards();
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const totalCards = cards.length;

  // Stats
  const byStatus: Record<string, number> = {};
  const byRarity: Record<string, number> = {};
  const byWave: Record<number, number> = {};
  const byMana: Record<string, number> = {};

  for (const card of cards) {
    byStatus[card.gen_status] = (byStatus[card.gen_status] || 0) + 1;
    byRarity[card.rarity_tier] = (byRarity[card.rarity_tier] || 0) + 1;
    byWave[card.wave] = (byWave[card.wave] || 0) + 1;
    byMana[card.mana_color] = (byMana[card.mana_color] || 0) + 1;
  }

  const approvedCount = (byStatus['approved'] || 0) + (byStatus['compositing'] || 0) + (byStatus['finalized'] || 0);
  const finalizedCount = byStatus['finalized'] || 0;

  // ── Seed database ─────────────────────────────────
  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/cards/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedResult(`✅ Seeded ${data.inserted} cards`);
        refetch();
      } else {
        setSeedResult(`⚠️ ${data.error}`);
      }
    } catch (e) {
      setSeedResult(`❌ Network error`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-neutral-400 mt-1">
            Overview of the generation pipeline — {totalCards} cards total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              source === 'api' ? 'bg-green-500' :
              loading ? 'bg-yellow-500 animate-pulse' :
              'bg-neutral-600'
            }`} />
            <span className="text-xs text-neutral-500">
              {loading ? 'Loading...' :
               source === 'api' ? 'Supabase connected' :
               'Using local data'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/images">
          <Button variant="outline" className="bg-neutral-900 border-neutral-700 hover:bg-neutral-800">
            Start Reviewing Images &rarr;
          </Button>
        </Link>
        <Link href="/admin/cards">
          <Button variant="outline" className="bg-neutral-900 border-neutral-700 hover:bg-neutral-800">
            Card Compositing &rarr;
          </Button>
        </Link>
        <Link href="/open">
          <Button variant="outline" className="bg-amber-900/30 border-amber-800 text-amber-400 hover:bg-amber-900/50">
            3D Booster Preview
          </Button>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {source === 'local' && (
            <Button
              variant="outline"
              className="bg-blue-900/30 border-blue-700 text-blue-300 hover:bg-blue-900/50"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? 'Seeding...' : '🌱 Seed Database'}
            </Button>
          )}
          {seedResult && (
            <span className="text-xs text-neutral-400">{seedResult}</span>
          )}
        </div>
      </div>

      {/* Pipeline Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Stage 1: Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{approvedCount}/{totalCards}</div>
            <Progress value={totalCards > 0 ? (approvedCount / totalCards) * 100 : 0} className="mt-2 h-2" />
            <p className="text-xs text-neutral-500 mt-1">
              Arts approved for compositing
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Stage 2: Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{finalizedCount}/{totalCards}</div>
            <Progress value={totalCards > 0 ? (finalizedCount / totalCards) * 100 : 0} className="mt-2 h-2" />
            <p className="text-xs text-neutral-500 mt-1">
              Cards composited & finalized
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">
              Stage 3: Promo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0/{totalCards}</div>
            <Progress value={0} className="mt-2 h-2" />
            <p className="text-xs text-neutral-500 mt-1">
              Promo content generated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wave Progress */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base">Generation Waves</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {([1, 2, 3, 4] as const).map((waveNum) => {
            const waveInfo = WAVES[waveNum];
            const waveTotal = byWave[waveNum] || 0;
            const waveApproved = cards.filter(
              (c) => c.wave === waveNum && ['approved', 'compositing', 'finalized'].includes(c.gen_status)
            ).length;

            return (
              <div key={waveNum}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{waveInfo.label}</span>
                  <span className="text-neutral-400">
                    {waveApproved}/{waveTotal}
                  </span>
                </div>
                <Progress value={waveTotal > 0 ? (waveApproved / waveTotal) * 100 : 0} className="h-2" />
                <p className="text-xs text-neutral-500 mt-0.5">{waveInfo.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Rarity */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-base">By Rarity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(['common', 'rare', 'epic', 'legendary'] as const).map((rarity) => (
                <div key={rarity} className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`${RARITY_COLORS[rarity].bg} ${RARITY_COLORS[rarity].text} ${RARITY_COLORS[rarity].border}`}
                  >
                    {RARITY_LABELS[rarity]}
                  </Badge>
                  <span className="text-sm font-mono">{byRarity[rarity] || 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Mana Color */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-base">By Mana Color</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(['red', 'blue', 'green', 'white', 'gold', 'chrome'] as const).map((color) => (
                <div key={color} className="flex items-center justify-between">
                  <span className="text-sm">
                    {MANA_COLORS[color].emoji} {MANA_COLORS[color].label}
                  </span>
                  <span className="text-sm font-mono">{byMana[color] || 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
