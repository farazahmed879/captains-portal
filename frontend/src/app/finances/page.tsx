'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { fetchApi } from '../../lib/api';
import {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  DatePicker,
  Modal,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Pagination,
  ViewSwitcher,
} from '../../components/ui';
import {
  Receipt,
  Plus,
  Calendar,
  Tag,
  DollarSign,
  TrendingDown,
  Trash2,
  Pencil,
  Filter,
  Search,
} from '../../components/icons';

export default function FinancesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [categoryTotals, setCategoryTotals] = useState<any>({});
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    teamId: '',
    tournamentId: '',
    category: 'equipment',
    title: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paidBy: 'Captain Faraz',
    description: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    category: 'equipment',
    title: '',
    amount: 0,
    expenseDate: '',
    paidBy: 'Captain Faraz',
    description: '',
  });

  const loadData = () => {
    setLoading(true);
    let query = `?teamId=${selectedTeamId}`;
    if (categoryFilter) query += `&category=${categoryFilter}`;

    Promise.all([
      fetchApi<{ success: boolean; totalAmount: number; categoryTotals: any; expenses: any[] }>(
        `/expenses${query}`
      ),
      fetchApi<{ success: boolean; teams: any[] }>('/teams'),
      fetchApi<{ success: boolean; tournaments: any[] }>('/tournaments'),
    ])
      .then(([expRes, teamRes, trnRes]) => {
        if (expRes.success) {
          setExpenses(expRes.expenses);
          setTotalAmount(expRes.totalAmount);
          setCategoryTotals(expRes.categoryTotals);
        }
        if (teamRes.success) {
          setTeams(teamRes.teams);
          if (teamRes.teams.length > 0 && !formData.teamId) {
            setFormData((prev) => ({ ...prev, teamId: teamRes.teams[0]._id }));
          }
        }
        if (trnRes.success) setTournaments(trnRes.tournaments);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedTeamId, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean; expense: any }>('/expenses', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          teamId: teams[0]?._id || '',
          tournamentId: '',
          category: 'equipment',
          title: '',
          amount: '',
          expenseDate: new Date().toISOString().split('T')[0],
          paidBy: 'Captain Faraz',
          description: '',
        });
        loadData();
      }
    } catch (err) {
      alert('Failed to record expense');
    }
  };

  const handleEditOpen = (exp: any) => {
    setEditFormData({
      id: exp._id,
      category: exp.category || 'equipment',
      title: exp.title,
      amount: exp.amount || 0,
      expenseDate: exp.expenseDate ? new Date(exp.expenseDate).toISOString().split('T')[0] : '',
      paidBy: exp.paidBy || 'Captain Faraz',
      description: exp.description || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/expenses/${editFormData.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to update expense');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete expense "${title}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/expenses/${id}`, { method: 'DELETE' });
      if (res.success) loadData();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.paidBy || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <Header
        title="Team Expenditures & Financial Ledger"
        subtitle="Manage Kits Manufacturing, Caps, Floppies, Marketing & Edit/Delete Expenses"
        selectedTeamId={selectedTeamId}
        onTeamChange={(id) => {
          setSelectedTeamId(id);
          setCurrentPage(1);
        }}
      />

      <div className="content-body">
        {/* Top Summary Banner */}
        <div className="grid-3">
          <StatCard
            variant="rose"
            title="Total Expenditures"
            value={`Rs. ${fNum(totalAmount)}`}
            subtitle="Normalized Outflow from Sheet"
            icon={<TrendingDown size={20} color="var(--accent-rose)" />}
          />
          <StatCard
            variant="blue"
            title="Kits & Uniforms"
            value={`Rs. ${fNum(categoryTotals.kit_jerseys)}`}
            subtitle="23 Players Customized Sets"
            icon={<Receipt size={20} color="var(--accent-blue)" />}
          />
          <StatCard
            variant="purple"
            title="Caps, Floppies & Media"
            value={`Rs. ${fNum((categoryTotals.equipment || 0) + (categoryTotals.other || 0))}`}
            subtitle="Caps Rs 6,000 + Marketing Rs 3,000"
            icon={<Tag size={20} color="var(--accent-purple)" />}
          />
        </div>

        {/* Filter & Toolbar */}
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '220px' }}>
              <Input
                placeholder="Search expense title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search size={14} />}
              />
            </div>

            <div style={{ width: '180px' }}>
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Categories' },
                  { value: 'kit_jerseys', label: 'Jerseys & Kits' },
                  { value: 'equipment', label: 'Caps & Gear' },
                  { value: 'tournament_entry_fee', label: 'Tournament Fee' },
                  { value: 'other', label: 'Marketing & Media' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />

            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* VIEW 1: TABLE VIEW */}
        {viewMode === 'table' && (
          <div>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title & Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableEmpty colSpan={6} message="No expenses found." />
              ) : (
                paginatedExpenses.map((exp) => (
                  <TableRow key={exp._id}>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={12} color="var(--text-muted)" />
                        <span>{new Date(exp.expenseDate).toLocaleDateString()}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{exp.title}</div>
                      {exp.description && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {exp.description}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="primary" style={{ textTransform: 'capitalize' }}>
                        {exp.category?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell style={{ color: 'var(--text-secondary)' }}>
                      {exp.paidBy || 'Captain Faraz'}
                    </TableCell>

                    <TableCell style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-rose)' }}>
                      Rs. {fNum(exp.amount)}
                    </TableCell>

                    <TableCell align="right">
                      <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          isIconOnly
                          icon={<Pencil size={14} color="var(--accent-blue)" />}
                          onClick={() => handleEditOpen(exp)}
                          title="Edit Expense"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          isIconOnly
                          icon={<Trash2 size={14} />}
                          onClick={() => handleDelete(exp._id, exp.title)}
                          title="Delete Expense"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredExpenses.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Expenses"
          />
        </div>
      )}

      {/* VIEW 2: GRID (CARDS) VIEW */}
      {viewMode === 'grid' && (
        <div>
          <div className="grid-3">
            {paginatedExpenses.map((exp) => (
              <Card key={exp._id} variant="rose">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px',
                  }}
                >
                  <Badge variant="purple" style={{ textTransform: 'capitalize' }}>
                    {exp.category?.replace(/_/g, ' ')}
                  </Badge>
                  <div className="action-group">
                    <Button
                      variant="secondary"
                      size="sm"
                      isIconOnly
                      icon={<Pencil size={14} color="var(--accent-blue)" />}
                      onClick={() => handleEditOpen(exp)}
                      title="Edit"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      isIconOnly
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDelete(exp._id, exp.title)}
                      title="Delete"
                    />
                  </div>
                </div>

                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  {exp.title}
                </h3>
                {exp.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    {exp.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: 'auto',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Paid By
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {exp.paidBy || 'Captain'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-rose)' }}>
                      Rs. {fNum(exp.amount)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredExpenses.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Expenses"
          />
        </div>
      )}

        {/* Modal: Add Expense */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Team Expenditure"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Save Expense
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <Select
                label="Team *"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                required
                options={teams.map((t) => ({ value: t._id, label: t.name }))}
              />

              <Select
                label="Category *"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'kit_jerseys', label: 'Jerseys & Uniforms' },
                  { value: 'equipment', label: 'Caps & Gear' },
                  { value: 'other', label: 'Marketing & Media' },
                  { value: 'ground_booking', label: 'Ground Rent' },
                  { value: 'refreshment', label: 'Refreshments' },
                  { value: 'transport', label: 'Transport' },
                ]}
              />
            </div>

            <Input
              label="Title *"
              placeholder="e.g. Practice Leather Balls"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div className="grid-2">
              <Input
                label="Amount (Rs.) *"
                type="number"
                placeholder="5000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />

              <DatePicker
                label="Date *"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                required
              />
            </div>

            <Textarea
              label="Description"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </form>
        </Modal>

        {/* Modal: Edit Expense */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Expense Record"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdate}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdate}>
            <div className="grid-2">
              <Input
                label="Title *"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                required
              />

              <Select
                label="Category"
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                options={[
                  { value: 'kit_jerseys', label: 'Jerseys & Uniforms' },
                  { value: 'equipment', label: 'Caps & Gear' },
                  { value: 'other', label: 'Marketing & Media' },
                  { value: 'ground_booking', label: 'Ground Rent' },
                  { value: 'refreshment', label: 'Refreshments' },
                ]}
              />
            </div>

            <div className="grid-2">
              <Input
                label="Amount (Rs.) *"
                type="number"
                value={editFormData.amount}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, amount: Number(e.target.value) })
                }
                required
              />

              <DatePicker
                label="Date"
                value={editFormData.expenseDate}
                onChange={(e) => setEditFormData({ ...editFormData, expenseDate: e.target.value })}
              />
            </div>

            <Textarea
              label="Description"
              rows={2}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />
          </form>
        </Modal>
      </div>
    </>
  );
}
