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
import { confirmDelete, showToast } from '../../../lib/alerts';
import {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  Modal,
  Card,
  DataTable,

} from '../../../components/ui';
import {
  Handshake,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  Trophy,
  FileText,
  Plus,
  RotateCcw,
  Receipt,
} from '../../../components/icons';
import {
  SponsorTransactionModal,
  SponsorTxType,
  paymentMethodLabel,
} from '../../../components/SponsorTransactionModal';
import { EditSponsorModal } from '../../../components/EditSponsorModal';

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
    const confirmed = await confirmDelete(`${label} transaction of Rs. ${fNum(tx.amount)}`);
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

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

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

  const transactionColumns = useMemo(
    () =>
      getSponsorTransactionColumns({
        onEdit: (t: SponsorTransaction) => openTxModal(t.type as any, t),
        onDelete: handleDeleteTx,
        fNum,
      }),
    [fNum]
  );

  return (
    <>
      <Header
        title={`${sponsor.sponsorName} - Profile`}
        subtitle="Sponsor Investment Profile, Contract Terms & Return Payout Ledger"
      />

      <div className="content-body">
        {/* Navigation & Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Link href="/sponsors" passHref legacyBehavior>
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />}>
              Back to All Sponsors
            </Button>
          </Link>

          <div className="action-group">
            <Button
              variant="primary"
              size="sm"
              id="sponsor-add-funds"
              icon={<Plus size={13} />}
              onClick={() => openTxModal('investment')}
            >
              Add Funds
            </Button>
            <Button
              variant="secondary"
              size="sm"
              id="sponsor-record-payout"
              icon={<RotateCcw size={13} color="var(--accent-rose)" />}
              onClick={() => openTxModal('payout')}
            >
              Record Payout
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil size={13} color="var(--accent-blue)" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Sponsor
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={handleDeleteSponsor}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Hero Card */}
        <Card style={{ marginBottom: '24px' }}>
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
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #059669, #0284c7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#fff',
                  boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
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
                    <Badge variant="secondary" icon={<Building2 size={11} />}>
                      {sponsor.companyName}
                    </Badge>
                  )}
                </div>

                <h1
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
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
                      <Phone size={13} color="var(--accent-blue)" />
                      {sponsor.phone}
                    </span>
                  )}
                  {sponsor.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={13} />
                      {sponsor.email}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    First Investment:{' '}
                    {sponsor.investmentDate
                      ? new Date(sponsor.investmentDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Retained Box */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Net Retained Capital
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  fontFamily: 'Outfit, sans-serif',
                  color: 'var(--accent-green)',
                }}
              >
                Rs. {fNum(netRetained)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {retainedPct}% of Total Inflow Retained
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
                <Trophy size={14} color="var(--accent-blue)" />
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
                Last Payout Date: {new Date(sponsor.returnDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </Card>

        {/* 4 Stat Cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <StatCard
            variant="blue"
            title="Capital Invested"
            value={`Rs. ${fNum(invested)}`}
            subtitle={`${investmentCount} contribution${investmentCount === 1 ? '' : 's'}`}
            icon={<TrendingUp size={20} color="var(--accent-blue)" />}
          />
          <StatCard
            variant="rose"
            title="Returns Paid Out"
            value={`Rs. ${fNum(returned)}`}
            subtitle={`${payoutCount} payout${payoutCount === 1 ? '' : 's'}`}
            icon={<TrendingDown size={20} color="var(--accent-rose)" />}
          />
          <StatCard
            variant="emerald"
            title="Net Retained Funds"
            value={`Rs. ${fNum(netRetained)}`}
            subtitle={`${retainedPct}% Retained`}
            icon={<DollarSign size={20} color="var(--accent-green)" />}
          />
          <StatCard
            variant="purple"
            title="Contract Status"
            value={sponsor.status ? sponsor.status.toUpperCase() : 'ACTIVE'}
            subtitle={sponsor.contractType?.replace(/_/g, ' ') || 'Grant'}
            icon={<CheckCircle2 size={20} color="var(--accent-purple)" />}
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
              <Receipt size={16} color="var(--accent-blue)" />
              Sponsor Ledger
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                ({txs.length} transaction{txs.length === 1 ? '' : 's'})
              </span>
            </h3>
            <div className="action-group">
              <Button variant="success" size="sm" icon={<Plus size={12} />} onClick={() => openTxModal('investment')}>
                Add Funds
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw size={12} color="var(--accent-rose)" />}
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
              <FileText size={16} color="var(--accent-blue)" />
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
              <Handshake size={16} color="var(--accent-purple)" />
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
