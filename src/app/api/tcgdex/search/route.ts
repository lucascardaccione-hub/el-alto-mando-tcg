import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// In-memory cache for all official Pokémon TCG sets
let cachedSetsMap: Map<string, string> | null = null;

// Sets that are strictly Pokémon Pocket (tcgp) - NEVER allowed in TCG Live
export function isPocketSet(setId: string): boolean {
  if (!setId) return false;
  const lower = setId.toLowerCase().trim();
  // Pocket sets in TCGdex start with 'a' or 'b' followed by numbers (e.g. A1, A1a, A2, A2b, B1, B1a, B2), or 'p-a', or 'tcgp'
  if (/^[ab]\d/i.test(lower)) return true;
  if (lower === 'p-a' || lower === 'tcgp') return true;
  return false;
}

// Official Standard sets for Pokémon TCG Live
const STANDARD_SET_IDS = new Set([
  // Mega Evolution Series
  'mee', 'mep', 'me01', 'me02', 'me02.5', 'me03', 'me04', 'me05', '30th', '30th-c',
  // Scarlet & Violet Series
  'svp', 'sve', 'sv01', 'sv02', 'sv03', 'sv03.5', 'sv04', 'sv04.5', 'sv05', 'sv06',
  'sv06.5', 'sv07', 'sv08', 'sv08.5', 'sv09', 'sv10', 'sv10.5w', 'sv10.5b', 'mfb',
  // Sword & Shield (Standard Legal / Regulation F in Live)
  'swsh9', 'swsh9tg', 'swsh10', 'swsh10tg', 'swsh10.5', 'swsh11', 'swsh11tg',
  'swsh12', 'swsh12tg', 'swsh12.5', 'swsh12.5gg', 'swshp',
]);

export function isStandardSet(setId: string): boolean {
  if (!setId) return false;
  const lower = setId.toLowerCase().trim();
  if (isPocketSet(lower)) return false;
  return (
    STANDARD_SET_IDS.has(lower) ||
    lower.startsWith('sv') ||
    lower.startsWith('me')
  );
}

async function getSetsMap(): Promise<Map<string, string>> {
  if (cachedSetsMap && cachedSetsMap.size > 50) {
    return cachedSetsMap;
  }

  const map = new Map<string, string>();

  // 1. First try reading local disk cache (fast, reliable, 0ms)
  try {
    const cachePath = path.join(process.cwd(), 'data', 'sets_cache.json');
    if (fs.existsSync(cachePath)) {
      const raw = fs.readFileSync(cachePath, 'utf8');
      const sets = JSON.parse(raw);
      if (Array.isArray(sets)) {
        for (const s of sets) {
          if (s.id && s.name && !isPocketSet(s.id)) {
            map.set(s.id.toLowerCase().trim(), s.name.trim());
          }
        }
        if (map.size > 50) {
          cachedSetsMap = map;
          return map;
        }
      }
    }
  } catch (e) {
    console.error('Error reading local sets cache:', e);
  }

  // 2. Fetch from TCGdex API
  try {
    const res = await fetch('https://api.tcgdex.net/v2/en/sets', { cache: 'no-store' });
    if (res.ok) {
      const sets = await res.json();
      if (Array.isArray(sets)) {
        for (const s of sets) {
          if (s.id && s.name && !isPocketSet(s.id)) {
            map.set(s.id.toLowerCase().trim(), s.name.trim());
          }
        }
        cachedSetsMap = map;
        try {
          const cachePath = path.join(process.cwd(), 'data', 'sets_cache.json');
          fs.writeFileSync(cachePath, JSON.stringify(sets));
        } catch (_) {}
        return map;
      }
    }
  } catch (e) {
    console.error('Error fetching sets from TCGdex:', e);
  }

  return cachedSetsMap || map;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const lang = searchParams.get('lang') || 'en';
    const format = searchParams.get('format') || 'Standard';

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const setsMap = await getSetsMap();
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

    // Identify candidate primary name:
    // Filter out numeric tokens to search by the Pokémon name first
    const nonNumericTokens = tokens.filter((t) => !/^\d+$/.test(t) && !/^\d+\/\d+$/.test(t));
    const primaryName = nonNumericTokens.length > 0 ? nonNumericTokens[0] : tokens[0];

    // Query TCGdex by primary name
    let cards: any[] = [];
    try {
      let res = await fetch(`https://api.tcgdex.net/v2/${lang}/cards?name=${encodeURIComponent(primaryName)}`, {
        cache: 'no-store',
      });
      if (!res.ok && lang !== 'en') {
        res = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(primaryName)}`, {
          cache: 'no-store',
        });
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          cards = data;
        }
      }
    } catch (e) {
      console.error('TCGdex cards fetch error:', e);
    }

    // If query was multi-word and primaryName returned nothing, try full query directly
    if (cards.length === 0) {
      try {
        let res = await fetch(`https://api.tcgdex.net/v2/${lang}/cards?name=${encodeURIComponent(query)}`, {
          cache: 'no-store',
        });
        if (!res.ok && lang !== 'en') {
          res = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(query)}`, {
            cache: 'no-store',
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            cards = data;
          }
        }
      } catch (e) {}
    }

    // Score and filter cards according to all user tokens (Name + Expansion + Number)
    const scoredCards: { card: any; score: number; matchCount: number; setName: string }[] = [];

    for (const c of cards) {
      const dashIdx = c.id ? c.id.lastIndexOf('-') : -1;
      const setId = dashIdx !== -1 ? c.id.substring(0, dashIdx).toLowerCase() : '';

      // 1. STRICT EXCLUSION: Never allow Pokemon Pocket sets (Crimson Blaze, Genetic Apex, etc.)
      if (isPocketSet(setId)) {
        continue;
      }

      // 2. Format Filter: Default to Standard format (TCG Live official)
      if (format === 'Standard' && !isStandardSet(setId)) {
        continue;
      }

      const setName = setsMap.get(setId) || setId;
      const cardNameLower = (c.name || '').toLowerCase();
      const localIdLower = (c.localId || '').toLowerCase();
      const setNameLower = setName.toLowerCase();

      let matchCount = 0;
      let score = 0;

      for (const t of tokens) {
        let matched = false;

        // Exact match on card number (e.g. "199", "168", "004", "98", "1")
        if (localIdLower === t || localIdLower === t.padStart(3, '0') || localIdLower.includes(t)) {
          score += 25;
          if (localIdLower === t) score += 10;
          matched = true;
        }

        // Match on card name
        if (cardNameLower.includes(t)) {
          score += 15;
          if (cardNameLower === t) score += 10;
          matched = true;
        }

        // Match on set / expansion name or setId (e.g. "151", "dragon", "twilight", "sv06")
        if (setNameLower.includes(t) || setId.includes(t)) {
          score += 20;
          if (setNameLower === t) score += 15;
          matched = true;
        }

        if (matched) matchCount++;
      }

      if (matchCount > 0) {
        // Boost cards that match ALL query tokens
        if (tokens.length > 1 && matchCount === tokens.length) {
          score += 100;
        }
        scoredCards.push({ card: c, score, matchCount, setName });
      }
    }

    // Sort by score descending
    scoredCards.sort((a, b) => b.score - a.score);

    // If multi-token query (e.g. "Charmander Dragon", "Charmander 151"),
    // return cards matching ALL tokens if available
    const fullMatches = scoredCards.filter((s) => s.matchCount === tokens.length);
    const finalPool = tokens.length > 1 && fullMatches.length > 0 ? fullMatches : scoredCards;

    // Helper to resolve card image
    const resolveCardImage = (c: any) => {
      if (c.image) {
        return `${c.image}/high.webp`;
      }
      return null;
    };

    // Return top 24 results with setName and image
    const results = finalPool.slice(0, 24).map(({ card, setName }) => ({
      id: card.id,
      localId: card.localId,
      name: card.name,
      setName: setName || 'Colección TCG',
      image: resolveCardImage(card),
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Intelligent TCGdex search error:', error);
    return NextResponse.json({ results: [] });
  }
}
