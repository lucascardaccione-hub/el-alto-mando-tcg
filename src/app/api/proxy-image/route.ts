import { NextResponse } from 'next/server';
import { validateExternalImageProxyUrl } from '@/lib/security';

export const dynamic = 'force-dynamic';

const SAFE_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    let targetUrl = url;
    try {
      if (targetUrl.includes('%')) {
        targetUrl = decodeURIComponent(targetUrl);
      }
    } catch (_) {}

    const check = validateExternalImageProxyUrl(targetUrl);
    if (!check.valid || !check.url) {
      return new NextResponse('Forbidden image URL', { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(check.url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return new NextResponse('Failed to fetch upstream image', { status: res.status });
    }

    const rawContentType = (res.headers.get('content-type') || 'image/png').split(';')[0].trim().toLowerCase();
    const safeContentType = SAFE_IMAGE_MIMES.has(rawContentType) ? rawContentType : 'image/png';

    const buffer = await res.arrayBuffer();
    // Cap image size at 10MB
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return new NextResponse('Image payload too large', { status: 413 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': safeContentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
