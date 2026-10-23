"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { Header } from "../../components/Header";
import { StatCard } from "../../components/StatCard";
import { fetchApi } from "../../lib/api";
import { confirmDelete, showToast } from "../../lib/alerts";
import {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  DatePicker,
  Modal,
  Card,
  DataTable,
  Pagination,
  ViewSwitcher,
} from "../../components/ui";
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
} from "../../components/icons";
import { CreateExpenseModal } from "../../components/CreateExpenseModal";
import { EditExpenseModal } from "../../components/EditExpenseModal";

export default function FinancesPage() {
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // React Queries
  const expensesQuery = useQuery({
    queryKey: [
      "expenses",
      { teamId: selectedTeamId, category: categoryFilter },
    ],
    queryFn: () => {
      let query = `?teamId=${selectedTeamId}`;
      if (categoryFilter) query += `&category=${categoryFilter}`;
      return fetchApi<{
        success: boolean;
        totalAmount: number;
        categoryTotals: any;
        expenses: any[];
      }>(`/expenses${query}`);
    },
  });

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>("/teams"),
  });

  const tournamentsQuery = useQuery({
    queryKey: queryKeys.tournaments(),
    queryFn: () =>
      fetchApi<{ success: boolean; tournaments: any[] }>("/tournaments"),
  });

  const expenses = expensesQuery.data?.expenses || [];
  const totalAmount = expensesQuery.data?.totalAmount || 0;
  const categoryTotals = expensesQuery.data?.categoryTotals || {};
  const teams = teamsQuery.data?.teams || [];
  const tournaments = tournamentsQuery.data?.tournaments || [];
  const loading =
    expensesQuery.isLoading ||
    teamsQuery.isLoading ||
    tournamentsQuery.isLoading;

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleEditOpen = (exp: any) => {
    setEditingExpense(exp);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirmDelete(`expense "${title}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/expenses/${id}`, {
        method: "DELETE",
      });
      if (res.success) {
        showToast.success(`Expense "${title}" deleted.`);
        invalidateData();
      }
    } catch (err) {
      showToast.error("Failed to delete expense.");
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString("en-US");

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (exp.paidBy || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
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
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ width: "220px" }}>
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

            <div style={{ width: "180px" }}>
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "", label: "All Categories" },
                  { value: "kit_jerseys", label: "Jerseys & Kits" },
                  { value: "equipment", label: "Caps & Gear" },
                  { value: "tournament_entry_fee", label: "Tournament Fee" },
                  { value: "other", label: "Marketing & Media" },
                ]}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        {viewMode === "table" && (
          <div>
            <DataTable<any>
              data={paginatedExpenses}
              keyExtractor={(exp) => exp._id}
              emptyMessage="No expenses found."
              columns={[
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
                      <Calendar size={12} color="var(--text-muted)" />
                      <span>
                        {new Date(exp.expenseDate).toLocaleDateString()}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Title & Description",
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
                      {exp.paidBy || "Captain Faraz"}
                    </span>
                  ),
                },
                {
                  header: "Amount",
                  render: (exp) => (
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "var(--accent-rose)",
                      }}
                    >
                      Rs. {fNum(exp.amount)}
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
                  ),
                },
              ]}
            />

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
        {viewMode === "grid" && (
          <div>
            <div className="grid-3">
              {paginatedExpenses.map((exp) => (
                <Card key={exp._id} variant="rose">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <Badge
                      variant="purple"
                      style={{ textTransform: "capitalize" }}
                    >
                      {exp.category?.replace(/_/g, " ")}
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
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    {exp.title}
                  </h3>
                  {exp.description && (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        marginBottom: "12px",
                      }}
                    >
                      {exp.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border-color)",
                      marginTop: "auto",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Paid By
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {exp.paidBy || "Captain"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: 800,
                          color: "var(--accent-rose)",
                        }}
                      >
                        Rs. {fNum(exp.amount)}
                      </div>
                      <div
                        style={{ fontSize: "11px", color: "var(--text-muted)" }}
                      >
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
        <CreateExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          teams={teams}
          onSuccess={invalidateData}
        />

        {/* Modal: Edit Expense */}
        <EditExpenseModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingExpense(null);
          }}
          expense={editingExpense}
          onSuccess={invalidateData}
        />
      </div>
    </>
  );
}
