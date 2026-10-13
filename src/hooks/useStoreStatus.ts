'use client';

import { useCallback, useEffect, useState } from 'react';

export interface StoreStatusClient {
  paused: boolean;
  message: string;
  updated_at: string | null;
  updated_by: string | null;
}

const EMPTY: StoreStatusClient = { paused: false, message: '', updated_at: null, updated_by: null };

// Simple module-level cache so multiple components don't refetch on every mount
let cache: { data: StoreStatusClient; at: number } | null = null;
const TTL_MS = 30_000;
const listeners = new Set<(s: StoreStatusClient) => void>();

export function broadcastStoreStatus(data: StoreStatusClient) {
  cache = { data, at: Date.now() };
  listeners.forEach((fn) => fn(data));
}

export function useStoreStatus() {
  const [status, setStatus] = useState<StoreStatusClient>(cache?.data || EMPTY);
  const [loading, setLoading] = useState(!cache);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/store-status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        broadcastStoreStatus({
          paused: !!data.paused,
          message: data.message || '',
          updated_at: data.updated_at || null,
          updated_by: data.updated_by || null,
        });
      }
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    listeners.add(setStatus);
    if (!cache || Date.now() - cache.at > TTL_MS) {
      refresh();
    } else {
      setLoading(false);
    }
    return () => {
      listeners.delete(setStatus);
    };
  }, [refresh]);

  return { ...status, status, loading, refresh };
}
