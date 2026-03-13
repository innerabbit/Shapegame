'use client';

import { useState } from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          background: 'none',
          border: 'none',
          borderBottom: '1px solid #d4d0c8',
          padding: '6px 4px',
          cursor: 'pointer',
          fontFamily: 'Tahoma, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          color: '#003399',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 10, width: 12, flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
        {title}
      </button>
      {open && (
        <div style={{ padding: '6px 8px 8px 16px', fontSize: 11, lineHeight: 1.5 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MiniTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table style={{
      borderCollapse: 'collapse',
      width: '100%',
      margin: '6px 0',
      fontSize: 11,
    }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={{
              background: '#e8e8e0',
              border: '1px solid #c0c0b0',
              padding: '3px 6px',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: 10,
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} style={{
                border: '1px solid #d4d4cc',
                padding: '2px 6px',
                fontSize: 11,
              }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FaqContent() {
  return (
    <div style={{
      fontFamily: 'Tahoma, sans-serif',
      fontSize: 11,
      color: '#000',
      background: '#fff',
      height: '100%',
      overflow: 'auto',
    }}>
      {/* Header bar — XP Help style */}
      <div style={{
        background: 'linear-gradient(180deg, #6b89c4 0%, #3a5da0 100%)',
        padding: '6px 10px',
        color: '#fff',
        fontSize: 13,
        fontWeight: 700,
        borderBottom: '1px solid #2a4080',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 16 }}>?</span>
        THE SHAPE GAME — FAQ & Tokenomics
      </div>

      <div style={{ padding: '4px 6px' }}>
        {/* TOKEN — $SHAPEGAME */}
        <Section title="$SHAPEGAME Token" defaultOpen>
          <p style={{ margin: '0 0 6px' }}>
            <strong>$SHAPEGAME</strong> — the native token of The Shape Game ecosystem.
          </p>

          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Revenue Distribution</p>
          <MiniTable
            headers={['Allocation', 'Share', 'Description']}
            rows={[
              ['Token Buyback', '50%', 'Half of all profits used to buy back $SHAPEGAME from the market'],
              ['Prize Fund', '40%', 'Distributed as rewards to tournament winners & top players'],
              ['Team & Development', '10%', 'Ongoing development, servers, infrastructure'],
            ]}
          />

          <p style={{ margin: '6px 0 0', color: '#666', fontSize: 10 }}>
            Buybacks create constant demand pressure. Prize fund incentivizes competitive play.
          </p>
        </Section>

        {/* CARD ECONOMY */}
        <Section title="Card Economy" defaultOpen>
          <p style={{ margin: '0 0 6px' }}>
            <strong>The Shape Game</strong> is a free-to-play collectible card game on the <strong>Shape Network</strong>. All cards are NFTs minted on-chain.
          </p>

          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Total Supply</p>
          <MiniTable
            headers={['Category', 'Count']}
            rows={[
              ['Lands (Shapes)', '35'],
              ['Heroes (Creatures)', '80'],
              ['Artifacts (Equipment)', '10'],
              ['Total Unique Cards', '125'],
            ]}
          />

          <p style={{ margin: '6px 0 4px', fontWeight: 600 }}>Boosters</p>
          <ul style={{ margin: '2px 0', paddingLeft: 16 }}>
            <li><strong>6 cards</strong> per booster pack</li>
            <li>Slots 1-3: Lands (random color & rarity)</li>
            <li>Slots 4-5: Heroes (random color & rarity)</li>
            <li>Slot 6: Guaranteed <strong>Rare+</strong> hero or artifact</li>
            <li>1 Display = 10 boosters = 60 cards</li>
          </ul>

          <p style={{ margin: '6px 0 4px', fontWeight: 600 }}>Free Mint</p>
          <p style={{ margin: 0 }}>
            Each booster is a <strong>free mint NFT</strong> on Shape Network. Open your booster to reveal 6 cards — each card becomes an individual NFT in your collection.
          </p>

          <p style={{ margin: '6px 0 4px', fontWeight: 600 }}>Rarity & Drop Rates</p>
          <MiniTable
            headers={['Rarity', 'Drop Rate', 'Material']}
            rows={[
              ['Common', '~50%', 'Flat (2D solid color)'],
              ['Uncommon', '~25%', 'Gradient / Textured'],
              ['Rare', '~15%', '3D Rendered'],
              ['Epic', '~7%', 'Chrome'],
              ['Legendary', '~3%', 'Gold'],
            ]}
          />
        </Section>

        {/* HOW TO PLAY */}
        <Section title="How to Play" defaultOpen>
          <p style={{ margin: '0 0 6px' }}>
            The Shape Game is a 1v1 card battle game inspired by Magic: The Gathering, set in <strong>Detroit, 1996</strong>.
          </p>
          <ol style={{ margin: '2px 0', paddingLeft: 18, lineHeight: 1.6 }}>
            <li>Each player starts with <strong>20 HP</strong> and a <strong>30-card deck</strong></li>
            <li>Draw a starting hand of <strong>4 cards</strong></li>
            <li>Each turn: draw 1 card, play 1 land</li>
            <li>Lands generate <strong>mana</strong> (colored energy)</li>
            <li>Spend mana to summon <strong>heroes</strong> to the battlefield</li>
            <li>Heroes can <strong>attack</strong> next turn (unless they have Haste)</li>
            <li>Defender chooses who <strong>blocks</strong> — unblocked damage hits the player</li>
            <li>Reduce your opponent to <strong>0 HP</strong> to win!</li>
          </ol>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 10 }}>
            Mulligan: free redraw if your starting hand has no lands. If your deck runs empty, you lose.
          </p>
        </Section>

        {/* CARD TYPES */}
        <Section title="Card Types">
          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Lands (Shapes) — 35 unique</p>
          <p style={{ margin: '0 0 6px' }}>
            Mana sources. Play 1 per turn. 5 colors × 5 materials = 25 base lands + 10 dual lands.
            Each land comes in 5 visual shapes (Circle, Hexagon, Diamond, Star, Triangle) — purely cosmetic NFT variety.
          </p>

          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Heroes (Creatures) — 80 unique</p>
          <p style={{ margin: '0 0 4px' }}>
            Units with ATK and HP. Summon them by paying mana. Each has 1-2 special abilities (perks).
          </p>
          <MiniTable
            headers={['Color', 'Class', 'Style']}
            rows={[
              ['🟡 Yellow', 'Preachers', 'Defense, heals, buffs'],
              ['🔵 Blue', 'Hackers', 'Control, manipulation'],
              ['⚫ Black', 'Gangsters', 'Damage, sacrifice, debuffs'],
              ['🔴 Red', 'Artists', 'Aggression, AoE, chaos'],
              ['🟢 Green', 'Athletes', 'Big stats, growth'],
            ]}
          />

          <p style={{ margin: '6px 0 4px', fontWeight: 600 }}>Artifacts (⚪ White) — 10 unique</p>
          <p style={{ margin: 0 }}>
            Colorless equipment and consumables. Cost generic mana — fit any deck.
            Equipment attaches to a hero (max 1), consumables are one-time effects.
          </p>
        </Section>

        {/* MANA COLORS */}
        <Section title="Mana Colors">
          <MiniTable
            headers={['Color', 'Archetype', 'Role']}
            rows={[
              ['🟡 Yellow', 'Faith / Order', 'Defense, healing, buffs'],
              ['🔵 Blue', 'Tech / Control', 'Control, card manipulation'],
              ['⚫ Black', 'Street / Power', 'Direct damage, sacrifice, debuffs'],
              ['🔴 Red', 'Art / Chaos', 'Aggression, AoE, chaotic effects'],
              ['🟢 Green', 'Sport / Force', 'Big creatures, stat growth'],
              ['⚪ White', 'Artifacts', 'Colorless equipment & weapons'],
            ]}
          />
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 10 }}>
            White is special — artifacts have no color and cost generic mana, so they work in any deck.
          </p>
        </Section>

        {/* DECK BUILDING */}
        <Section title="Deck Building">
          <MiniTable
            headers={['Type', 'Count', 'Note']}
            rows={[
              ['Lands', '10-12', '~1/3 of deck'],
              ['Heroes', '15-18', 'Main roster'],
              ['Artifacts', '0-4', 'Optional colorless gear'],
              ['Total', '30', 'Fixed deck size'],
            ]}
          />
          <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
            <li>Max <strong>2 copies</strong> of any card (lands: up to 4 copies)</li>
            <li><strong>Mono-color</strong>: maximum synergy, stable mana</li>
            <li><strong>Multi-color</strong>: more combos, need dual lands for mana fixing</li>
            <li>Common heroes cost 1 generic mana (any color) — reduces mana screw</li>
          </ul>
        </Section>

        {/* HERO STATS */}
        <Section title="Hero Stats & Costs">
          <MiniTable
            headers={['Rarity', 'Perks', 'Avg Stats', 'Mana Cost']}
            rows={[
              ['Common', '1 (basic)', '1-2 ATK / 1-3 HP', '1-2 mana'],
              ['Uncommon', '1 (improved)', '2-3 ATK / 2-4 HP', '2-3 mana'],
              ['Rare', '1-2', '3-4 ATK / 3-5 HP', '3-4 mana'],
              ['Epic', '2', '4-5 ATK / 4-6 HP', '4-5 mana'],
              ['Legendary', '2 (powerful)', '5-6 ATK / 5-7 HP', '5-6 mana'],
            ]}
          />
        </Section>

        {/* ARTIFACTS */}
        <Section title="Artifacts List">
          <MiniTable
            headers={['Name', 'Type', 'Rarity', 'Effect']}
            rows={[
              ['Switchblade', 'Equipment', 'Common', '+1 ATK to equipped hero'],
              ['Bandana', 'Equipment', 'Common', '+1 HP to equipped hero'],
              ['Glock', 'Consumable', 'Uncommon', '2 damage to random enemy'],
              ['Boombox', 'Equipment', 'Uncommon', 'All allies +0/+1'],
              ['Kevlar Vest', 'Equipment', 'Rare', 'Incoming damage -1 (min 1)'],
              ['Chains', 'Consumable', 'Rare', 'Enemy hero can\'t attack 1 turn'],
              ['Molotov', 'Consumable', 'Epic', '2 damage to ALL enemy heroes'],
              ['Gold Chain', 'Equipment', 'Epic', '+1 mana any color each turn'],
              ['Sawed-Off', 'Equipment', 'Legendary', 'Deals base ATK twice'],
              ['Crown', 'Equipment', 'Legendary', '+2/+2, untargetable by perks'],
            ]}
          />
        </Section>

        {/* SETTING */}
        <Section title="Setting & Lore">
          <p style={{ margin: 0 }}>
            <strong>Detroit, 1996.</strong> Everything is filmed on a VHS camera — grainy footage, warm colors, film noise.
            African-American community — streets, churches, basements, gyms, recording studios.
            A card game born within this world.
          </p>
        </Section>

        <div style={{
          textAlign: 'center',
          padding: '8px 0 12px',
          color: '#999',
          fontSize: 10,
        }}>
          theshapegame.app — Built on Shape Network
        </div>
      </div>
    </div>
  );
}
