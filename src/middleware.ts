import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
