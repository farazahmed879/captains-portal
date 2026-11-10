import { Pencil, Trash2 } from '../components/icons';
import { Badge, Button } from '../components/ui';
import { EMPTY_VALUE } from '../constants';
import { formatDate, formatNumber } from '../lib/format';
import type { Column } from '../components/ui/DataTable';
import type { Expense } from '../types';

/** Expenses list (Expenses page). */
export interface ExpenseColumnsDeps {
  handleEditOpen: (exp: any) => void;
  handleDelete: (id: string, title: string) => void;
}

export const getExpenseColumns = ({ handleEditOpen, handleDelete }: ExpenseColumnsDeps): Column<Expense>[] => [
    {
      header: "Date",
      render: (exp) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            whiteSpace: "nowrap",
          }}
        >
          <span>
            {formatDate(exp.expenseDate)}
          </span>
        </div>
      ),
    },
    {
      header: "Title & Description",
      mobile: "primary",
      render: (exp) => (
        <div>
          <div
            style={{
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {exp.title}
          </div>
          {exp.description && (
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              {exp.description}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Category",
      render: (exp) => (
        <Badge
          variant="primary"
          style={{ textTransform: "capitalize" }}
        >
          {exp.category?.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      header: "Paid By",
      render: (exp) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {exp.paidBy || EMPTY_VALUE}
        </span>
      ),
    },
    {
      header: "Amount",
      align: "right",
      render: (exp) => (
        <span
          style={{
            fontSize: "13.5px",
            fontWeight: 600,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Rs. {formatNumber(exp.amount)}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      render: (exp) => (
        <div
          className="action-group"
          style={{ justifyContent: "flex-end" }}
        >
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            icon={<Pencil size={14} color="var(--accent-blue)" />}
            onClick={(e) => {
              e.stopPropagation();
              handleEditOpen(exp);
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
              handleDelete(exp._id, exp.title);
            }}
            title="Delete Expense"
          />
        </div>
      ),
    },
  ];
