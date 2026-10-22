'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import {
  Button,
  Badge,
  Input,
  Textarea,
  Modal,
  ViewSwitcher,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Pagination,
} from '../../components/ui';
import { fetchApi } from '../../lib/api';
import { Plus, MapPin, Pencil, Trash2, ExternalLink, Eye, Shield, Users, Swords, Trophy } from '../../components/icons';

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    city: 'Karachi',
    primaryColor: '#0284c7',
    description: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    shortName: '',
    city: 'Karachi',
    primaryColor: '#0284c7',
    description: '',
  });

  const loadTeams = () => {
    setLoading(true);
    fetchApi<{ success: boolean; teams: any[] }>('/teams')
      .then((res) => {
        if (res.success) setTeams(res.teams);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean; team: any }>('/teams', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setIsModalOpen(false);
        setFormData({ name: '', shortName: '', city: 'Karachi', primaryColor: '#0284c7', description: '' });
        loadTeams();
      }
    } catch (err) {
      alert('Failed to create team');
    }
  };

  const handleEditOpen = (team: any) => {
    setEditFormData({
      id: team._id,
      name: team.name,
      shortName: team.shortName,
      city: team.city || 'Karachi',
      primaryColor: team.primaryColor || '#0284c7',
      description: team.description || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/teams/${editFormData.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadTeams();
      }
    } catch (err) {
      alert('Failed to update team');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete team "${name}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/teams/${id}`, { method: 'DELETE' });
      if (res.success) loadTeams();
    } catch (err) {
      alert('Failed to delete team');
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTeams.length / pageSize) || 1;
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <Header
        title="My Teams & Squad Management"
        subtitle="Manage Separate Club Teams (Hard Ball, Tape Ball) with Edit & Delete Options"
      />

      <div className="content-body">
        {/* Filter and View Switcher Bar */}
        <div className="filter-bar">
          <div style={{ position: 'relative', width: '280px' }}>
            <Input
              type="text"
              placeholder="Search team name, code, or city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '12px', fontSize: '13px', margin: 0 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ViewSwitcher view={viewMode} onChange={setViewMode} />
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setIsModalOpen(true)}
            >
              <span>Create New Team</span>
            </Button>
          </div>
        </div>

        {/* VIEW 1: TABLE (LIST) VIEW */}
        {viewMode === 'table' && (
          <div>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>City / Base</TableHead>
                  <TableHead>Active Squad</TableHead>
                  <TableHead>Matches Played</TableHead>
                  <TableHead>Tournaments</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableEmpty colSpan={7} message="No teams found matching search." icon={<Shield size={28} />} />
                ) : (
                  paginatedTeams.map((team) => (
                    <TableRow key={team._id} onClick={() => router.push(`/teams/${team._id}`)}>
                      <TableCell>
                        <Badge
                          variant="purple"
                          style={{
                            background: team.primaryColor ? `${team.primaryColor}18` : undefined,
                            color: team.primaryColor || '#0284c7',
                            fontWeight: 800,
                          }}
                        >
                          {team.shortName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/teams/${team._id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span>{team.name}</span>
                          <ExternalLink size={11} color="var(--accent-blue)" />
                        </Link>
                        {team.description && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{team.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <MapPin size={12} color="var(--accent-blue)" />
                          <span>{team.city || 'Karachi'}</span>
                        </div>
                      </TableCell>
                      <TableCell style={{ fontWeight: 600 }}>{team.playerCount || 0} Players</TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                        {team.matchCount || 0} Matches
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                        {team.tournamentCount || 0} Leagues
                      </TableCell>
                      <TableCell>
                        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            isIconOnly
                            onClick={() => handleEditOpen(team)}
                            title="Edit Team"
                            icon={<Pencil size={14} color="var(--accent-blue)" />}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            isIconOnly
                            onClick={() => handleDelete(team._id, team.name)}
                            title="Delete Team"
                            icon={<Trash2 size={14} />}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTeams.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Teams"
          />
        </div>
      )}

      {/* VIEW 2: GRID (CARDS) VIEW */}
      {viewMode === 'grid' && (
        <div>
          <div className="grid-2">
            {paginatedTeams.map((team) => (
              <Card key={team._id} style={{ borderTop: `4px solid ${team.primaryColor || '#0284c7'}` }}>
                <CardHeader>
                  <div>
                    <Link
                      href={`/teams/${team._id}`}
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
                      <span>{team.name}</span>
                      <ExternalLink size={12} color="var(--accent-blue)" />
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <MapPin size={12} />
                      <span>{team.city || 'Karachi'}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{team.shortName}</span>
                    </div>
                  </div>

                  <div className="action-group">
                    <Button
                      variant="secondary"
                      size="sm"
                      isIconOnly
                      onClick={() => handleEditOpen(team)}
                      title="Edit Team"
                      icon={<Pencil size={14} color="var(--accent-blue)" />}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      isIconOnly
                      onClick={() => handleDelete(team._id, team.name)}
                      title="Delete Team"
                      icon={<Trash2 size={14} />}
                    />
                  </div>
                </CardHeader>

                <CardContent>
                  {team.description && (
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      {team.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '10px',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Players</div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{team.playerCount || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Matches</div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--accent-blue)' }}>{team.matchCount || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Leagues</div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--accent-green)' }}>{team.tournamentCount || 0}</div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter style={{ justifyContent: 'flex-end' }}>
                  <Link href={`/teams/${team._id}`}>
                    <Button variant="secondary" size="sm" icon={<Eye size={12} color="var(--accent-blue)" />}>
                      <span>Team Profile & Squad</span>
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTeams.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Teams"
          />
        </div>
      )}

        {/* Modal: Create Team */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Team">
          <form onSubmit={handleSubmit}>
            <Input
              label="Team Name"
              placeholder="e.g. Gulzar Hard Ball XI"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div className="grid-2">
              <Input
                label="Short Code"
                placeholder="e.g. GHB"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                required
              />
              <Input
                label="City / Base"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Primary Color Theme</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  style={{ width: '40px', height: '38px', padding: 0, cursor: 'pointer', borderRadius: '6px' }}
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  style={{ margin: 0 }}
                />
              </div>
            </div>

            <Textarea
              label="Description / Bio"
              rows={3}
              placeholder="About this team..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Team
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit Team */}
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Team">
          <form onSubmit={handleUpdate}>
            <Input
              label="Team Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />

            <div className="grid-2">
              <Input
                label="Short Code"
                value={editFormData.shortName}
                onChange={(e) => setEditFormData({ ...editFormData, shortName: e.target.value })}
                required
              />
              <Input
                label="City / Base"
                value={editFormData.city}
                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Primary Color Theme</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={editFormData.primaryColor}
                  onChange={(e) => setEditFormData({ ...editFormData, primaryColor: e.target.value })}
                  style={{ width: '40px', height: '38px', padding: 0, cursor: 'pointer', borderRadius: '6px' }}
                />
                <Input
                  value={editFormData.primaryColor}
                  onChange={(e) => setEditFormData({ ...editFormData, primaryColor: e.target.value })}
                  style={{ margin: 0 }}
                />
              </div>
            </div>

            <Textarea
              label="Description / Bio"
              rows={3}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
