'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` once the component tree has hydrated on the client.
 * During the server render this stays `false`, letting us avoid
 * injecting client-only values (like timezone-dependent text) into
 * the HTML React hydrates.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
