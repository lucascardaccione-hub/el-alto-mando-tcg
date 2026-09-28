import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const expansions = db
      .prepare("SELECT DISTINCT expansion FROM cards WHERE expansion IS NOT NULL AND expansion != '' ORDER BY expansion ASC")
      .all() as { expansion: string }[];

    const artists = db
      .prepare("SELECT DISTINCT artist FROM cards WHERE artist IS NOT NULL AND artist != '' ORDER BY artist ASC")
      .all() as { artist: string }[];

    const versions = db
      .prepare("SELECT DISTINCT version FROM cards WHERE version IS NOT NULL AND version != '' ORDER BY version ASC")
      .all() as { version: string }[];

    const dbLanguages = db
      .prepare("SELECT DISTINCT language FROM cards WHERE language IS NOT NULL AND language != '' ORDER BY language ASC")
      .all() as { language: string }[];

    // Default to at least Inglés and Español
    const langSet = new Set(['Inglés', 'Español', ...dbLanguages.map((l) => l.language)]);

    const stats = db
      .prepare('SELECT COUNT(*) as totalCards, COALESCE(SUM(stock), 0) as totalStock, COUNT(DISTINCT expansion) as totalExpansions FROM cards')
      .get() as any;

    return NextResponse.json({
      expansions: expansions.map((e) => e.expansion),
      artists: artists.map((a) => a.artist),
      versions: versions.map((v) => v.version),
      languages: Array.from(langSet),
      stats: {
        totalCards: stats?.totalCards || 0,
        totalStock: stats?.totalStock || 0,
        totalExpansions: stats?.totalExpansions || 0,
      },
    });
  } catch (error: any) {
    console.error('Metadata fetch error:', error);
    return NextResponse.json({ error: 'Error al obtener filtros' }, { status: 500 });
  }
}
