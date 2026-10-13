import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getStoreStatus, setStoreStatus, DEFAULT_PAUSE_MESSAGE } from '@/lib/storeSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await getStoreStatus();
  return NextResponse.json({
    ...status,
    message: status.paused ? status.message || DEFAULT_PAUSE_MESSAGE : status.message,
  });
}

export async function PATCH(request: Request) {
  try {
    const user = getCurrentUser();
    if (!user || user.username.toLowerCase() !== 'luca') {
      return NextResponse.json(
        { error: 'Solo el Administrador Master Luca puede pausar o reanudar la tienda.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body.paused !== 'boolean') {
      return NextResponse.json({ error: 'El campo "paused" es obligatorio (true/false).' }, { status: 400 });
    }

    const status = await setStoreStatus(body.paused, String(body.message || ''), user.username);
    return NextResponse.json({ success: true, ...status });
  } catch (error) {
    console.error('Update store status error:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el estado de la tienda' }, { status: 500 });
  }
}
