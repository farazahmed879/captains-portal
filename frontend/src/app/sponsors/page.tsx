'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { Sponsor } from '../../types';
import { getSponsorColumns } from '../../columns';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  DataTable,
  Pagination,
  ViewSwitcher,
} from '../../components/ui';
import {
  Handshake,
  Plus,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  Search,
} from '../../components/icons';
import { SponsorTransactionModal, SponsorTxType } from '../../components/SponsorTransactionModal';
import { CreateSponsorModal } from '../../components/CreateSponsorModal';
import { EditSponsorModal } from '../../components/EditSponsorModal';

export default function SponsorsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingSponsor, setEditingSponsor] = useState<any>(null);
  const [txModal, setTxModal] = useState<{ open: boolean; type: SponsorTxType; sponsor: any }>({
    open: false,
    type: 'investment',
    sponsor: null,
  });
  const openTxModal = (sponsor: any, type: SponsorTxType) => setTxModal({ open: true, type, sponsor });

  // React Queries
  const sponsorsQuery = useQuery({
    queryKey: ['sponsors', { teamId: selectedTeamId }],
    queryFn: () => {
      const query = selectedTeamId ? `?teamId=${selectedTeamId}` : '';
      return fetchApi<{
        success: boolean;
        totalInvested: number;
        totalReturnsPaid: number;
        netRetained: number;
        sponsors: any[];
      }>(`/sponsors${query}`);
    },
  });

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>('/teams'),
  });

  const sponsors = sponsorsQuery.data?.sponsors || [];
  const totalInvested = sponsorsQuery.data?.totalInvested || 0;
  const totalReturnsPaid = sponsorsQuery.data?.totalReturnsPaid || 0;
  const netRetained = sponsorsQuery.data?.netRetained || 0;
  const teams = teamsQuery.data?.teams || [];
  const loading = sponsorsQuery.isLoading || teamsQuery.isLoading;

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['sponsors'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleEditOpen = (spons: any) => {
    setEditingSponsor(spons);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDelete(`sponsor "${name}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/sponsors/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast.success(`Sponsor "${name}" deleted.`);
        invalidateData();
      }
    } catch (err) {
      showToast.error('Failed to delete sponsor.');
    }
  };


  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [contractFilter, setContractFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const filteredSponsors = sponsors.filter(
    (s) => {
      const qMatch =
        (s.sponsorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contractType || '').toLowerCase().includes(searchQuery.toLowerCase());
      const cMatch = !contractFilter || s.contractType === contractFilter;
      return qMatch && cMatch;
    }
  );

  const totalPages = Math.ceil(filteredSponsors.length / pageSize) || 1;
  const paginatedSponsors = filteredSponsors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success' as const;
      case 'completed':
        return 'primary' as const;
      default:
        return 'warning' as const;
    }
  };

  const sponsorColumns = useMemo(
    () =>
      getSponsorColumns({
        onAddFunds: (spons) => openTxModal(spons, 'investment'),
        onPayout: (spons) => openTxModal(spons, 'payout'),
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
        title="Sponsors & Brand Grants"
        subtitle="Manage Brand Sponsorships, Deliverables & Full Edit/Delete Capabilities"
        selectedTeamId={selectedTeamId}
        onTeamChange={(id) => {
          setSelectedTeamId(id);
          setCurrentPage(1);
        }}
      />

      <div className="content-body">
        {/* Metric Cards */}
        <div className="grid-3">
          <StatCard
            variant="blue"
            title="Total Sponsorship Inflow"
            value={`Rs. ${fNum(totalInvested)}`}
            subtitle="Brand Partners Contributions"
            icon={<Handshake size={20} color="var(--accent-blue)" />}
          />
          <StatCard
            variant="rose"
            title="Payouts / Returns"
            value={`Rs. ${fNum(totalReturnsPaid)}`}
            subtitle="Prize shares returned to sponsors"
            icon={<RotateCcw size={20} color="var(--accent-rose)" />}
          />
          <StatCard
            variant="emerald"
            title="Net Retained Team Fund"
            value={`Rs. ${fNum(netRetained)}`}
            subtitle="Available club balance"
            icon={<DollarSign size={20} color="var(--accent-green)" />}
          />
        </div>

        {/* Action & Filter Toolbar */}
        <div className="filter-bar">
          <div className="filter-bar-left">
            <div style={{ width: '260px' }}>
              <Input
                placeholder="Search sponsor or brand..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search size={14} />}
              />
            </div>

            <div style={{ width: '190px' }}>
              <Select
                value={contractFilter}
                onChange={(e) => {
                  setContractFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Contracts' },
                  { value: 'jersey_front', label: 'Jersey Front' },
                  { value: 'jersey_back', label: 'Jersey Back' },
                  { value: 'sleeve', label: 'Sleeve' },
                  { value: 'tournament_banner', label: 'Tournament Banner' },
                  { value: 'equipment_kit', label: 'Equipment & Kit' },
                  { value: 'general_grant', label: 'General Grant' },
                ]}
              />
            </div>
          </div>

          <div className="filter-bar-right">
            <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />

            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Brand Sponsor
            </Button>
          </div>
        </div>

        {/* VIEW 1: TABLE (LIST) VIEW */}
        {viewMode === 'table' && (
          <div>
            <DataTable<Sponsor>
              data={paginatedSponsors}
              keyExtractor={(spons) => spons._id}
              emptyMessage="No sponsors found."
              onRowClick={(spons) => router.push(`/sponsors/${spons._id}`)}
              columns={sponsorColumns}
            />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSponsors.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Sponsors"
          />
        </div>
      )}

      {/* VIEW 2: GRID (CARDS) VIEW */}
      {viewMode === 'grid' && (
        <div>
          <div className="grid-2">
            {paginatedSponsors.map((spons) => (
              <Card key={spons._id} variant="purple">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Badge variant="purple" style={{ textTransform: 'capitalize' }}>
                        {spons.contractType.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(spons.status)}>
                        {spons.status.toUpperCase()}
                      </Badge>
                    </div>
                    <Link
                      href={`/sponsors/${spons._id}`}
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
                      <span>{spons.companyName || spons.sponsorName}</span>
                      <ExternalLink size={12} color="var(--accent-blue)" />
                    </Link>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Contact: {spons.sponsorName}
                    </div>
                  </div>

                  <div className="action-group">
                    <Button
                      variant="secondary"
                      size="sm"
                      isIconOnly
                      icon={<Pencil size={14} color="var(--accent-blue)" />}
                      onClick={() => handleEditOpen(spons)}
                      title="Edit Sponsor"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      isIconOnly
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDelete(spons._id, spons.companyName || spons.sponsorName)}
                      title="Delete Sponsor"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Amount Invested
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-blue)' }}>
                    Rs. {fNum(spons.amountInvested)}
                  </div>
                </div>

                {spons.deliverablesAgreed && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      marginBottom: '14px',
                      fontSize: '12.5px',
                    }}
                  >
                    <strong style={{ color: 'var(--accent-blue)' }}>Deliverables: </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{spons.deliverablesAgreed}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    Returns Paid: <strong style={{ color: 'var(--accent-rose)' }}>Rs. {fNum(spons.returnsPaid)}</strong>
                  </div>

                  <div className="action-group">
                    <Link href={`/sponsors/${spons._id}`} passHref legacyBehavior>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye size={12} color="var(--accent-blue)" />}
                      >
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="success"
                      size="sm"
                      icon={<Plus size={12} />}
                      onClick={() => openTxModal(spons, 'investment')}
                    >
                      Add Funds
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<RotateCcw size={12} />}
                      onClick={() => openTxModal(spons, 'payout')}
                    >
                      Payout
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSponsors.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Sponsors"
          />
        </div>
      )}

        {/* Modal: Add Sponsor */}
        <CreateSponsorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          teams={teams}
          onSuccess={invalidateData}
        />

        {/* Modal: Edit Sponsor */}
        <EditSponsorModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingSponsor(null);
          }}
          sponsor={editingSponsor}
          onSuccess={invalidateData}
        />

        {/* Ledger Modal: Add Funds / Payout */}
        <SponsorTransactionModal
          isOpen={txModal.open}
          onClose={() => setTxModal((m) => ({ ...m, open: false }))}
          sponsor={txModal.sponsor}
          defaultType={txModal.type}
          onSaved={() => invalidateData()}
        />
      </div>
    </>
  );
}
