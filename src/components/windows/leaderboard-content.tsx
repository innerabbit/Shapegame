'use client';

import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { XpGroupBox } from '@/components/xp';

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

function getRankIcon(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export function LeaderboardContent() {
  const { publicKey } = useWallet();

  const userAddress = useMemo(() => {
    if (!publicKey) return null;
    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  return (
    <div>
      {/* Scoring info */}
      <XpGroupBox label="Scoring">
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <span><span className="font-bold" style={{ color: '#808080' }}>Common</span> = 10 pts</span>
          <span><span className="font-bold" style={{ color: '#3b82f6' }}>Rare</span> = 50 pts</span>
          <span><span className="font-bold" style={{ color: '#8b5cf6' }}>Epic</span> = 200 pts</span>
          <span><span className="font-bold" style={{ color: '#eab308' }}>Legendary</span> = 1000 pts</span>
        </div>
      </XpGroupBox>

      {publicKey && (
        <div className="xp-infobar mt-3">
          <span className="text-lg">👤</span>
          <div>
            <span className="font-bold">Your Rank:</span>{' '}
            <span className="font-mono text-[10px]">{userAddress}</span>{' '}
            <span className="text-[#888]">— Not ranked yet. Buy packs to start collecting!</span>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      <div className="mt-3 flex items-end justify-center gap-3">
        <div className="border border-[#919b9c] bg-[#f5f3ee] p-3 text-center w-28">
          <div className="text-2xl mb-1">🥈</div>
          <div className="font-mono text-[10px] text-[#666]">{MOCK_LEADERS[1].address}</div>
          <div className="text-[13px] font-bold text-[#003399] mt-1">{MOCK_LEADERS[1].score.toLocaleString()}</div>
          <div className="text-[10px] text-[#888]">{MOCK_LEADERS[1].cards} cards</div>
        </div>
        <div className="border-2 border-[#eab308] bg-[#fffbe6] p-3 text-center w-32 -mb-1">
          <div className="text-3xl mb-1">🥇</div>
          <div className="font-mono text-[10px] text-[#666]">{MOCK_LEADERS[0].address}</div>
          {MOCK_LEADERS[0].twitter && <div className="text-[10px] text-[#0066cc]">{MOCK_LEADERS[0].twitter}</div>}
          <div className="text-[14px] font-bold text-[#b8860b] mt-1">{MOCK_LEADERS[0].score.toLocaleString()}</div>
          <div className="text-[10px] text-[#888]">{MOCK_LEADERS[0].cards} cards</div>
        </div>
        <div className="border border-[#919b9c] bg-[#f5f3ee] p-3 text-center w-28">
          <div className="text-2xl mb-1">🥉</div>
          <div className="font-mono text-[10px] text-[#666]">{MOCK_LEADERS[2].address}</div>
          <div className="text-[13px] font-bold text-[#003399] mt-1">{MOCK_LEADERS[2].score.toLocaleString()}</div>
          <div className="text-[10px] text-[#888]">{MOCK_LEADERS[2].cards} cards</div>
        </div>
      </div>

      {/* Full table */}
      <div className="xp-listview mt-4">
        <div className="xp-listview-header grid grid-cols-12 gap-1">
          <span className="col-span-1">Rank</span>
          <span className="col-span-3">Collector</span>
          <span className="col-span-2 text-center">Cards</span>
          <span className="col-span-2 text-center">Legendaries</span>
          <span className="col-span-2 text-center">Completion</span>
          <span className="col-span-2 text-right">Score</span>
        </div>
        {MOCK_LEADERS.map((leader) => (
          <div key={leader.rank} className={`xp-listview-row grid grid-cols-12 gap-1 items-center ${leader.rank <= 3 ? 'font-bold' : ''}`}>
            <span className="col-span-1">{getRankIcon(leader.rank)}</span>
            <div className="col-span-3">
              <span className="font-mono text-[10px]">{leader.address}</span>
              {leader.twitter && <span className="text-[10px] text-[#0066cc] ml-1">{leader.twitter}</span>}
            </div>
            <span className="col-span-2 text-center">{leader.cards}</span>
            <span className="col-span-2 text-center">
              <span style={{ color: '#eab308' }}>{leader.legendaries}</span>
              <span className="text-[#ccc] mx-0.5">/</span>
              <span style={{ color: '#8b5cf6' }}>{leader.epics}</span>
            </span>
            <div className="col-span-2 text-center flex items-center gap-1 justify-center">
              <div className="xp-progress h-[8px] w-14">
                <div className="xp-progress-bar h-full" style={{ width: `${leader.completion}%` }} />
              </div>
              <span className="text-[10px]">{leader.completion}%</span>
            </div>
            <span className="col-span-2 text-right font-bold text-[#003399]">{leader.score.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="xp-infobar mt-4">
        <span className="text-lg">🏗️</span>
        <div>
          <span className="font-bold">Preview Data</span> — Live leaderboard coming soon.
        </div>
      </div>
    </div>
  );
}
