'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';

interface OwnedCard {
  id: string;
  card_id: string;
  source: string;
  pack_id: string | null;
  opened_at: string;
  cards: {
    card_number: number;
    shape: string;
    material: string;
    rarity_tier: string;
    [key: string]: unknown;
  };
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
      .select('*, cards(card_number, shape, material, rarity_tier)')
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
