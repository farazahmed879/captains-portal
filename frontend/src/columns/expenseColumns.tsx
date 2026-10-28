import React from 'react';
import { Column } from '../components/ui/DataTable';
import { Badge, Button } from '../components/ui';
import { Calendar, Pencil, Trash2 } from '../components/icons';
import { Expense } from '../types';

interface ExpenseColumnActions {
  onEdit: (expense: Expense) => void;
  onDelete: (id: string, title: string) => void;
  fNum: (val: number | undefined) => string;
}

export const getExpenseColumns = ({
  onEdit,
  onDelete,
  fNum,
}: ExpenseColumnActions): Column<Expense>[] => [
  {
    header: 'Date',
    render: (exp: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
        <Calendar size={12} color="var(--text-muted)" />
        <span>{new Date(exp.expenseDate).toLocaleDateString()}</span>
      </div>
    ),
  },
  {
    header: 'Title & Description',
    render: (exp: any) => (
      <div>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{exp.title}</div>
        {exp.description && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {exp.description}
          </div>
        )}
      </div>
    ),
  },
  {
    header: 'Category',
    render: (exp: any) => (
      <Badge variant="primary" style={{ textTransform: 'capitalize' }}>
        {exp.category?.replace(/_/g, ' ')}
      </Badge>
    ),
  },
  {
    header: 'Paid By',
    render: (exp: any) => (
      <span style={{ color: 'var(--text-secondary)' }}>
        {exp.paidBy || 'Captain'}
      </span>
    ),
  },
  {
    header: 'Amount',
    render: (exp: any) => (
      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-rose)' }}>
        Rs. {fNum(exp.amount)}
      </span>
    ),
  },
  {
    header: 'Actions',
    align: 'right',
    render: (exp: any) => (
      <div
        className="action-group"
        style={{ justifyContent: 'flex-end' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          icon={<Pencil size={14} color="var(--accent-blue)" />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(exp);
          }}
          title="Edit Expense"
        />
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<Trash2 size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(exp._id, exp.title);
          }}
          title="Delete Expense"
        />
      </div>
    ),
  },
];
