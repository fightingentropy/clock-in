'use client';

import { useEffect, useState } from 'react';

/**
 * Returns the current timestamp and keeps it refreshed on the requested cadence.
 * Starts with `null` to avoid mismatches with server-rendered content.
 */
export function useNow(refreshIntervalMs = 60_000) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());

    update();

    if (!refreshIntervalMs || refreshIntervalMs <= 0) {
      return;
    }

    const id = window.setInterval(update, refreshIntervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [refreshIntervalMs]);

  return now;
}
