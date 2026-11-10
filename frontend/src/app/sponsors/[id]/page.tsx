'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { SponsorTransaction } from '../../../types';
import { getSponsorTransactionColumns } from '../../../columns';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { Header } from '../../../components/Header';
import { StatCard } from '../../../components/StatCard';
import { fetchApi } from '../../../lib/api';
import { formatDate, formatNumber } from '../../../lib/format';
import { confirmDelete, showToast } from '../../../lib/alerts';
import { Button, Badge, Modal, Card, DataTable } from '../../../components/ui';
import { SponsorTransactionModal, SponsorTxType } from '../../../components/SponsorTransactionModal';
import { EditSponsorModal } from '../../../components/EditSponsorModal';
import { DetailNav } from '../../../components/DetailNav';

export default function SponsorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  // Edit Sponsor Modal state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  // Ledger transaction modal state
  const [txModal, setTxModal] = useState<{ open: boolean; type: SponsorTxType; tx: any | null }>({
    open: false,
    type: 'investment',
    tx: null,
  });

  // React Queries
  const sponsorQuery = useQuery({
    queryKey: queryKeys.sponsor(id),
    queryFn: () => fetchApi<{ success: boolean; sponsor: any }>(`/sponsors/${id}`),
    enabled: !!id,
  });

  const tourneysQuery = useQuery({
    queryKey: queryKeys.tournaments(),
    queryFn: () => fetchApi<{ success: boolean; tournaments: any[] }>('/tournaments'),
  });

  const sponsor = sponsorQuery.data?.sponsor;
  const tournaments = tourneysQuery.data?.tournaments || [];
  const loading = sponsorQuery.isLoading;

  const applySponsor = (s: any) => {
    queryClient.setQueryData(queryKeys.sponsor(id), { success: true, sponsor: s });
    queryClient.invalidateQueries({ queryKey: ['sponsors'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sponsor(id) });
    queryClient.invalidateQueries({ queryKey: ['sponsors'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const openTxModal = (type: SponsorTxType, tx: any = null) => setTxModal({ open: true, type, tx });

  const handleDeleteTx = async (tx: any) => {
    const label = tx.type === 'investment' ? 'investment' : 'payout';
    const confirmed = await confirmDelete(`${label} transaction of Rs. ${formatNumber(tx.amount)}`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean; sponsor: any }>(
        `/sponsors/${id}/transactions/${tx._id}`,
        { method: 'DELETE' }
      );
      if (res.success) {
        showToast.success('Transaction deleted.');
        applySponsor(res.sponsor);
      }
    } catch (err) {
      showToast.error('Failed to delete transaction.');
    }
  };

  const handleDeleteSponsor = async () => {
    const confirmed = await confirmDelete(`sponsor "${sponsor?.sponsorName}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/sponsors/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast.success(`Sponsor "${sponsor?.sponsorName}" deleted.`);
        router.push('/sponsors');
      }
    } catch (err) {
      showToast.error('Failed to delete sponsor.');
    }
  };

  const transactionColumns = useMemo(
    () =>
      getSponsorTransactionColumns({
        onEdit: (t: SponsorTransaction) => openTxModal(t.type as any, t),
        onDelete: handleDeleteTx,
      }),
    [id]
  );

  if (loading) {
    return (
      <div>
        <Header title="Sponsor Profile" subtitle="Sponsorship grants, payouts & transaction ledger" />
        <div className="content-body"><DetailPageSkeleton /></div>
      </div>
    );
  }

  if (!sponsor) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--accent-rose)' }}>
        Sponsor not found. <Link href="/sponsors">Back to Sponsors</Link>
      </div>
    );
  }

  const invested = sponsor.amountInvested || 0;
  const returned = sponsor.returnsPaid || 0;
  const netRetained = invested - returned;
  const retainedPct = invested > 0 ? Math.round((netRetained / invested) * 100) : 0;

  // Build ledger with running balance (chronological), then show newest first
  const txs: any[] = [...(sponsor.transactions || [])].sort((a, b) => {
    const d = new Date(a.date).getTime() - new Date(b.date).getTime();
    return d !== 0 ? d : new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
  let running = 0;
  const ledgerRows = txs
    .map((t) => {
      running += t.type === 'investment' ? t.amount : -t.amount;
      return { ...t, balance: running };
    })
    .reverse();
  const investmentCount = txs.filter((t) => t.type === 'investment').length;
  const payoutCount = txs.length - investmentCount;

  return (
    <>
      <Header
        title={`${sponsor.sponsorName} - Profile`}
        subtitle="Sponsor Investment Profile, Contract Terms & Return Payout Ledger"
      />

      <div className="content-body">
        <DetailNav back={{ href: "/sponsors", label: "Back to All Sponsors" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Sponsor
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteSponsor}
          >
            Delete
          </Button>
        </DetailNav>

        {/* Hero Card */}
        <Card className="detail-hero" style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                className="detail-avatar"
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '16px',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                }}
              >
                {(sponsor.companyName || sponsor.sponsorName || 'S').substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Badge variant="purple">
                    {sponsor.contractType
                      ? sponsor.contractType.replace(/_/g, ' ').toUpperCase()
                      : 'GENERAL GRANT'}
                  </Badge>
                  <Badge
                    variant={
                      sponsor.status === 'active'
                        ? 'success'
                        : sponsor.status === 'fulfilled'
                        ? 'primary'
                        : 'secondary'
                    }
                  >
                    {sponsor.status ? sponsor.status.toUpperCase() : 'ACTIVE'}
                  </Badge>
                  {sponsor.companyName && (
                    <Badge variant="secondary">
                      {sponsor.companyName}
                    </Badge>
                  )}
                </div>

                <h1
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  {sponsor.sponsorName}
                </h1>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    flexWrap: 'wrap',
                  }}
                >
                  {sponsor.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {sponsor.phone}
                    </span>
                  )}
                  {sponsor.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {sponsor.email}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    First Investment:{' '}
                    {sponsor.investmentDate
                      ? formatDate(sponsor.investmentDate, 'N/A')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Linked entities pill bar */}
          <div
            style={{
              marginTop: '16px',
              padding: '10px 14px',
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {sponsor.teamId && (
              <div>
                Franchise Team:{' '}
                <Link
                  href={`/teams/${sponsor.teamId._id}`}
                  style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  {sponsor.teamId.name}
                </Link>
              </div>
            )}
            {sponsor.tournamentId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Sponsored Tournament: </span>
                <Link
                  href={`/tournaments/${sponsor.tournamentId._id}`}
                  style={{
                    color: 'var(--accent-blue)',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  {sponsor.tournamentId.name}
                </Link>
              </div>
            )}
            {sponsor.returnDate && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Last Payout Date: {formatDate(sponsor.returnDate)}
              </div>
            )}
          </div>
        </Card>

        {/* 3 Stat Cards (status & contract type are shown as badges in the hero) */}
        <div className="grid-3" style={{ marginBottom: '24px' }}>
          <StatCard
            variant="blue"
            title="Capital Invested"
            value={`Rs. ${formatNumber(invested)}`}
            subtitle={`${investmentCount} contribution${investmentCount === 1 ? '' : 's'}`}
          />
          <StatCard
            variant="rose"
            title="Returns Paid Out"
            value={`Rs. ${formatNumber(returned)}`}
            subtitle={`${payoutCount} payout${payoutCount === 1 ? '' : 's'}`}
          />
          <StatCard
            variant="emerald"
            title="Net Retained Funds"
            value={`Rs. ${formatNumber(netRetained)}`}
            subtitle={`${retainedPct}% Retained`}
          />
        </div>

        {/* Sponsor Ledger */}
        <Card style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Sponsor Ledger
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                ({txs.length} transaction{txs.length === 1 ? '' : 's'})
              </span>
            </h3>
            <div className="action-group">
              <Button variant="success" size="sm" onClick={() => openTxModal('investment')}>
                Add Funds
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openTxModal('payout')}
              >
                Payout
              </Button>
            </div>
          </div>

          <DataTable<SponsorTransaction>
            data={ledgerRows}
            keyExtractor={(t: any) => t._id}
            emptyMessage="No transactions yet. Click “Add Funds” to record the first investment."
            columns={transactionColumns}
          />
        </Card>

        {/* 2-Columns: Contract Deliverables & Notes */}
        <div className="r-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Deliverables Card */}
          <Card>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Agreed Deliverables & Visibility
            </h3>

            <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {sponsor.deliverablesAgreed ? (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {sponsor.deliverablesAgreed}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No special deliverables or kit branding requirements specified.
                </div>
              )}
            </div>
          </Card>

          {/* Notes & Payout History */}
          <Card>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Captain Notes
            </h3>

            <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {sponsor.notes ? (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {sponsor.notes}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No internal notes recorded.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Sponsor Modal */}
      <EditSponsorModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        sponsor={sponsor}
        onSuccess={invalidateData}
      />

      {/* Ledger Transaction Modal (Add Funds / Payout / Edit) */}
      <SponsorTransactionModal
        isOpen={txModal.open}
        onClose={() => setTxModal((m) => ({ ...m, open: false }))}
        sponsor={sponsor}
        defaultType={txModal.type}
        transaction={txModal.tx}
        tournaments={tournaments}
        onSaved={applySponsor}
      />
    </>
  );
}
