'use client';

import { useEffect, useState } from 'react';
import { generateAllCards, type SeedCard } from '@/lib/cards/generate-seed';

interface UseCardsResult {
  cards: SeedCard[];
  loading: boolean;
  source: 'api' | 'local';
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches cards from the API with fallback to local generation.
 * Admin pages should use this to get real DB data when available.
 */
export function useCards(): UseCardsResult {
  const [cards, setCards] = useState<SeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const [error, setError] = useState<string | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cards');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCards(data);
          setSource('api');
          setLoading(false);
          return;
        }
      }
    } catch {
      // API not available, use local fallback
    }

    // Fallback to local generation
    setCards(generateAllCards());
    setSource('local');
    setError('Using local data (DB not available)');
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, []);

  return { cards, loading, source, error, refetch: fetchCards };
}
