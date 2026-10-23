import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Cambiar a false si en el futuro se desea volver a activar el sitio online
const SITE_OFFLINE = true;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SITE_OFFLINE) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'El sitio se encuentra fuera de línea.' },
        {
          status: 410,
          headers: {
            'X-Robots-Tag': 'noindex, nofollow, noarchive',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      );
    }

    const offlineHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <title>Sitio fuera de línea</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #060913;
      color: #94a3b8;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 24px;
    }
    .box {
      max-width: 420px;
      padding: 32px;
      border-radius: 16px;
      background: #0b1120;
      border: 1px solid rgba(255,255,255,0.08);
    }
    h1 {
      color: #f8fafc;
      font-size: 1.25rem;
      margin: 0 0 8px 0;
    }
    p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>Sitio fuera de línea</h1>
    <p>Esta página ya no se encuentra disponible.</p>
  </div>
</body>
</html>`;

    return new NextResponse(offlineHtml, {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  }

  // 1. CSRF Origin Verification for mutating API requests
  if (pathname.startsWith('/api/') && MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { error: 'Solicitud bloqueada por política de seguridad (CSRF Origin mismatch).' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Cabecera Origin inválida.' },
          { status: 403 }
        );
      }
    }
  }

  const response = NextResponse.next();

  // 2. Site-wide Defense-in-Depth Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
