export interface Expense {
  _id: string;
  teamId: any;
  tournamentId?: any;
  category: string;
  title: string;
  amount: number;
  expenseDate: string;
  description?: string;
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
