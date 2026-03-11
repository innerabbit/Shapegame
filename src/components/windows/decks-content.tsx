'use client';

export function DecksContent() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center py-8 text-center">
        <span className="text-5xl mb-4">📋</span>
        <h2 className="text-[14px] font-bold text-[#003399] mb-2">Deck Builder</h2>
        <p className="text-[11px] text-[#666] max-w-sm mb-4">
          Build custom decks of 30 cards for battles. Combine different shapes,
          materials, and abilities to create powerful strategies.
        </p>
      </div>

      <div className="xp-infobar">
        <span className="text-lg">🏗️</span>
        <div>
          <span className="font-bold">Coming Soon</span> — Deck building will be available
          in the next update. Collect cards now to be ready!
        </div>
      </div>

      {/* Mock deck UI */}
      <fieldset className="xp-groupbox">
        <legend className="xp-groupbox-legend">New Deck</legend>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-[#222] block mb-1">Deck Name:</label>
            <input type="text" placeholder="My First Deck" className="xp-input w-full" disabled />
          </div>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[5/7] border border-dashed border-[#919b9c] bg-[#f5f3ee] flex items-center justify-center text-[#c3c0b6] text-lg"
              >
                +
              </div>
            ))}
          </div>
          <div className="text-[10px] text-[#888] text-center">0 / 30 cards</div>
          <button className="xp-button w-full py-[3px] text-[11px]" disabled>
            Save Deck
          </button>
        </div>
      </fieldset>
    </div>
  );
}
