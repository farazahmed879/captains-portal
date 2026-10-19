import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Expense } from '../models/Expense';

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId, tournamentId, category, title, amount, expenseDate, paidBy, description, receiptUrl } = req.body;
    if (!teamId || !title || !amount) {
      res.status(400).json({ success: false, message: 'Team, title, and amount are required' });
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
