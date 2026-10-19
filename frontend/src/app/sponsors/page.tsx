'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { StatCard } from '../../components/StatCard';
import { fetchApi } from '../../lib/api';
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

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [totalInvested, setTotalInvested] = useState<number>(0);
  const [totalReturnsPaid, setTotalReturnsPaid] = useState<number>(0);
  const [netRetained, setNetRetained] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [selectedSponsor, setSelectedSponsor] = useState<any>(null);

  const [returnAmount, setReturnAmount] = useState<string>('');

  const [formData, setFormData] = useState({
    teamId: '',
    sponsorName: '',
    companyName: '',
    amountInvested: '',
    investmentDate: new Date().toISOString().split('T')[0],
    contractType: 'jersey_front',
    deliverablesAgreed: '',
    status: 'active',
    notes: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    sponsorName: '',
    companyName: '',
    amountInvested: 0,
    contractType: 'jersey_front',
    deliverablesAgreed: '',
    status: 'active',
    notes: '',
  });

  const loadData = () => {
    setLoading(true);
    const query = selectedTeamId ? `?teamId=${selectedTeamId}` : '';

    Promise.all([
      fetchApi<{
        success: boolean;
        totalInvested: number;
        totalReturnsPaid: number;
        netRetained: number;
        sponsors: any[];
      }>(`/sponsors${query}`),
      fetchApi<{ success: boolean; teams: any[] }>('/teams'),
    ])
      .then(([sponsRes, teamRes]) => {
        if (sponsRes.success) {
          setSponsors(sponsRes.sponsors);
          setTotalInvested(sponsRes.totalInvested);
          setTotalReturnsPaid(sponsRes.totalReturnsPaid);
          setNetRetained(sponsRes.netRetained);
        }
        if (teamRes.success) {
          setTeams(teamRes.teams);
          if (teamRes.teams.length > 0 && !formData.teamId) {
            setFormData((prev) => ({ ...prev, teamId: teamRes.teams[0]._id }));
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedTeamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean; sponsor: any }>('/sponsors', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          teamId: teams[0]?._id || '',
          sponsorName: '',
          companyName: '',
          amountInvested: '',
          investmentDate: new Date().toISOString().split('T')[0],
          contractType: 'jersey_front',
          deliverablesAgreed: '',
          status: 'active',
          notes: '',
        });
        loadData();
      }
    } catch (err) {
      alert('Failed to register sponsor');
    }
  };

  const handleEditOpen = (spons: any) => {
    setEditFormData({
      id: spons._id,
      sponsorName: spons.sponsorName || '',
      companyName: spons.companyName || '',
      amountInvested: spons.amountInvested || 0,
      contractType: spons.contractType || 'jersey_front',
      deliverablesAgreed: spons.deliverablesAgreed || '',
      status: spons.status || 'active',
      notes: spons.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/sponsors/${editFormData.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to update sponsor');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete sponsor "${name}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/sponsors/${id}`, { method: 'DELETE' });
      if (res.success) loadData();
    } catch (err) {
      alert('Failed to delete sponsor');
    }
  };

  const handleRecordReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSponsor) return;
    try {
      const newReturnTotal = (selectedSponsor.returnsPaid || 0) + Number(returnAmount);
      const res = await fetchApi<{ success: boolean; sponsor: any }>(`/sponsors/${selectedSponsor._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          returnsPaid: newReturnTotal,
          returnDate: new Date(),
        }),
      });
      if (res.success) {
        setIsReturnModalOpen(false);
        setReturnAmount('');
        loadData();
      }
    } catch (err) {
      alert('Failed to record sponsor return payout');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSponsors = sponsors.filter(
    (s) =>
      (s.sponsorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contractType || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success' as const;
      case 'completed':
        return 'primary' as const;
      default:
        return 'warning' as const;
    }
  };

  return (
    <>
      <Header
        title="Sponsors & Brand Grants"
        subtitle="Manage Brand Sponsorships, Deliverables & Full Edit/Delete Capabilities"
        selectedTeamId={selectedTeamId}
        onTeamChange={setSelectedTeamId}
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
          <div style={{ width: '280px' }}>
            <Input
              placeholder="Search sponsor or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sponsor / Brand</TableHead>
                <TableHead>Contract Type</TableHead>
                <TableHead>Invested Inflow</TableHead>
                <TableHead>Returns Paid</TableHead>
                <TableHead>Net Retained</TableHead>
                <TableHead>Deliverables</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSponsors.length === 0 ? (
                <TableEmpty colSpan={8} message="No sponsors found." />
              ) : (
                filteredSponsors.map((spons) => {
                  const net = (spons.amountInvested || 0) - (spons.returnsPaid || 0);
                  return (
                    <TableRow key={spons._id}>
                      <TableCell>
                        <Link
                          href={`/sponsors/${spons._id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span>{spons.companyName || spons.sponsorName}</span>
                          <ExternalLink size={11} color="var(--accent-blue)" />
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Contact: {spons.sponsorName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="purple" style={{ textTransform: 'capitalize' }}>
                          {spons.contractType?.replace(/_/g, ' ') || 'General Grant'}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                        Rs. {fNum(spons.amountInvested)}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>
                        Rs. {fNum(spons.returnsPaid)}
                      </TableCell>
                      <TableCell style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                        Rs. {fNum(net)}
                      </TableCell>
                      <TableCell style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                        {spons.deliverablesAgreed || 'General sponsorship'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(spons.status)}>
                          {spons.status?.toUpperCase() || 'ACTIVE'}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                          <Link href={`/sponsors/${spons._id}`} passHref legacyBehavior>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Eye size={12} color="var(--accent-blue)" />}
                              title="View Sponsor Profile"
                            >
                              Profile
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<RotateCcw size={12} />}
                            onClick={() => {
                              setSelectedSponsor(spons);
                              setIsReturnModalOpen(true);
                            }}
                            title="Record Return Payout"
                          >
                            Payout
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            isIconOnly
                            icon={<Pencil size={13} color="var(--accent-blue)" />}
                            onClick={() => handleEditOpen(spons)}
                            title="Edit Sponsor"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            isIconOnly
                            icon={<Trash2 size={13} />}
                            onClick={() => handleDelete(spons._id, spons.companyName || spons.sponsorName)}
                            title="Delete Sponsor"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}

        {/* VIEW 2: GRID (CARDS) VIEW */}
        {viewMode === 'grid' && (
          <div className="grid-2">
            {filteredSponsors.map((spons) => (
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
                      icon={<Pencil size={13} color="var(--accent-blue)" />}
                      onClick={() => handleEditOpen(spons)}
                      title="Edit Sponsor"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      isIconOnly
                      icon={<Trash2 size={13} />}
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
                      variant="secondary"
                      size="sm"
                      icon={<RotateCcw size={12} />}
                      onClick={() => {
                        setSelectedSponsor(spons);
                        setIsReturnModalOpen(true);
                      }}
                    >
                      Payout
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Add Sponsor */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register Brand Sponsor"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Save Sponsor
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <Select
                label="Sponsoring Team *"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                required
                options={teams.map((t) => ({ value: t._id, label: t.name }))}
              />

              <Select
                label="Contract Type *"
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
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

            <div className="grid-2">
              <Input
                label="Brand / Company Name *"
                placeholder="e.g. SipNest"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />

              <Input
                label="Contact Person"
                placeholder="e.g. Director"
                value={formData.sponsorName}
                onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                required
              />
            </div>

            <Input
              label="Amount Invested (Rs.) *"
              type="number"
              placeholder="50000"
              value={formData.amountInvested}
              onChange={(e) => setFormData({ ...formData, amountInvested: e.target.value })}
              required
            />

            <Textarea
              label="Deliverables Agreed"
              rows={2}
              placeholder="e.g. Front chest branding on playing shirts"
              value={formData.deliverablesAgreed}
              onChange={(e) => setFormData({ ...formData, deliverablesAgreed: e.target.value })}
            />
          </form>
        </Modal>

        {/* Modal: Edit Sponsor */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Sponsor Record"
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
                label="Company / Brand Name *"
                value={editFormData.companyName}
                onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                required
              />

              <Input
                label="Contact Person"
                value={editFormData.sponsorName}
                onChange={(e) => setEditFormData({ ...editFormData, sponsorName: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <Input
                label="Amount Invested (Rs.) *"
                type="number"
                value={editFormData.amountInvested}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, amountInvested: Number(e.target.value) })
                }
                required
              />

              <Select
                label="Contract Type"
                value={editFormData.contractType}
                onChange={(e) => setEditFormData({ ...editFormData, contractType: e.target.value })}
                options={[
                  { value: 'jersey_front', label: 'Jersey Front Chest Logo' },
                  { value: 'jersey_back', label: 'Jersey Back Logo' },
                  { value: 'sleeve', label: 'Sleeve Logo' },
                  { value: 'tournament_banner', label: 'Tournament Banners' },
                  { value: 'general_grant', label: 'General Annual Grant' },
                ]}
              />
            </div>

            <Textarea
              label="Deliverables Agreed"
              rows={2}
              value={editFormData.deliverablesAgreed}
              onChange={(e) => setEditFormData({ ...editFormData, deliverablesAgreed: e.target.value })}
            />
          </form>
        </Modal>

        {/* Modal: Record Return Payout to Sponsor */}
        <Modal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          title={`Record Return Payout - ${selectedSponsor?.companyName || selectedSponsor?.sponsorName}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsReturnModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleRecordReturn}>
                Confirm Payout
              </Button>
            </>
          }
        >
          <form onSubmit={handleRecordReturn}>
            <Input
              label="Return Payout Amount (Rs.) *"
              type="number"
              placeholder="10000"
              value={returnAmount}
              onChange={(e) => setReturnAmount(e.target.value)}
              required
            />
          </form>
        </Modal>
      </div>
    </>
  );
}
