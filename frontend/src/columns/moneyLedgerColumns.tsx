import { formatDate } from '../lib/format';
import type { Column } from '../components/ui/DataTable';
import type { MoneyLedgerItem } from '../types';

/** Invested / Returns / Profit & Loss pages. */
export interface MoneyLedgerColumnsDeps {
  signed: (value: number) => string;
  amountColor: (value: number) => string;
}

export const getMoneyLedgerColumns = ({ signed, amountColor }: MoneyLedgerColumnsDeps): Column<MoneyLedgerItem>[] => [
    {
      header: 'Date',
      width: '120px',
      render: (it) => (
        <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDate(it.date)}</span>
      ),
    },
    {
      header: 'Category',
      width: '170px',
      render: (it) => <span style={{ color: 'var(--text-secondary)' }}>{it.category}</span>,
    },
    {
      header: 'Description',
      render: (it) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{it.description}</div>
          {it.detail && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{it.detail}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Amount',
      width: '140px',
      align: 'right',
      render: (it) => (
        <span
          style={{
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color: amountColor(it.amount),
          }}
        >
          {signed(it.amount)}
        </span>
      ),
    },
  ];
