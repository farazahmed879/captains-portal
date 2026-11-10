'use client';

import { useEffect, useState } from 'react';

/** Phone layout breakpoint, shared by JS (lists) and CSS (`@media (max-width: 640px)`). */
export const MOBILE_QUERY = '(max-width: 640px)';

/** True while the media query matches. Starts false on the server and first render. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery(MOBILE_QUERY);
