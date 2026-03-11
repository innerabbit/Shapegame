'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { BoosterOverlay } from '@/components/booster/booster-overlay';
import { XpTabs } from '@/components/xp/xp-tabs';
import { MintContent } from './mint-content';

type PackType = 'booster' | 'display';

const SHOP_TABS = [
  { id: 'shop', label: 'Shop' },
  { id: 'mint', label: 'NFT Mint' },
];

const PACKS = {
  booster: {
    name: 'Booster Pack',
    icon: '📦',
    cards: 6,
    price: 0.05,
    description: '6 random cards. Guaranteed 1 Rare or better.',
    features: ['6 cards per pack', '1 guaranteed Rare+', 'Chance for Legendary'],
  },
  display: {
    name: 'Display Box',
    icon: '🎁',
    cards: 36,
    price: 0.25,
    description: '6 booster packs (36 cards). Better value, more chances.',
    features: ['6 packs (36 cards)', '6 guaranteed Rare+', 'Bonus foil card', 'Best value'],
  },
} as const;

export function ShopContent() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [selectedPack, setSelectedPack] = useState<PackType>('booster');
  const [quantity, setQuantity] = useState(1);
  const [showBooster, setShowBooster] = useState(false);
  const [showDropRates, setShowDropRates] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');

  const pack = PACKS[selectedPack];
  const total = pack.price * quantity;

  const handleBuy = () => {
    if (!connected) { setVisible(true); return; }
    setShowBooster(true);
  };

  return (
    <>
      <XpTabs tabs={SHOP_TABS} activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'mint' ? (
          <MintContent />
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <fieldset className="xp-groupbox">
                  <legend className="xp-groupbox-legend">Select Pack Type</legend>
                  <div className="space-y-2">
                    {(Object.entries(PACKS) as [PackType, typeof PACKS[PackType]][]).map(
                      ([key, p]) => {
                        const isSelected = selectedPack === key;
                        return (
                          <label
                            key={key}
                            className={`flex items-start gap-3 p-3 border cursor-pointer ${
                              isSelected
                                ? 'border-[#003c74] bg-[#e8f0fe]'
                                : 'border-[#c3c0b6] bg-white hover:bg-[#f5f3ee]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="pack"
                              checked={isSelected}
                              onChange={() => { setSelectedPack(key); setQuantity(1); }}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{p.icon}</span>
                                <span className="text-[12px] font-bold text-[#222]">{p.name}</span>
                                {key === 'display' && (
                                  <span className="text-[9px] bg-[#eab308] text-black px-1.5 py-[1px] font-bold">BEST VALUE</span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#666] mt-1">{p.description}</p>
                              <div className="mt-2 space-y-0.5">
                                {p.features.map((f) => (
                                  <div key={f} className="text-[11px] text-[#444] flex items-center gap-1">
                                    <span className="text-[#22a846]">&#10003;</span>{f}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-[14px] font-bold text-[#003399]">{p.price} SOL</div>
                            </div>
                          </label>
                        );
                      },
                    )}
                  </div>
                </fieldset>
              </div>

              <div className="lg:w-64">
                <fieldset className="xp-groupbox">
                  <legend className="xp-groupbox-legend">Purchase</legend>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-[#222] block mb-1">Quantity:</label>
                      <div className="flex items-center gap-1">
                        <button className="xp-button px-2 py-0" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                        <input type="text" readOnly value={quantity} className="xp-input w-12 text-center" />
                        <button className="xp-button px-2 py-0" onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
                      </div>
                    </div>
                    <div className="border border-[#c3c0b6] bg-[#f5f3ee] p-2 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#666]">{quantity}x {pack.name}</span>
                        <span className="font-bold">{total.toFixed(2)} SOL</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#666]">Cards total</span>
                        <span className="font-bold">{pack.cards * quantity}</span>
                      </div>
                      <div className="border-t border-[#c3c0b6] pt-1 flex justify-between text-[12px]">
                        <span className="font-bold text-[#222]">Total:</span>
                        <span className="font-bold text-[#003399]">{total.toFixed(2)} SOL</span>
                      </div>
                    </div>
                    <button
                      onClick={handleBuy}
                      className={`xp-button w-full py-[5px] text-[12px] font-bold ${connected ? 'xp-button-primary' : ''}`}
                    >
                      {connected ? `🛒 Buy for ${total.toFixed(2)} SOL` : '👛 Connect Wallet to Buy'}
                    </button>
                    <button
                      onClick={() => setShowBooster(true)}
                      className="xp-button w-full py-[5px] text-[12px] text-[#666]"
                    >
                      Test Open Pack
                    </button>
                    {!connected && (
                      <p className="text-[10px] text-[#888] text-center">You need a Solana wallet (Phantom, Solflare)</p>
                    )}
                  </div>
                </fieldset>
              </div>
            </div>

            {/* Collapsible drop rates */}
            <div className="mt-4">
              <button
                onClick={() => setShowDropRates(!showDropRates)}
                className="xp-button px-3 py-[3px] text-[11px] w-full text-left flex items-center gap-1"
              >
                <span>{showDropRates ? '▼' : '▶'}</span>
                <span>Drop Rate Information</span>
              </button>
              {showDropRates && (
                <fieldset className="xp-groupbox mt-2">
                  <legend className="xp-groupbox-legend">What&apos;s Inside a Pack</legend>
                  <div className="xp-listview">
                    <div className="xp-listview-header grid grid-cols-4">
                      <span>Tier</span><span>Material</span><span>Drop Rate</span><span>Probability</span>
                    </div>
                    {[
                      { tier: 'Common', material: 'Flat', chance: '58%', bar: 58, color: '#808080' },
                      { tier: 'Rare', material: '3D', chance: '14%', bar: 14, color: '#3b82f6' },
                      { tier: 'Epic', material: 'Chrome', chance: '3%', bar: 3, color: '#8b5cf6' },
                      { tier: 'Legendary', material: 'Gold', chance: '0.5%', bar: 0.5, color: '#eab308' },
                    ].map(({ tier, material, chance, bar, color }) => (
                      <div key={tier} className="xp-listview-row grid grid-cols-4 items-center">
                        <span className="font-bold" style={{ color }}>{tier}</span>
                        <span>{material}</span>
                        <span>{chance}</span>
                        <div className="xp-progress h-[10px]">
                          <div className="h-full" style={{ width: `${Math.max(2, bar)}%`, background: color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          </>
        )}
      </XpTabs>

      {showBooster && <BoosterOverlay onClose={() => setShowBooster(false)} />}
    </>
  );
}
