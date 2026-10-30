'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Button, Badge, Input, Select, Alert, Checkbox } from './ui';
import { Users, Search, Plus, CheckCircle2 } from './icons';
import { fetchApi } from '../lib/api';
import { showToast } from '../lib/alerts';
import { queryKeys } from '../lib/queryKeys';
import { PLAYER_ROLE_OPTIONS } from '../constants';

interface ManageTeamPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: { _id: string; name: string; shortName?: string; primaryColor?: string } | null;
  existingSquadIds?: string[];
  onSuccess: () => void;
}

export const ManageTeamPlayersModal: React.FC<ManageTeamPlayersModalProps> = ({
  isOpen,
  onClose,
  team,
  existingSquadIds = [],
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick register new player inline toggle
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('all_rounder');
  const [creatingPlayer, setCreatingPlayer] = useState(false);

  const playersQuery = useQuery({
    queryKey: queryKeys.players(),
    queryFn: () => fetchApi<{ success: boolean; players: any[] }>('/players'),
    enabled: isOpen,
  });

  const allPlayers = playersQuery.data?.players || [];

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedPlayerIds([]);
      setError(null);
      setShowQuickCreate(false);
    }
  }, [isOpen, team?._id]);

  // Identify which players are already in this team
  const enrolledSet = useMemo(() => {
    const ids = new Set<string>(existingSquadIds);
    if (team?._id) {
      allPlayers.forEach((p: any) => {
        const pTeams = p.teamIds || [];
        const inTeam = pTeams.some(
          (t: any) => (t?._id || t?.id || t) === team._id
        );
        if (inTeam) {
          ids.add(p._id || p.id);
        }
      });
    }
    return ids;
  }, [allPlayers, existingSquadIds, team?._id]);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPlayers.filter((p: any) => {
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        String(p.jerseyNumber || '').includes(q) ||
        (p.role || '').toLowerCase().includes(q)
      );
    });
  }, [allPlayers, search]);

  const availableFilteredIds = useMemo(
    () =>
      filteredPlayers
        .map((p: any) => p._id || p.id)
        .filter((id: string) => !enrolledSet.has(id)),
    [filteredPlayers, enrolledSet]
  );

  const allAvailableSelected =
    availableFilteredIds.length > 0 &&
    availableFilteredIds.every((id) => selectedPlayerIds.includes(id));
  const someAvailableSelected =
    !allAvailableSelected && availableFilteredIds.some((id) => selectedPlayerIds.includes(id));

  const togglePlayer = (playerId: string) => {
    if (enrolledSet.has(playerId)) return;
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const toggleSelectAllAvailable = () => {
    if (allAvailableSelected) {
      setSelectedPlayerIds((prev) => prev.filter((id) => !availableFilteredIds.includes(id)));
    } else {
      setSelectedPlayerIds((prev) => Array.from(new Set([...prev, ...availableFilteredIds])));
    }
  };

  const handleQuickCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team?._id || !newPlayerName.trim()) return;
    setCreatingPlayer(true);
    setError(null);
    try {
      const res = await fetchApi<{ success: boolean; player?: any; message?: string }>('/players', {
        method: 'POST',
        body: JSON.stringify({
          name: newPlayerName.trim(),
          phone: newPlayerPhone.trim() || undefined,
          jerseyNumber: newPlayerJersey ? Number(newPlayerJersey) : undefined,
          role: newPlayerRole,
          teamIds: [team._id],
        }),
      });
      if (res.success) {
        showToast.success(`Player "${newPlayerName.trim()}" created and added to ${team.name}!`);
        setNewPlayerName('');
        setNewPlayerPhone('');
        setNewPlayerJersey('');
        setShowQuickCreate(false);
        queryClient.invalidateQueries({ queryKey: ['players'] });
        onSuccess();
      } else {
        setError(res.message || 'Failed to register player.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error creating player.');
    } finally {
      setCreatingPlayer(false);
    }
  };

  const handleAddSelected = async () => {
    if (!team?._id || selectedPlayerIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchApi<{ success: boolean; message?: string }>(
        `/teams/${team._id}/players`,
        {
          method: 'POST',
          body: JSON.stringify({ playerIds: selectedPlayerIds }),
        }
      );

      if (res.success) {
        showToast.success(
          res.message || `${selectedPlayerIds.length} player(s) added to ${team.name}!`
        );
        queryClient.invalidateQueries({ queryKey: ['players'] });
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to add players to team.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error adding players to team.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={team ? `Add Players to ${team.name}` : 'Add Players to Team'}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {selectedPlayerIds.length > 0
              ? `${selectedPlayerIds.length} player(s) selected to add`
              : `${enrolledSet.size} player(s) currently in squad`}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddSelected}
              loading={submitting}
              disabled={selectedPlayerIds.length === 0}
              icon={<Users size={14} />}
            >
              Add to Team ({selectedPlayerIds.length})
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <Alert variant="danger" title="Error">
            {error}
          </Alert>
        )}

        {/* Top Search & Quick Register Bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input
              placeholder="Search players by name, #jersey, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          <Button
            type="button"
            variant={showQuickCreate ? 'secondary' : 'primary'}
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowQuickCreate(!showQuickCreate)}
          >
            {showQuickCreate ? 'Close New Player Form' : 'New Player'}
          </Button>
        </div>

        {/* Inline Quick Create Player Form */}
        {showQuickCreate && (
          <form
            onSubmit={handleQuickCreatePlayer}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0369a1' }}>
              Quick Register & Add Directly to {team?.name}
            </div>
            <div className="grid-2" style={{ gap: '8px' }}>
              <Input
                placeholder="Player Name *"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                required
              />
              <Input
                placeholder="Phone (e.g. 03001234567)"
                value={newPlayerPhone}
                onChange={(e) => setNewPlayerPhone(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '110px' }}>
                <Input
                  type="number"
                  placeholder="Jersey #"
                  value={newPlayerJersey}
                  onChange={(e) => setNewPlayerJersey(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Select
                  value={newPlayerRole}
                  onChange={(e) => setNewPlayerRole(e.target.value)}
                  options={PLAYER_ROLE_OPTIONS}
                />
              </div>
              <Button
                type="submit"
                variant="success"
                size="sm"
                loading={creatingPlayer}
                disabled={!newPlayerName.trim()}
              >
                Save & Add
              </Button>
            </div>
          </form>
        )}

        {/* Select All Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <Checkbox
            size="md"
            variant="primary"
            checked={allAvailableSelected}
            indeterminate={someAvailableSelected}
            onChange={toggleSelectAllAvailable}
            disabled={availableFilteredIds.length === 0}
            label={
              allAvailableSelected
                ? 'Deselect Available Players'
                : `Select All Available (${availableFilteredIds.length})`
            }
          />
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Total Club Players: {allPlayers.length}
          </span>
        </div>

        {/* Scrollable Players Checklist */}
        <div
          style={{
            maxHeight: '340px',
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            divideY: '1px solid var(--border-color)',
          } as React.CSSProperties}
        >
          {playersQuery.isLoading ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading players...
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No players match your search.
            </div>
          ) : (
            filteredPlayers.map((p: any) => {
              const pid = p._id || p.id;
              const isAlreadyInTeam = enrolledSet.has(pid);
              const isSelected = selectedPlayerIds.includes(pid);

              return (
                <div
                  key={pid}
                  onClick={() => !isAlreadyInTeam && togglePlayer(pid)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-color)',
                    background: isAlreadyInTeam
                      ? '#f8fafc'
                      : isSelected
                      ? '#eff6ff'
                      : '#ffffff',
                    cursor: isAlreadyInTeam ? 'default' : 'pointer',
                    opacity: isAlreadyInTeam ? 0.72 : 1,
                    transition: 'background 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        size="md"
                        variant="primary"
                        checked={isAlreadyInTeam || isSelected}
                        disabled={isAlreadyInTeam}
                        onChange={() => togglePlayer(pid)}
                        aria-label={`Select ${p.name}`}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {p.name}
                        </span>
                        {p.jerseyNumber !== undefined && p.jerseyNumber !== null && (
                          <Badge variant="purple" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            #{p.jerseyNumber}
                          </Badge>
                        )}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {p.phone || 'No phone'} • {(p.role || 'all_rounder').replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isAlreadyInTeam ? (
                      <Badge
                        variant="success"
                        icon={<CheckCircle2 size={10} />}
                        style={{ fontSize: '10.5px' }}
                      >
                        In Squad
                      </Badge>
                    ) : isSelected ? (
                      <Badge variant="primary" style={{ fontSize: '10.5px' }}>
                        Selected
                      </Badge>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

