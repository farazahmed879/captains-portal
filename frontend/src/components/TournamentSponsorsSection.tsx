'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { confirmDelete, showToast } from '../lib/alerts';
import { formatCurrency } from '../lib/format';
import { SPONSOR_CONTRACT_OPTIONS, getPaymentMethodLabel } from '../constants';
import { Button, Badge, Modal, Select, DataTable } from './ui';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  PencilIcon,
  TrashIcon,
  ExternalLinkIcon,
} from './icons';
import { SponsorTransactionModal, SponsorTxType } from './SponsorTransactionModal';
import { CreateSponsorModal } from './CreateSponsorModal';
import { EditSponsorModal } from './EditSponsorModal';

interface TournamentSponsorsSectionProps {
  tournament: any;
  /** Sponsors linked to this tournament, enriched by the API with tournamentInvested / tournamentPaidOut */
  sponsors: any[];
  /** Tournament-scoped ledger entries (oldest first) */
  ledger: any[];
  teams: any[];
  onChanged: () => void;
}

const contractLabel = (value?: string) =>
  SPONSOR_CONTRACT_OPTIONS.find((o) => o.value === value)?.label || 'Sponsorship';

export const TournamentSponsorsSection: React.FC<TournamentSponsorsSectionProps> = ({
  tournament,
  sponsors,
  ledger,
  teams,
  onChanged,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<any | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSponsorId, setPickerSponsorId] = useState('');
  const [txModal, setTxModal] = useState<{
    open: boolean;
    type: SponsorTxType;
    sponsor: any | null;
    tx: any | null;
  }>({ open: false, type: 'investment', sponsor: null, tx: null });

  // All tenant sponsors, so funds can be added from any existing sponsor
  const allSponsorsQuery = useQuery({
    queryKey: queryKeys.sponsors(),
    queryFn: () => fetchApi<{ success: boolean; sponsors: any[] }>('/sponsors'),
  });
  const allSponsors = allSponsorsQuery.data?.sponsors || [];

  const totals = useMemo(() => {
    const received = sponsors.reduce((s, sp) => s + (sp.tournamentInvested || 0), 0);
    const paidOut = sponsors.reduce((s, sp) => s + (sp.tournamentPaidOut || 0), 0);
    return { received, paidOut, net: received - paidOut };
  }, [sponsors]);

  // Ledger with running balance; displayed newest first
  const ledgerRows = useMemo(() => {
    let running = 0;
    const withBalance = ledger.map((e) => {
      running += (e.type === 'investment' ? 1 : -1) * (e.amount || 0);
      return { ...e, balance: running };
    });
    return withBalance.reverse();
  }, [ledger]);

  const findSponsor = (id: string) =>
    sponsors.find((s) => String(s._id) === String(id)) ||
    allSponsors.find((s) => String(s._id) === String(id)) ||
    null;

  const openTx = (sponsor: any, type: SponsorTxType, tx: any = null) =>
    setTxModal({ open: true, type, sponsor, tx });

  const handlePickerContinue = () => {
    const sponsor = findSponsor(pickerSponsorId);
    if (!sponsor) return;
    setPickerOpen(false);
    setPickerSponsorId('');
    openTx(sponsor, 'investment');
  };

  const handleDeleteEntry = async (entry: any) => {
    const name = entry.companyName || entry.sponsorName;
    const confirmed = await confirmDelete(
      `ledger entry of ${formatCurrency(entry.amount)}`,
      `Remove this ${entry.type === 'investment' ? 'funding' : 'payout'} entry for ${name}? Sponsor totals will be recalculated.`
    );
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(
        `/sponsors/${entry.sponsorId}/transactions/${entry._id}`,
        { method: 'DELETE' }
      );
      if (res.success) {
        showToast.success('Ledger entry removed.');
        onChanged();
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to remove ledger entry.');
    }
  };

  const sectionHeader = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Building2 size={16} color="#8b5cf6" />
        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          Dedicated Sponsors ({sponsors.length})
        </h3>
      </div>
      <div className="action-group">
        <Button variant="success" size="sm" icon={<Plus size={13} />} onClick={() => setPickerOpen(true)}>
          Add Sponsor Funds
        </Button>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setIsCreateOpen(true)}>
          New Sponsor
        </Button>
      </div>
    </div>
  );

  const summaryCard = (label: string, value: string, bg: string, border: string, labelColor: string, valueColor: string) => (
    <div style={{ padding: '8px 12px', background: bg, border: `1px solid ${border}`, borderRadius: '8px' }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: labelColor,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 800, color: valueColor, marginTop: '1px' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ marginBottom: '20px' }}>
      {sectionHeader}

      {/* Totals */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        {summaryCard('Funds Received', formatCurrency(totals.received), '#f0fdf4', '#dcfce7', '#166534', '#16a34a')}
        {summaryCard('Paid Out to Sponsors', formatCurrency(totals.paidOut), '#fff1f2', '#ffe4e6', '#9f1239', '#e11d48')}
        {summaryCard('Net Sponsor Balance', formatCurrency(totals.net), '#f5f3ff', '#ede9fe', '#5b21b6', '#7c3aed')}
        {summaryCard('Ledger Entries', String(ledger.length), '#f8fafc', '#e2e8f0', '#475569', '#0f172a')}
      </div>

      {/* Sponsor cards */}
      {sponsors.length === 0 ? (
        <div
          style={{
            padding: '20px 14px',
            textAlign: 'center',
            border: '1px dashed #cbd5e1',
            borderRadius: '10px',
            background: '#f8fafc',
            color: 'var(--text-muted)',
            fontSize: '12.5px',
            marginBottom: '14px',
          }}
        >
          No sponsors funding this tournament yet. Click <strong>Add Sponsor Funds</strong> to record money from an
          existing sponsor, or <strong>New Sponsor</strong> to register a dedicated one.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          {sponsors.map((s) => (
            <div
              key={s._id}
              style={{
                padding: '10px 12px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                <div style={{ minWidth: 0 }}>
                  <Link
                    href={`/sponsors/${s._id}`}
                    style={{
                      fontWeight: 700,
                      fontSize: '13.5px',
                      color: '#0f172a',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>{s.companyName || s.sponsorName}</span>
                    <ExternalLinkIcon size={10} />
                  </Link>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {s.companyName ? `${s.sponsorName} · ` : ''}
                    {contractLabel(s.contractType)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    icon={<PencilIcon size={12} color="var(--accent-blue)" />}
                    title="Edit Sponsor Details"
                    onClick={() => setEditingSponsor(findSponsor(s._id) || s)}
                    style={{ height: '22px', width: '22px', padding: 0 }}
                  />
                  <Badge variant={s.isDedicated ? 'purple' : 'primary'} style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                    {s.isDedicated ? 'Dedicated' : 'Contributor'}
                  </Badge>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  margin: '8px 0',
                  padding: '6px 8px',
                  background: '#f8fafc',
                  borderRadius: '6px',
                }}
              >
                <div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Received</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a' }}>
                    {formatCurrency(s.tournamentInvested)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Paid Out</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#e11d48' }}>
                    {formatCurrency(s.tournamentPaidOut)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Net</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed' }}>
                    {formatCurrency(s.tournamentNet)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  variant="success"
                  size="sm"
                  icon={<TrendingUp size={12} />}
                  onClick={() => openTx(s, 'investment')}
                  style={{ flex: 1, height: '28px', fontSize: '11.5px', padding: '0 8px' }}
                >
                  Add Funds
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<TrendingDown size={12} />}
                  onClick={() => openTx(s, 'payout')}
                  style={{ flex: 1, height: '28px', fontSize: '11.5px', padding: '0 8px' }}
                >
                  Payout
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ledger Header & Compact Table */}
      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
        Sponsor Funding Ledger
      </div>
      <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#ffffff' }}>
        <DataTable<any>
          className="compact-table"
          data={ledgerRows}
          keyExtractor={(e) => String(e._id)}
          emptyMessage="No sponsor transactions recorded for this tournament yet."
          columns={[
            {
              header: 'Date',
              width: '12%',
              render: (e) => (
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  {new Date(e.date).toLocaleDateString()}
                </span>
              ),
            },
            {
              header: 'Sponsor',
              width: '20%',
              render: (e) => (
                <Link
                  href={`/sponsors/${e.sponsorId}`}
                  style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', textDecoration: 'none' }}
                >
                  {e.companyName || e.sponsorName}
                </Link>
              ),
            },
            {
              header: 'Type',
              width: '12%',
              render: (e) => (
                <Badge variant={e.type === 'investment' ? 'success' : 'danger'} style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                  {e.type === 'investment' ? 'Funds In' : 'Payout'}
                </Badge>
              ),
            },
            {
              header: 'Method / Ref',
              width: '18%',
              render: (e) => (
                <div style={{ fontSize: '11.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{getPaymentMethodLabel(e.method)}</span>
                  {e.reference && <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>#{e.reference}</span>}
                </div>
              ),
            },
            {
              header: 'Notes',
              width: '16%',
              render: (e) => (
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{e.notes || '—'}</span>
              ),
            },
            {
              header: 'Amount',
              width: '11%',
              align: 'right',
              render: (e) => (
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '12px',
                    color: e.type === 'investment' ? '#16a34a' : '#e11d48',
                  }}
                >
                  {e.type === 'investment' ? '+' : '−'} {formatCurrency(e.amount)}
                </span>
              ),
            },
            {
              header: 'Balance',
              width: '11%',
              align: 'right',
              render: (e) => (
                <span style={{ fontWeight: 700, fontSize: '12px', color: e.balance < 0 ? '#e11d48' : '#0f172a' }}>
                  {formatCurrency(e.balance)}
                </span>
              ),
            },
            {
              header: 'Actions',
              width: '10%',
              align: 'right',
              render: (e) => (
                <div className="action-group" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    isIconOnly
                    icon={<PencilIcon size={11} color="var(--accent-blue)" />}
                    title="Edit entry"
                    onClick={() => {
                      const sponsor = findSponsor(e.sponsorId);
                      if (sponsor) openTx(sponsor, e.type, { ...e, tournamentId: tournament._id });
                    }}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    isIconOnly
                    icon={<TrashIcon size={11} />}
                    title="Delete entry"
                    onClick={() => handleDeleteEntry(e)}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Picker: choose an existing sponsor to add funds from */}
      <Modal
        isOpen={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setPickerSponsorId('');
        }}
        title={`Add Sponsor Funds — ${tournament.name}`}
        subtitle="Choose the sponsor who is contributing money to this tournament"
        maxWidth="520px"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setPickerOpen(false);
                setPickerSponsorId('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePickerContinue} disabled={!pickerSponsorId}>
              Continue
            </Button>
          </>
        }
      >
        <div className="form-stack">
          <Select
            label="Sponsor *"
            searchable
            searchPlaceholder="Search sponsor or company..."
            placeholder={allSponsorsQuery.isLoading ? 'Loading sponsors...' : 'Select sponsor...'}
            value={pickerSponsorId}
            onChange={(e) => setPickerSponsorId(e.target.value)}
            options={[
              { value: '', label: 'Select sponsor...' },
              ...allSponsors.map((s) => ({
                value: s._id,
                label: s.companyName ? `${s.companyName} (${s.sponsorName})` : s.sponsorName,
              })),
            ]}
          />
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Sponsor not listed?{' '}
            <button
              type="button"
              onClick={() => {
                setPickerOpen(false);
                setIsCreateOpen(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--accent-blue)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Register a new sponsor
            </button>
          </div>
        </div>
      </Modal>

      {/* Add funds / payout / edit ledger entry (pre-linked to this tournament) */}
      <SponsorTransactionModal
        isOpen={txModal.open}
        onClose={() => setTxModal((m) => ({ ...m, open: false }))}
        sponsor={txModal.sponsor}
        defaultType={txModal.type}
        transaction={txModal.tx}
        tournaments={[tournament]}
        defaultTournamentId={tournament._id}
        onSaved={() => {
          showToast.success(txModal.tx ? 'Ledger entry updated.' : 'Sponsor ledger updated.');
          onChanged();
        }}
      />

      {/* Register a new sponsor dedicated to this tournament */}
      <CreateSponsorModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        teams={teams}
        tournament={tournament}
        onSuccess={() => {
          showToast.success('Sponsor added to this tournament.');
          onChanged();
        }}
      />

      {/* Edit sponsor profile & details */}
      <EditSponsorModal
        isOpen={!!editingSponsor}
        onClose={() => setEditingSponsor(null)}
        sponsor={editingSponsor}
        teams={teams}
        tournaments={[tournament]}
        onSuccess={() => {
          showToast.success('Sponsor updated.');
          onChanged();
        }}
      />
    </div>
  );
};

