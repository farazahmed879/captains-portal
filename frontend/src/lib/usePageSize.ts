'use client';

import { useEffect, useState } from 'react';
import { PAGINATION } from '../constants';

const STORAGE_PREFIX = 'cp-page-size:';

/**
 * Rows-per-page for one list, remembered per list in this browser (e.g. usePageSize('players')).
 * Falls back to PAGINATION.defaultPageSize when nothing (valid) is stored or storage is blocked.
 */
export function usePageSize(listKey: string): [number, (size: number) => void] {
  const [pageSize, setPageSizeState] = useState<number>(PAGINATION.defaultPageSize);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(STORAGE_PREFIX + listKey));
      if ((PAGINATION.pageSizeOptions as readonly number[]).includes(saved)) setPageSizeState(saved);
    } catch {
      /* storage unavailable: keep the default */
    }
  }, [listKey]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    try {
      window.localStorage.setItem(STORAGE_PREFIX + listKey, String(size));
    } catch {
      /* storage unavailable: the choice lasts for this visit only */
    }
  };

  return [pageSize, setPageSize];
}
