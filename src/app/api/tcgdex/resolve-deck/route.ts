import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { PTCGL_SET_MAP, getQuickCardImage } from '@/lib/deckParser';
import { resolveLimitlessCardImage, getLimitlessCardImageSync } from '@/lib/limitlessResolver';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawCards = body.cards;

    if (!Array.isArray(rawCards) || rawCards.length === 0) {
      return NextResponse.json({ cards: [] });
    }

    // Cache of name -> tcgdex image during this request to avoid duplicate requests
    const imageCache = new Map<string, string>();

    const enrichedCards = await Promise.all(
      rawCards.map(async (c: any) => {
        const cardName = (c.name || c.card_name || '').trim();
        const set = (c.set || c.expansion || '').trim().toUpperCase();
        const number = (c.number || '').trim();
        let imageUrl = c.image || c.image_url;

        // 1. Cross-reference with store inventory first
        let storeCard = null;
        try {
          storeCard = db.prepare(`
            SELECT id, name, expansion, number, version, language, price, stock, image_url
            FROM cards
            WHERE name LIKE ? AND stock > 0
            ORDER BY price ASC
            LIMIT 1
          `).get(`%${cardName}%`) as any;
        } catch (_) {}

        // 2. LIMITLESS TCG EXACT MATCHING (Standard for PTCGL - Highest fidelity)
        let resolvedLimitless = getLimitlessCardImageSync(set, number);
        if (!resolvedLimitless) {
          resolvedLimitless = await resolveLimitlessCardImage(set, number);
        }

        if (resolvedLimitless) {
          imageUrl = resolvedLimitless;
        } else {
          // Direct quick CDN candidate
          const quickImg = getQuickCardImage(set, number);
          if (quickImg) {
            imageUrl = quickImg;
          }
        }

        // 3. If in store and no verified image yet, use store image
        if ((!imageUrl || imageUrl.includes('placeholder')) && storeCard?.image_url) {
          imageUrl = storeCard.image_url;
        }

        // 5. Fallback search by card name on TCGdex matching localId
        if (!imageUrl || imageUrl.includes('placeholder')) {
          const cleanSearchName = cardName.replace(/\s+ex$/i, '').trim();
          if (imageCache.has(`${cleanSearchName}:${number}`)) {
            imageUrl = imageCache.get(`${cleanSearchName}:${number}`);
          } else {
            try {
              const tcgdexRes = await fetch(
                `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(cleanSearchName)}`,
                { cache: 'force-cache' }
              );
              if (tcgdexRes.ok) {
                const list = await tcgdexRes.json();
                if (Array.isArray(list)) {
                  // Strictly filter out Pokemon Pocket (tcgp) sets
                  const validList = list.filter((item: any) => {
                    const dash = item.id ? item.id.lastIndexOf('-') : -1;
                    const setId = dash !== -1 ? item.id.substring(0, dash).toLowerCase() : '';
                    return !(/^[ab]\d/i.test(setId) || setId === 'p-a' || setId === 'tcgp');
                  });

                  // Prefer exact number match
                  const exactNumMatch = validList.find(
                    (item: any) =>
                      item.image &&
                      (item.localId === number ||
                        item.localId === number.padStart(3, '0') ||
                        item.localId.replace(/^0+/, '') === number.replace(/^0+/, ''))
                  );
                  if (exactNumMatch) {
                    imageUrl = `${exactNumMatch.image}/high.webp`;
                    imageCache.set(`${cleanSearchName}:${number}`, imageUrl);
                  } else {
                    const matchWithImg = validList.find((item: any) => item.image);
                    if (matchWithImg) {
                      imageUrl = `${matchWithImg.image}/high.webp`;
                      imageCache.set(`${cleanSearchName}:${number}`, imageUrl);
                    }
                  }
                }
              }
            } catch (_) {}
          }
        }

        return {
          ...c,
          card_name: cardName,
          expansion: set || 'PROMO',
          number: number || '1',
          image_url: imageUrl || '/placeholder-card.svg',
          store_available: Boolean(storeCard && storeCard.stock > 0),
          store_card: storeCard || null,
        };
      })
    );

    return NextResponse.json({ cards: enrichedCards });
  } catch (error: any) {
    console.error('Error resolving deck cards:', error);
    return NextResponse.json({ error: 'Error resolving deck' }, { status: 500 });
  }
}
