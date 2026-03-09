'use client';

import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Placeholder leaderboard data — will come from Supabase later
const MOCK_LEADERS = [
  { rank: 1, address: '7xKX...mR4p', twitter: '@shape_whale', cards: 142, legendaries: 8, epics: 19, completion: 72.8, score: 14200 },
  { rank: 2, address: 'Gh3P...vN2s', twitter: '@card_hunter', cards: 128, legendaries: 6, epics: 22, completion: 65.6, score: 12800 },
  { rank: 3, address: 'Bx9T...kL7w', twitter: '@solana_shaper', cards: 115, legendaries: 5, epics: 18, completion: 59.0, score: 11500 },
  { rank: 4, address: 'Wy2Q...aP8r', twitter: null, cards: 98, legendaries: 4, epics: 15, completion: 50.3, score: 9800 },
  { rank: 5, address: 'Nz5F...dK3m', twitter: '@nft_grinder', cards: 87, legendaries: 3, epics: 14, completion: 44.6, score: 8700 },
  { rank: 6, address: 'Vm8J...bR6t', twitter: null, cards: 76, legendaries: 3, epics: 11, completion: 39.0, score: 7600 },
  { rank: 7, address: 'Ts4H...xW1n', twitter: '@crypto_cards', cards: 65, legendaries: 2, epics: 9, completion: 33.3, score: 6500 },
  { rank: 8, address: 'Kp6L...eY9c', twitter: null, cards: 54, legendaries: 2, epics: 7, completion: 27.7, score: 5400 },
  { rank: 9, address: 'Rw1D...gZ5j', twitter: '@shape_lord', cards: 43, legendaries: 1, epics: 6, completion: 22.1, score: 4300 },
  { rank: 10, address: 'Ux3M...fQ4h', twitter: null, cards: 31, legendaries: 1, epics: 4, completion: 15.9, score: 3100 },
];

function getRankEmoji(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function getRankStyle(rank: number) {
  if (rank === 1) return 'bg-yellow-950/40 border-yellow-700/50';
  if (rank === 2) return 'bg-neutral-800/60 border-neutral-600/50';
  if (rank === 3) return 'bg-amber-950/30 border-amber-800/40';
  return 'bg-neutral-900/50 border-neutral-800/50';
}

export default function LeaderboardPage() {
  const { publicKey } = useWallet();

  const userAddress = useMemo(() => {
    if (!publicKey) return null;
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          Leaderboard
        </h1>
        <p className="text-neutral-500 max-w-lg mx-auto">
          Top collectors ranked by collection score. Earn points by collecting
          cards — rarer cards give more points.
        </p>
      </div>

      {/* Scoring explanation */}
      <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-neutral-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-500" />
          <span>Common = 10 pts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Rare = 50 pts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Epic = 200 pts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Legendary = 1000 pts</span>
        </div>
      </div>

      {/* Your rank (if connected) */}
      {publicKey && (
        <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 text-sm font-medium">Your Rank</span>
            <span className="font-mono text-xs text-neutral-400">{userAddress}</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-neutral-400">Not ranked yet</div>
            <div className="text-xs text-neutral-600 mt-0.5">Buy packs to start collecting!</div>
          </div>
        </div>
      )}

      {/* Podium — Top 3 */}
      <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto items-end">
        {/* 2nd place */}
        <div className="text-center space-y-2 pb-0">
          <div className="text-3xl">🥈</div>
          <div className="bg-neutral-800/60 border border-neutral-600/50 rounded-xl p-4">
            <div className="font-mono text-xs text-neutral-400">{MOCK_LEADERS[1].address}</div>
            <div className="text-lg font-bold mt-1">{MOCK_LEADERS[1].score.toLocaleString()}</div>
            <div className="text-[10px] text-neutral-600">{MOCK_LEADERS[1].cards} cards</div>
          </div>
        </div>

        {/* 1st place */}
        <div className="text-center space-y-2 pb-4">
          <div className="text-4xl">🥇</div>
          <div className="bg-yellow-950/40 border border-yellow-700/50 rounded-xl p-4 ring-1 ring-yellow-500/20">
            <div className="font-mono text-xs text-yellow-400">{MOCK_LEADERS[0].address}</div>
            {MOCK_LEADERS[0].twitter && (
              <div className="text-[10px] text-blue-400 mt-0.5">{MOCK_LEADERS[0].twitter}</div>
            )}
            <div className="text-xl font-bold mt-1 text-yellow-300">{MOCK_LEADERS[0].score.toLocaleString()}</div>
            <div className="text-[10px] text-neutral-500">{MOCK_LEADERS[0].cards} cards · {MOCK_LEADERS[0].legendaries} legendaries</div>
          </div>
        </div>

        {/* 3rd place */}
        <div className="text-center space-y-2 pb-0">
          <div className="text-3xl">🥉</div>
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
            <div className="font-mono text-xs text-neutral-400">{MOCK_LEADERS[2].address}</div>
            <div className="text-lg font-bold mt-1">{MOCK_LEADERS[2].score.toLocaleString()}</div>
            <div className="text-[10px] text-neutral-600">{MOCK_LEADERS[2].cards} cards</div>
          </div>
        </div>
      </div>

      {/* Full ranking table */}
      <div className="space-y-2">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-neutral-600 font-medium uppercase tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">Collector</div>
          <div className="col-span-2 text-center">Cards</div>
          <div className="col-span-2 text-center">Legendaries</div>
          <div className="col-span-2 text-center">Completion</div>
          <div className="col-span-2 text-right">Score</div>
        </div>

        {/* Rows */}
        {MOCK_LEADERS.map((leader) => (
          <div
            key={leader.rank}
            className={`
              grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-lg border transition-colors
              ${getRankStyle(leader.rank)}
              ${leader.rank <= 3 ? '' : 'hover:bg-neutral-800/70'}
            `}
          >
            <div className="col-span-1 font-bold text-sm">
              {getRankEmoji(leader.rank)}
            </div>
            <div className="col-span-3 min-w-0">
              <div className="font-mono text-sm truncate">{leader.address}</div>
              {leader.twitter && (
                <div className="text-[10px] text-blue-400 mt-0.5">{leader.twitter}</div>
              )}
            </div>
            <div className="col-span-2 text-center font-mono text-sm">
              {leader.cards}
            </div>
            <div className="col-span-2 text-center">
              <span className="font-mono text-sm text-yellow-400">{leader.legendaries}</span>
              <span className="text-neutral-700 mx-1">/</span>
              <span className="font-mono text-xs text-purple-400">{leader.epics}</span>
            </div>
            <div className="col-span-2 text-center">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                    style={{ width: `${leader.completion}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-neutral-400">{leader.completion}%</span>
              </div>
            </div>
            <div className="col-span-2 text-right">
              <span className="font-bold text-sm">{leader.score.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state / Coming soon */}
      <div className="text-center py-8 border border-dashed border-neutral-800 rounded-xl">
        <span className="text-3xl mb-2 block">🏗️</span>
        <p className="text-neutral-500 text-sm">
          Live leaderboard coming soon. Data shown above is a preview.
        </p>
        <p className="text-neutral-600 text-xs mt-1">
          Rankings will update in real-time as collectors open packs and trade cards.
        </p>
      </div>
    </div>
  );
}
