import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Expense } from '../models/Expense';
import { Team } from '../models/Team';
import { Tournament } from '../models/Tournament';
import { findInvalidTenantRef, stripProtectedFields } from '../utils/tenantGuard';
import { asyncHandler } from '../utils/asyncHandler';

export const getExpenses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teamId, tournamentId, category, startDate, endDate } = req.query;
  const filter: any = { tenantId: req.user?.tenantId };

  if (teamId) filter.teamId = teamId;
  if (tournamentId) filter.tournamentId = tournamentId;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.expenseDate = {};
    if (startDate) filter.expenseDate.$gte = new Date(startDate as string);
    if (endDate) filter.expenseDate.$lte = new Date(endDate as string);
  }

  const expenses = await Expense.find(filter)
    .populate('teamId', 'name shortName primaryColor')
    .populate('tournamentId', 'name')
    .sort({ expenseDate: -1 });

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Group by category
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  res.json({
    success: true,
    totalAmount,
    categoryTotals,
    expenses,
  });
});

export const createExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teamId, tournamentId, category, title, amount, expenseDate, paidBy, description, receiptUrl } = req.body;
  if (!teamId || !title || !amount) {
    res.status(400).json({ success: false, message: 'Team, title, and amount are required' });
    return;
  }

  const invalidRef = await findInvalidTenantRef(req.user?.tenantId, [
    { model: Team, ids: req.body.teamId, label: 'Team' },
    { model: Tournament, ids: req.body.tournamentId, label: 'Tournament' },
  ]);
  if (invalidRef) {
    res.status(400).json({ success: false, message: invalidRef });
    return;
  }

  const expense = await Expense.create({
    tenantId: req.user?.tenantId,
    teamId,
    tournamentId: tournamentId || undefined,
    category: category || 'equipment',
    title,
    amount: Number(amount),
    expenseDate: expenseDate || new Date(),
    paidBy: paidBy || 'Captain',
    description,
    receiptUrl,
  });

  res.status(201).json({ success: true, expense });
});

export const updateExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  req.body = stripProtectedFields(req.body);

  const invalidRef = await findInvalidTenantRef(req.user?.tenantId, [
    { model: Team, ids: req.body.teamId, label: 'Team' },
    { model: Tournament, ids: req.body.tournamentId, label: 'Tournament' },
  ]);
  if (invalidRef) {
    res.status(400).json({ success: false, message: invalidRef });
    return;
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: id, tenantId: req.user?.tenantId },
    req.body,
    { new: true }
  );
  if (!expense) {
    res.status(404).json({ success: false, message: 'Expense not found' });
    return;
  }
  res.json({ success: true, expense });
});

export const deleteExpense = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const expense = await Expense.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
  if (!expense) {
    res.status(404).json({ success: false, message: 'Expense not found' });
    return;
  }
  res.json({ success: true, message: 'Expense deleted successfully' });
});
