import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tienda', '/decks', '/deck-builder'],
        disallow: ['/admin', '/api/', '/perfil', '/pedidos'],
      },
    ],
    sitemap: 'https://elaltomandotcg.vercel.app/sitemap.xml',
  };
}
