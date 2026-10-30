"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpense = exports.updateExpense = exports.createExpense = exports.getExpenses = void 0;
const Expense_1 = require("../models/Expense");
const getExpenses = async (req, res) => {
    try {
        const { teamId, tournamentId, category, startDate, endDate } = req.query;
        const filter = { tenantId: req.user?.tenantId };
        if (teamId)
            filter.teamId = teamId;
        if (tournamentId)
            filter.tournamentId = tournamentId;
        if (category)
            filter.category = category;
        if (startDate || endDate) {
            filter.expenseDate = {};
            if (startDate)
                filter.expenseDate.$gte = new Date(startDate);
            if (endDate)
                filter.expenseDate.$lte = new Date(endDate);
        }
        const expenses = await Expense_1.Expense.find(filter)
            .populate('teamId', 'name shortName primaryColor')
            .populate('tournamentId', 'name')
            .sort({ expenseDate: -1 });
        const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        // Group by category
        const categoryTotals = {};
        expenses.forEach((e) => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });
        res.json({
            success: true,
            totalAmount,
            categoryTotals,
            expenses,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getExpenses = getExpenses;
const createExpense = async (req, res) => {
    try {
        const { teamId, tournamentId, category, title, amount, expenseDate, paidBy, description, receiptUrl } = req.body;
        if (!teamId || !title || !amount) {
            res.status(400).json({ success: false, message: 'Team, title, and amount are required' });
            return;
        }
        const expense = await Expense_1.Expense.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createExpense = createExpense;
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense_1.Expense.findOneAndUpdate({ _id: id, tenantId: req.user?.tenantId }, req.body, { new: true });
        if (!expense) {
            res.status(404).json({ success: false, message: 'Expense not found' });
            return;
        }
        res.json({ success: true, expense });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense_1.Expense.findOneAndDelete({ _id: id, tenantId: req.user?.tenantId });
        if (!expense) {
            res.status(404).json({ success: false, message: 'Expense not found' });
            return;
        }
        res.json({ success: true, message: 'Expense deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteExpense = deleteExpense;
