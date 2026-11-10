export interface Expense {
  _id: string;
  teamId: any;
  tournamentId?: any;
  category: string;
  title: string;
  amount: number;
  expenseDate: string;
  description?: string;
  paidBy?: string;
  receiptUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseFormValues {
  teamId: string;
  tournamentId?: string;
  category: string;
  title: string;
  amount: number | '';
  expenseDate: string;
  description: string;
}

export interface EditExpenseFormValues {
  tournamentId?: string;
  title: string;
  category: string;
  amount: number | '';
  expenseDate: string;
  description: string;
}

/** One line on the Invested / Returns / Profit & Loss pages (GET /dashboard/ledger/:kind). */
export interface MoneyLedgerItem {
  id: string;
  date: string | null;
  category: string;
  description: string;
  detail?: string;
  tournament?: { id: string; name: string } | null;
  link?: string | null;
  amount: number;
  direction?: 'in' | 'out';
}
