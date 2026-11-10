'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { Tournament } from '../../types';
import { getTournamentColumns } from '../../columns';
import { Header } from '../../components/Header';
import { fetchApi } from '../../lib/api';
import { formatDate, formatNumber } from '../../lib/format';
import { confirmDelete, confirmBulkDelete, showToast } from '../../lib/alerts';
import {
  Button,
  Badge,
  Input,
  Select,
  Modal,
  Card,
  DataTable,
  Pagination,
  ViewSwitcher,
  CardGridSkeleton,
  BulkActionBar,
  GridSelectCheckbox,
  ListToolbar,
} from '../../components/ui';
import {
  PencilIcon,
  TrashIcon,
} from '../../components/icons';
import { CreateTournamentModal } from '../../components/CreateTournamentModal';
import { EditTournamentModal } from '../../components/EditTournamentModal';
import { useIsMobile } from '../../lib/useMediaQuery';
import { getTournamentStatusVariant } from '../../constants/badgeVariants';
import {
  withAllOption,
  TOURNAMENT_STATUS_OPTIONS,
  EMPTY_VALUE,
} from '../../constants';
import { usePageSize } from '../../lib/usePageSize';

export default function TournamentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingTournament, setEditingTournament] = useState<any>(null);

  // React Queries
  const tournamentsQuery = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => {
      return fetchApi<{ success: boolean; tournaments: any[] }>('/tournaments');
    },
  });

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>('/teams'),
  });

  const tournaments = tournamentsQuery.data?.tournaments || [];
  const teams = teamsQuery.data?.teams || [];
  const loading = tournamentsQuery.isLoading || teamsQuery.isLoading;

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleEditOpen = (trn: any) => {
    setEditingTournament(trn);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDelete(`tournament "${name}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/tournaments/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast.success(`Tournament "${name}" deleted successfully.`);
        invalidateData();
      }
    } catch (err) {
      showToast.error('Failed to delete tournament.');
    }
  };

  const [preferredView, setViewMode] = useState<'grid' | 'table'>('table');
  // Phones always show the list; the List/Grid switch is hidden there (globals.css).
  const isMobile = useIsMobile();
  const viewMode = isMobile ? 'table' : preferredView;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmBulkDelete(selectedIds.length, 'Tournaments');
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => fetchApi(`/tournaments/${id}`, { method: 'DELETE' })));
      showToast.success(`${selectedIds.length} tournament(s) deleted successfully.`);
      setSelectedIds([]);
      invalidateData();
    } catch (err) {
      showToast.error('Failed to delete selected tournaments.');
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const [pageSize, setPageSize] = usePageSize('tournaments');

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.venue || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTournaments.length / pageSize) || 1;
  const paginatedTournaments = filteredTournaments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const tournamentColumns = useMemo(
    () =>
      getTournamentColumns({
        onEdit: handleEditOpen,
        onDelete: handleDelete,
      }),
    [handleEditOpen, handleDelete]
  );

  return (
    <>
      <Header
        title="Tournaments & Leagues Financials"
        subtitle="Manage Tournament Entries, Prize Returns, Dedicated Sponsors & Edit/Delete Records"
      />

      <div className="content-body">
        {/* Controls: Search, Status Filter, View Toggle, Add Button */}
        <ListToolbar
          search={{
            placeholder: 'Search tournaments or venues...',
            value: searchQuery,
            onChange: (value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            },
          }}
          filters={[
            {
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              },
              options: withAllOption('All Statuses', TOURNAMENT_STATUS_OPTIONS, 'all'),
            },
          ]}
          view={{ value: viewMode, onChange: setViewMode }}
          add={{ label: 'Add Tournament', onClick: () => setIsModalOpen(true) }}
        />

        <BulkActionBar
          selectedIds={selectedIds}
          pageItemIds={paginatedTournaments.map((trn: any) => trn._id)}
          allItemIds={filteredTournaments.map((trn: any) => trn._id)}
          itemLabel="Tournaments"
          onSelectChange={setSelectedIds}
          onBulkDelete={handleBulkDelete}
          deleting={isBulkDeleting}
        />

        {/* VIEW 1: TABLE (LIST) VIEW */}
        {viewMode === 'table' && (
          <div>
            <DataTable<Tournament>
              data={paginatedTournaments}
              loading={loading}
              keyExtractor={(trn: any) => trn._id}
              emptyMessage="No tournaments found matching criteria."
              onRowClick={(trn: any) => router.push(`/tournaments/${trn._id}`)}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              serialStartIndex={(currentPage - 1) * pageSize}
              columns={tournamentColumns}
            />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTournaments.length}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
            itemName="Tournaments"
          />
        </div>
      )}

      {/* VIEW 2: GRID (CARDS) VIEW */}
      {viewMode === 'grid' && (
        <div>
          {loading ? (
            <CardGridSkeleton count={4} />
          ) : (
            <div className="grid-2">
              {paginatedTournaments.map((trn) => {
              const isProfitable = (trn.financials?.netPnl || 0) >= 0;
              return (
                <Card key={trn._id} variant={isProfitable ? 'emerald' : 'amber'} style={{ position: 'relative' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Badge variant="purple">{trn.format}</Badge>
                        <Badge variant={getTournamentStatusVariant(trn.status)}>
                          {trn.status?.toUpperCase()}
                        </Badge>
                      </div>
                      <Link
                        href={`/tournaments/${trn._id}`}
                        style={{
                          fontSize: '19px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{trn.name}</span>
                      </Link>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginTop: '4px',
                        }}
                      >
                        <span>{trn.venue || EMPTY_VALUE}</span>
                        <span>•</span>
                        <span>{formatDate(trn.startDate)}</span>
                      </div>
                    </div>

                    <div className="action-group">
                      <GridSelectCheckbox
                        checked={selectedIds.includes(trn._id)}
                        onChange={() => toggleSelectOne(trn._id)}
                        title={`Select ${trn.name}`}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        isIconOnly
                        icon={<PencilIcon size={14} color="var(--accent-blue)" />}
                        onClick={() => handleEditOpen(trn)}
                        title="Edit Tournament"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        isIconOnly
                        icon={<TrashIcon size={14} />}
                        onClick={() => handleDelete(trn._id, trn.name)}
                        title="Delete Tournament"
                      />
                    </div>
                  </div>

                  {trn.notes && (
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-muted)',
                        marginBottom: '16px',
                        background: '#f8fafc',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {trn.notes}
                    </p>
                  )}

                  {/* Financial Breakdown Grid */}
                  <div
                    className="r-grid-4"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                      gap: '10px',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Squad Fees
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-green)' }}>
                        Rs. {formatNumber(trn.financials?.totalFeesCollected || 0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Entry Fee
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Rs. {formatNumber(trn.financials?.entryFee || trn.entryFee)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Match Costs
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-rose)' }}>
                        Rs. {formatNumber(trn.financials?.matchExpenses)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Prize Won
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-amber)' }}>
                        Rs. {formatNumber(trn.financials?.actualWinningPrizeWon || trn.actualWinningPrizeWon)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Net ROI
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: isProfitable ? 'var(--accent-green)' : 'var(--accent-rose)',
                        }}
                      >
                        {isProfitable ? '+' : ''}Rs. {formatNumber(trn.financials?.netPnl)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      Team: <strong style={{ color: 'var(--text-primary)' }}>{trn.teamId?.name || EMPTY_VALUE}</strong>
                    </div>
                    <div>
                      Matches: <strong style={{ color: 'var(--accent-blue)' }}>{trn.matchesPlayed || 0} Matches Recorded</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <Link href={`/tournaments/${trn._id}`} passHref legacyBehavior>
                      <Button
                        variant="secondary"
                        size="sm"
                      >
                        View Tournament Profile & Matches
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTournaments.length}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
            itemName="Tournaments"
          />
        </div>
      )}

        {/* Modal: Add Tournament */}
        <CreateTournamentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          teams={teams}
          onSuccess={invalidateData}
        />

        {/* Modal: Edit Tournament */}
        <EditTournamentModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingTournament(null);
          }}
          tournament={editingTournament}
          onSuccess={invalidateData}
        />
      </div>
    </>
  );
}
