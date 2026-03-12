'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

export interface OwnedCardDetails {
  card_number: number;
  card_type: string | null;
  name: string | null;
  shape: string;
  material: string;
  rarity_tier: string;
  mana_color: string;
  color: string | null;
  hero_class: string | null;
  atk: number;
  hp: number;
  mana_cost: number;
  perk_1_name: string | null;
  perk_1_desc: string | null;
  ability: string | null;
  raw_art_path: string | null;
  processed_card_path: string | null;
  thumb_path: string | null;
}

interface OwnedCard {
  id: string;
  card_id: string;
  source: string;
  pack_id: string | null;
  opened_at: string;
  cards: OwnedCardDetails;
}

export function useUserCards() {
  const { user, isAuthenticated } = useAuth();
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
  const [ownedCardNumbers, setOwnedCardNumbers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchCards = useCallback(async () => {
    if (!user) {
      setOwnedCards([]);
      setOwnedCardNumbers(new Set());
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_cards')
      .select('*, cards(card_number, card_type, name, shape, material, rarity_tier, mana_color, color, hero_class, atk, hp, mana_cost, perk_1_name, perk_1_desc, ability, raw_art_path, processed_card_path, thumb_path)')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch user cards:', error);
      setIsLoading(false);
      return;
    }

    setOwnedCards(data || []);
    setOwnedCardNumbers(
      new Set((data || []).map((uc: OwnedCard) => uc.cards?.card_number).filter(Boolean))
    );
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCards();
    } else {
      setOwnedCards([]);
      setOwnedCardNumbers(new Set());
    }
  }, [isAuthenticated, fetchCards]);

  return { ownedCards, ownedCardNumbers, isLoading, refetch: fetchCards };
}
