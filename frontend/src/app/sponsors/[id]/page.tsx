'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { StatCard } from '../../../components/StatCard';
import { fetchApi } from '../../../lib/api';
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

export default function SponsorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [sponsor, setSponsor] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Sponsor Modal state (profile fields only – money is managed via the ledger)
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    sponsorName: '',
    companyName: '',
    phone: '',
    email: '',
    contractType: 'general_grant',
    deliverablesAgreed: '',
    status: 'active',
    notes: '',
  });

  // Ledger transaction modal state
  const [txModal, setTxModal] = useState<{ open: boolean; type: SponsorTxType; tx: any | null }>({
    open: false,
    type: 'investment',
    tx: null,
  });
  const [tournaments, setTournaments] = useState<any[]>([]);

  const applySponsor = (s: any) => {
    setSponsor(s);
    setEditFormData({
      sponsorName: s.sponsorName || '',
      companyName: s.companyName || '',
      phone: s.phone || '',
      email: s.email || '',
      contractType: s.contractType || 'general_grant',
      deliverablesAgreed: s.deliverablesAgreed || '',
      status: s.status || 'active',
      notes: s.notes || '',
    });
  };

  const loadSponsor = () => {
    if (!id) return;
    setLoading(true);
    fetchApi<{ success: boolean; sponsor: any }>(`/sponsors/${id}`)
      .then((res) => {
        if (res.success) applySponsor(res.sponsor);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSponsor();
    fetchApi<{ success: boolean; tournaments: any[] }>('/tournaments')
      .then((res) => res.success && setTournaments(res.tournaments || []))
      .catch(() => {});
  }, [id]);

  const handleUpdateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/sponsors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadSponsor();
      }
    } catch (err) {
      alert('Failed to update sponsor');
    }
  };

  const openTxModal = (type: SponsorTxType, tx: any = null) => setTxModal({ open: true, type, tx });

  const handleDeleteTx = async (tx: any) => {
    const label = tx.type === 'investment' ? 'investment' : 'payout';
    if (!confirm(`Delete this ${label} of Rs. ${fNum(tx.amount)}? Totals will be recalculated.`)) return;
    try {
      const res = await fetchApi<{ success: boolean; sponsor: any }>(
        `/sponsors/${id}/transactions/${tx._id}`,
        { method: 'DELETE' }
      );
      if (res.success) applySponsor(res.sponsor);
    } catch (err) {
      alert('Failed to delete transaction');
    }
  };

  const handleDeleteSponsor = async () => {
    if (!confirm(`Are you sure you want to delete sponsor "${sponsor?.sponsorName}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/sponsors/${id}`, { method: 'DELETE' });
      if (res.success) {
        router.push('/sponsors');
      }
    } catch (err) {
      alert('Failed to delete sponsor');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading Sponsor Profile...
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
                🤝
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Method / Ref</TableHead>
                <TableHead align="right">Inflow</TableHead>
                <TableHead align="right">Outflow</TableHead>
                <TableHead align="right">Balance</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerRows.length === 0 ? (
                <TableEmpty colSpan={8} message="No transactions yet. Click “Add Funds” to record the first investment." />
              ) : (
                ledgerRows.map((t) => {
                  const isIn = t.type === 'investment';
                  return (
                    <TableRow key={t._id}>
                      <TableCell style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600 }}>{new Date(t.date).toLocaleDateString()}</div>
                        {t.createdAt && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Logged {new Date(t.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isIn ? 'success' : 'danger'}>{isIn ? 'INVESTMENT' : 'PAYOUT'}</Badge>
                      </TableCell>
                      <TableCell style={{ maxWidth: '280px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {t.notes || (isIn ? 'Sponsorship funds received' : 'Return paid to sponsor')}
                        {t.tournamentId?.name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Trophy size={11} color="var(--accent-blue)" />
                            <Link href={`/tournaments/${t.tournamentId._id}`} style={{ color: 'var(--accent-blue)' }}>
                              {t.tournamentId.name}
                            </Link>
                          </div>
                        )}
                      </TableCell>
                      <TableCell style={{ fontSize: '12.5px' }}>
                        <div>{paymentMethodLabel(t.method)}</div>
                        {t.reference && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{t.reference}</div>
                        )}
                      </TableCell>
                      <TableCell align="right" style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                        {isIn ? `+ Rs. ${fNum(t.amount)}` : '—'}
                      </TableCell>
                      <TableCell align="right" style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>
                        {!isIn ? `− Rs. ${fNum(t.amount)}` : '—'}
                      </TableCell>
                      <TableCell
                        align="right"
                        style={{
                          fontWeight: 800,
                          color: t.balance < 0 ? 'var(--accent-rose)' : 'var(--text-primary)',
                        }}
                      >
                        Rs. {fNum(t.balance)}
                      </TableCell>
                      <TableCell align="right">
                        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            isIconOnly
                            icon={<Pencil size={12} color="var(--accent-blue)" />}
                            onClick={() => openTxModal(t.type, t)}
                            title="Edit entry"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            isIconOnly
                            icon={<Trash2 size={12} />}
                            onClick={() => handleDeleteTx(t)}
                            title="Delete entry"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* 2-Columns: Contract Deliverables & Notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Sponsor: ${sponsor.sponsorName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateSponsor}>
              Save Sponsor
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateSponsor}>
          <div className="grid-2">
            <Input
              label="Sponsor Contact Name *"
              value={editFormData.sponsorName}
              onChange={(e) => setEditFormData({ ...editFormData, sponsorName: e.target.value })}
              required
            />
            <Input
              label="Company / Brand Name"
              value={editFormData.companyName}
              onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <Input
              label="Phone"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <Select
              label="Status"
              value={editFormData.status}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              options={[
                { value: 'pledged', label: 'Pledged' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
            <Select
              label="Contract Type"
              value={editFormData.contractType}
              onChange={(e) =>
                setEditFormData({ ...editFormData, contractType: e.target.value })
              }
              options={[
                { value: 'jersey_front', label: 'Jersey Front Chest Logo' },
                { value: 'jersey_back', label: 'Jersey Back Logo' },
                { value: 'sleeve', label: 'Sleeve Logo' },
                { value: 'tournament_banner', label: 'Tournament Banners' },
                { value: 'equipment_kit', label: 'Equipment & Kit Bag' },
                { value: 'general_grant', label: 'General Annual Grant' },
              ]}
            />
          </div>

          <div
            style={{
              marginBottom: '14px',
              padding: '10px 12px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
            }}
          >
            💡 Invested amount &amp; payouts are calculated from the ledger. Use <strong>Add Funds</strong> or{' '}
            <strong>Record Payout</strong> to change them.
          </div>

          <Textarea
            label="Deliverables Agreed"
            rows={2}
            value={editFormData.deliverablesAgreed}
            onChange={(e) =>
              setEditFormData({ ...editFormData, deliverablesAgreed: e.target.value })
            }
          />

          <Textarea
            label="Notes"
            rows={2}
            value={editFormData.notes}
            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
          />
        </form>
      </Modal>

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
