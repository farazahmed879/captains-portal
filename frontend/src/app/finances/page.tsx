"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { Header } from "../../components/Header";
import { StatCard } from "../../components/StatCard";
import { fetchApi } from "../../lib/api";
import { formatDate, formatNumber } from "../../lib/format";
import { confirmDelete, confirmBulkDelete, showToast } from "../../lib/alerts";
import {
  Button,
  Badge,
  Input,
  Select,
  Card,
  DataTable,
  Pagination,
  ViewSwitcher,
  BulkActionBar,
  GridSelectCheckbox,
  ListToolbar,
} from "../../components/ui";
import {
  Trash2,
  Pencil,
  Search,
} from "../../components/icons";
import { CreateExpenseModal } from "../../components/CreateExpenseModal";
import { EditExpenseModal } from "../../components/EditExpenseModal";
import { useIsMobile } from "../../lib/useMediaQuery";
import {
  withAllOption,
  EXPENSE_CATEGORY_OPTIONS,
  ExpenseCategory,
} from "../../constants";
import { getExpenseColumns } from "../../columns/expenseColumns";
import { usePageSize } from "../../lib/usePageSize";

export default function FinancesPage() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // React Queries
  const expensesQuery = useQuery({
    queryKey: [
      "expenses",
      { category: categoryFilter },
    ],
    queryFn: () => {
      const query = categoryFilter ? `?category=${categoryFilter}` : '';
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
  const countIn = (category: ExpenseCategory) => expenses.filter((e) => e.category === category).length;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
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

  const [preferredView, setViewMode] = useState<"table" | "grid">("table");
  // Phones always show the list; the List/Grid switch is hidden there (globals.css).
  const isMobile = useIsMobile();
  const viewMode = isMobile ? "table" : preferredView;
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmBulkDelete(selectedIds.length, "Expenses");
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetchApi(`/expenses/${id}`, { method: "DELETE" }),
        ),
      );
      showToast.success(`${selectedIds.length} expense(s) deleted.`);
      setSelectedIds([]);
      invalidateData();
    } catch (err) {
      showToast.error("Failed to delete selected expenses.");
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const [pageSize, setPageSize] = usePageSize('expenses');

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
      />

      <div className="content-body">
        {/* Top Summary Banner */}
        <div className="grid-3">
          <StatCard
            variant="rose"
            title="Total Expenditures"
            value={`Rs. ${formatNumber(totalAmount)}`}
            subtitle={plural(expenses.length, "expense")}
          />
          <StatCard
            variant="blue"
            title="Kits & Uniforms"
            value={`Rs. ${formatNumber(categoryTotals[ExpenseCategory.KIT_JERSEYS])}`}
            subtitle={plural(countIn(ExpenseCategory.KIT_JERSEYS), "purchase")}
          />
          <StatCard
            variant="purple"
            title="Equipment & Other"
            value={`Rs. ${formatNumber((categoryTotals[ExpenseCategory.EQUIPMENT] || 0) + (categoryTotals[ExpenseCategory.OTHER] || 0))}`}
            subtitle={`Equipment Rs. ${formatNumber(categoryTotals[ExpenseCategory.EQUIPMENT])} · Other Rs. ${formatNumber(categoryTotals[ExpenseCategory.OTHER])}`}
          />
        </div>

        {/* Filter & Toolbar */}
        <ListToolbar
          search={{
            placeholder: 'Search expense title...',
            value: searchQuery,
            onChange: (value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            },
          }}
          filters={[
            {
              value: categoryFilter,
              onChange: (value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              },
              options: withAllOption('All Categories', EXPENSE_CATEGORY_OPTIONS),
            },
          ]}
          view={{ value: viewMode, onChange: setViewMode }}
          add={{ label: 'Add Expense', onClick: () => setIsModalOpen(true) }}
        />

        <BulkActionBar
          selectedIds={selectedIds}
          pageItemIds={paginatedExpenses.map((exp: any) => exp._id)}
          allItemIds={filteredExpenses.map((exp: any) => exp._id)}
          itemLabel="Expenses"
          onSelectChange={setSelectedIds}
          onBulkDelete={handleBulkDelete}
          deleting={isBulkDeleting}
        />

        {/* VIEW 1: TABLE VIEW */}
        {viewMode === "table" && (
          <div>
            <DataTable<any>
              data={paginatedExpenses}
              loading={loading}
              keyExtractor={(exp) => exp._id}
              emptyMessage="No expenses found."
              serialStartIndex={(currentPage - 1) * pageSize}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              columns={getExpenseColumns({ handleEditOpen, handleDelete })}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredExpenses.length}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
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
                      <GridSelectCheckbox
                        checked={selectedIds.includes(exp._id)}
                        onChange={() => toggleSelectOne(exp._id)}
                        title={`Select ${exp.title}`}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        isIconOnly
                        icon={<Pencil size={14} color="var(--accent-blue)" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOpen(exp);
                        }}
                        title="Edit"
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
                        title="Delete"
                      />
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
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
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        Rs. {formatNumber(exp.amount)}
                      </div>
                      <div
                        style={{ fontSize: "11px", color: "var(--text-muted)" }}
                      >
                        {formatDate(exp.expenseDate)}
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
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
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
