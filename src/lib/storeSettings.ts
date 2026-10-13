import db from '@/lib/db';

export interface StoreStatus {
  paused: boolean;
  message: string;
  updated_at: string | null;
  updated_by: string | null;
}

export const DEFAULT_PAUSE_MESSAGE =
  'La tienda se encuentra en pausa momentáneamente. Podés seguir navegando el catálogo, pero no es posible generar pedidos por ahora.';

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await db.run(
    `CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT,
      updated_by TEXT
    )`
  );
  tableReady = true;
}

export async function getStoreStatus(): Promise<StoreStatus> {
  try {
    await ensureTable();
    const row = await db.get<{ value: string; updated_at: string; updated_by: string }>(
      "SELECT value, updated_at, updated_by FROM site_settings WHERE key = 'store_status'"
    );
    if (!row) {
      return { paused: false, message: '', updated_at: null, updated_by: null };
    }
    const parsed = JSON.parse(row.value || '{}');
    return {
      paused: !!parsed.paused,
      message: typeof parsed.message === 'string' ? parsed.message : '',
      updated_at: row.updated_at || null,
      updated_by: row.updated_by || null,
    };
  } catch (err) {
    console.error('getStoreStatus error:', err);
    // Fail open: never block the whole store because settings could not be read
    return { paused: false, message: '', updated_at: null, updated_by: null };
  }
}

export async function setStoreStatus(paused: boolean, message: string, username: string): Promise<StoreStatus> {
  await ensureTable();
  const now = new Date().toISOString();
  const value = JSON.stringify({ paused, message: message.trim().slice(0, 300) });
  await db.run(
    `INSERT INTO site_settings (key, value, updated_at, updated_by)
     VALUES ('store_status', ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    [value, now, username]
  );
  return getStoreStatus();
}
