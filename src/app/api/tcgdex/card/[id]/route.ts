import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id;
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';

    // Fetch the card data in the requested language
    let res = await fetch(`https://api.tcgdex.net/v2/${lang}/cards/${encodeURIComponent(cardId)}`);
    if (!res.ok && lang !== 'en') {
      res = await fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(cardId)}`);
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Card not found on TCGdex' }, { status: 404 });
    }

    const data = await res.json();

    // ALWAYS ensure expansion name is in English as requested by user
    let englishExpansion = data.set?.name;
    if (lang !== 'en') {
      try {
        const enRes = await fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(cardId)}`);
        if (enRes.ok) {
          const enData = await enRes.json();
          if (enData.set?.name) {
            englishExpansion = enData.set.name;
          }
        }
      } catch (e) {
        // Fallback to data.set?.name if English fetch fails
      }
    }

    // Resolve image with fallback to pokemontcg.io if missing in TCGdex
    let resolvedImage = data.image ? `${data.image}/high.webp` : null;
    if (!resolvedImage && data.set?.id && data.localId) {
      const cleanSet = data.set.id.replace(/\./g, '').toLowerCase();
      const cleanNum = parseInt(data.localId, 10) || data.localId;
      resolvedImage = `https://images.pokemontcg.io/${cleanSet}/${cleanNum}_hires.png`;
    }

    return NextResponse.json({
      name: data.name,
      expansion: englishExpansion || 'TCG Set',
      number: data.localId || '001',
      artist: data.illustrator || 'Desconocido',
      rarity: data.rarity || 'Común',
      image: resolvedImage,
      language: lang === 'es' ? 'Español' : 'Inglés',
      variants: data.variants || {},
      category: data.category || 'Pokemon',
      trainerType: data.trainerType || '',
      types: data.types || [],
    });
  } catch (error: any) {
    console.error('TCGdex card detail error:', error);
    return NextResponse.json({ error: 'Error fetching card details' }, { status: 500 });
  }
}
