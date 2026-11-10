'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';

import { Header } from './Header';
import { DataTable, Input } from './ui';
import { Search } from 'lucide-react';
import { BackButton } from './BackButton';
import type { MoneyLedgerItem } from '../types';
import { getMoneyLedgerColumns } from '../columns/moneyLedgerColumns';

export type MoneyLedgerKind = 'invested' | 'returns' | 'pnl';

interface LedgerResponse {
  success: boolean;
  kind: MoneyLedgerKind;
  total: number;
  totalIn?: number;
  totalOut?: number;
  items: MoneyLedgerItem[];
  message?: string;
}

const COPY: Record<MoneyLedgerKind, { title: string; subtitle: string; empty: string }> = {
  invested: {
    title: 'Total Invested',
    subtitle: 'Every payment made: match and ground costs, advances to organizers, and expenses.',
    empty: 'No payments recorded yet.',
  },
  returns: {
    title: 'Total Returns',
    subtitle: 'Every amount received: sponsorships, prizes and squad fees, less refunds to players.',
    empty: 'No returns recorded yet.',
  },
  pnl: {
    title: 'Profit & Loss',
    subtitle: 'Everything received minus everything paid. Money in is positive, money out is negative.',
    empty: 'No money in or out recorded yet.',
  },
};

const rupees = (v: number) => `${v < 0 ? '−' : ''}Rs. ${Math.abs(v).toLocaleString('en-US')}`;

/** Itemised list behind a dashboard money card; its total always equals the card's figure. */
export const MoneyLedgerView: React.FC<{ kind: MoneyLedgerKind }> = ({ kind }) => {
  const router = useRouter();
  const copy = COPY[kind];
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<'all' | 'in' | 'out'>('all');
  const isPnl = kind === 'pnl';

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'ledger', kind],
    queryFn: () => fetchApi<LedgerResponse>(`/dashboard/ledger/${kind}`),
  });
  const items = data?.items || [];

  // Category subtotals, largest first; they double as filters.
  const categories = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const it of items) {
      if (direction !== 'all' && it.direction !== direction) continue;
      const row = map.get(it.category) || { total: 0, count: 0 };
      row.total += it.amount;
      row.count += 1;
      map.set(it.category, row);
    }
    return Array.from(map.entries()).sort((a, b) => Math.abs(b[1].total) - Math.abs(a[1].total));
  }, [items, direction]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((it) => {
      if (direction !== 'all' && it.direction !== direction) return false;
      if (category !== 'all' && it.category !== category) return false;
      if (!term) return true;
      return [it.description, it.detail, it.category, it.tournament?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [items, category, search, direction]);
  const visibleTotal = visible.reduce((acc, it) => acc + it.amount, 0);
  const isFiltered = category !== 'all' || search.trim() !== '' || direction !== 'all';
  const signed = (v: number) => (isPnl && v > 0 ? `+${rupees(v)}` : rupees(v));
  const amountColor = (v: number) =>
    v < 0 ? 'var(--accent-rose)' : isPnl && v > 0 ? 'var(--accent-green)' : 'var(--text-primary)';

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '8px',
    border: `1px solid ${active ? '#0f172a' : 'var(--border-color)'}`,
    background: active ? '#0f172a' : '#ffffff',
    color: active ? '#ffffff' : 'var(--text-secondary)',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  return (
    <>
      <Header title={copy.title} subtitle={copy.subtitle} />

      <div className="content-body">
        <div style={{ marginBottom: '16px' }}>
          <BackButton href="/" label="Back to Dashboard" />
        </div>

        {/* Total + category breakdown */}
        <div className="card" style={{ padding: '20px 22px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {copy.title}
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: isPnl ? amountColor(data?.total || 0) : 'var(--text-primary)',
                  marginTop: '2px',
                }}
              >
                {isLoading ? '…' : signed(data?.total || 0)}
              </div>
              {isPnl && !isLoading && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Money in <strong>{rupees(data?.totalIn || 0)}</strong> · Money out{' '}
                  <strong>{rupees(data?.totalOut || 0)}</strong>
                </div>
              )}
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{copy.subtitle}</div>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              {items.length} item{items.length === 1 ? '' : 's'}
            </div>
          </div>

          {isPnl && items.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
              {(['all', 'in', 'out'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  style={chipStyle(direction === d)}
                  onClick={() => {
                    setDirection(d);
                    setCategory('all');
                  }}
                >
                  {d === 'all' ? 'Everything' : d === 'in' ? 'Money in' : 'Money out'}
                </button>
              ))}
            </div>
          )}

          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: isPnl ? '10px' : '16px' }}>
              <button type="button" style={chipStyle(category === 'all')} onClick={() => setCategory('all')}>
                All · {categories.reduce((n, [, row]) => n + row.count, 0)}
              </button>
              {categories.map(([name, row]) => (
                <button
                  key={name}
                  type="button"
                  style={chipStyle(category === name)}
                  onClick={() => setCategory(category === name ? 'all' : name)}
                  title={`${row.count} item${row.count === 1 ? '' : 's'}`}
                >
                  {name} · {signed(row.total)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div style={{ width: '320px', maxWidth: '100%' }}>
            <Input
              placeholder="Search tournament, sponsor or item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          {isFiltered && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing {visible.length} of {items.length} · <strong>{signed(visibleTotal)}</strong>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DataTable<MoneyLedgerItem>
            data={visible}
            loading={isLoading}
            keyExtractor={(it) => it.id}
            emptyMessage={isFiltered ? 'Nothing matches this filter.' : copy.empty}
            onRowClick={(it) => it.link && router.push(it.link)}
            showSerialNumber
            columns={getMoneyLedgerColumns({ signed, amountColor })}
          />
        </div>
      </div>
    </>
  );
};
