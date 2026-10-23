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
import { confirmDelete, showToast } from '../../lib/alerts';
import {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  Modal,
  Card,
  DataTable,
  Pagination,
  ViewSwitcher,
} from '../../components/ui';
import {
  PlusIcon,
  SearchIcon,
  ExternalLinkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
} from '../../components/icons';
import { CreateTournamentModal } from '../../components/CreateTournamentModal';
import { EditTournamentModal } from '../../components/EditTournamentModal';

export default function TournamentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingTournament, setEditingTournament] = useState<any>(null);

  // React Queries
  const tournamentsQuery = useQuery({
    queryKey: ['tournaments', { teamId: selectedTeamId }],
    queryFn: () => {
      const query = selectedTeamId ? `?teamId=${selectedTeamId}` : '';
      return fetchApi<{ success: boolean; tournaments: any[] }>(`/tournaments${query}`);
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

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

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

  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'champions':
        return 'gold' as const;
      case 'ongoing':
        return 'primary' as const;
      case 'completed':
        return 'success' as const;
      default:
        return 'warning' as const;
    }
  };

  const tournamentColumns = useMemo(
    () =>
      getTournamentColumns({
        onEdit: handleEditOpen,
        onDelete: handleDelete,
        getStatusBadgeVariant,
        fNum,
      }),
    [fNum]
  );

  return (
    <>
      <Header
        title="Tournaments & Leagues Financials"
        subtitle="Manage Tournament Entries, Prize Returns, Dedicated Sponsors & Edit/Delete Records"
        selectedTeamId={selectedTeamId}
        onTeamChange={(id) => {
          setSelectedTeamId(id);
          setCurrentPage(1);
        }}
      />

      <div className="content-body">
        {/* Controls: Search, Status Filter, View Toggle, Add Button */}
        <div className="filter-bar">
          <div className="filter-bar-left">
            <div style={{ width: '260px' }}>
              <Input
                placeholder="Search tournaments or venues..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<SearchIcon size={14} />}
              />
            </div>

            <div style={{ width: '190px' }}>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'ongoing', label: 'Ongoing Tournaments' },
                  { value: 'champions', label: 'Champions (Won)' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>
          </div>

          <div className="filter-bar-right">
            <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />

            <Button
              variant="primary"
              size="sm"
              icon={<PlusIcon size={15} />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Tournament
            </Button>
          </div>
        </div>

        {/* VIEW 1: TABLE (LIST) VIEW */}
        {viewMode === 'table' && (
          <div>
            <DataTable<Tournament>
              data={paginatedTournaments}
              keyExtractor={(trn: any) => trn._id}
              emptyMessage="No tournaments found matching criteria."
              onRowClick={(trn: any) => router.push(`/tournaments/${trn._id}`)}
              columns={tournamentColumns}
            />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTournaments.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Tournaments"
          />
        </div>
      )}

      {/* VIEW 2: GRID (CARDS) VIEW */}
      {viewMode === 'grid' && (
        <div>
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
                        <Badge variant={getStatusBadgeVariant(trn.status)}>
                          {trn.status?.toUpperCase()}
                        </Badge>
                      </div>
                      <Link
                        href={`/tournaments/${trn._id}`}
                        style={{
                          fontSize: '19px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{trn.name}</span>
                        <ExternalLinkIcon size={12} color="var(--accent-blue)" />
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
                        <MapPinIcon size={12} />
                        <span>{trn.venue || 'Karachi Grounds'}</span>
                        <span>•</span>
                        <CalendarIcon size={12} />
                        <span>{new Date(trn.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="action-group">
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
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
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
                        Entry Fee
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Rs. {fNum(trn.financials?.entryFee || trn.entryFee)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Match Costs
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-rose)' }}>
                        Rs. {fNum(trn.financials?.matchExpenses)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Prize Won
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)' }}>
                        Rs. {fNum(trn.financials?.actualWinningPrizeWon || trn.actualWinningPrizeWon)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Net ROI
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: isProfitable ? 'var(--accent-green)' : 'var(--accent-rose)',
                        }}
                      >
                        {isProfitable ? '+' : ''}Rs. {fNum(trn.financials?.netPnl)}
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
                      Team: <strong style={{ color: 'var(--text-primary)' }}>{trn.teamId?.name || 'Gulzar Cricket Team'}</strong>
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
                        icon={<EyeIcon size={12} color="var(--accent-blue)" />}
                      >
                        View Tournament Profile & Matches
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTournaments.length}
            pageSize={pageSize}
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
