import type React from 'react';

/**
 * Shared table-cell styles so every list table lines up the same way:
 * one main size, one secondary size, money right-aligned with tabular digits, no wrapping.
 */
export const cellMain: React.CSSProperties = { fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' };
export const cellSub: React.CSSProperties = { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' };
export const cellNum: React.CSSProperties = { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' };
export const cellOneLine: React.CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '200px',
};
export const signedColor = (v: number) =>
  v > 0 ? 'var(--accent-green)' : v < 0 ? 'var(--accent-rose)' : 'var(--text-muted)';
