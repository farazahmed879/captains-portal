'use client';

import React, { useMemo, useState } from 'react';
import { Button, Alert } from './ui';
import { Search, X, Users, CheckCircle2, Sparkles } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { PaymentMethod } from '../constants';

interface AssignSquadFeeFormProps {
  matchId: string;
  defaultFee?: number;
  players: any[];
  /** Player IDs that already have a fee record for this match (hidden from the list). */
  excludePlayerIds?: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

type RowState = { feeAssigned: number; feePaid: number };

export const AssignSquadFeeForm: React.FC<AssignSquadFeeFormProps> = ({
  matchId,
  defaultFee = 1000,
  players,
  excludePlayerIds = [],
  onSuccess,
  onCancel,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [bulkAssigned, setBulkAssigned] = useState<number>(defaultFee);
  const [bulkPaid, setBulkPaid] = useState<number>(defaultFee);
  const [selected, setSelected] = useState<Record<string, RowState>>({});

  const availablePlayers = useMemo(() => {
    const excluded = new Set(excludePlayerIds);
    return players
      .filter((p) => !excluded.has(p._id) && p.isActive !== false)
      .sort((a, b) => {
        const matchesA = Number(a.matchesPlayed) || 0;
        const matchesB = Number(b.matchesPlayed) || 0;

        const dateA = a.lastMatchDate ? new Date(a.lastMatchDate).getTime() : 0;
        const dateB = b.lastMatchDate ? new Date(b.lastMatchDate).getTime() : 0;

        // 1. Players who played matches come before those who never played
        if (matchesA > 0 && matchesB === 0) return -1;
        if (matchesB > 0 && matchesA === 0) return 1;

        // 2. Sort by total matches played descending (most matches played on top)
        if (matchesB !== matchesA) {
          return matchesB - matchesA;
        }

        // 3. For players with same match count, sort by most recent match date (latest match on top)
        if (dateB !== dateA) {
          return dateB - dateA;
        }

        // 4. Regular squad members first
        if (a.isRegular && !b.isRegular) return -1;
        if (!a.isRegular && b.isRegular) return 1;

        // 5. Fallback alphabetically by name
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [players, excludePlayerIds]);

  const visiblePlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availablePlayers;
    return availablePlayers.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        String(p.jerseyNumber || '').includes(q) ||
        (p.phone || '').includes(q),
    );
  }, [availablePlayers, search]);

  const selectedIds = Object.keys(selected);
  const allVisibleSelected =
    visiblePlayers.length > 0 && visiblePlayers.every((p) => selected[p._id]);

  // Initially selected players have fees = 0
  const togglePlayer = (id: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = { feeAssigned: 0, feePaid: 0 };
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = { ...prev };
      if (allVisibleSelected) {
        visiblePlayers.forEach((p) => delete next[p._id]);
      } else {
        visiblePlayers.forEach((p) => {
          if (!next[p._id]) next[p._id] = { feeAssigned: 0, feePaid: 0 };
        });
      }
      return next;
    });
  };

  const updateRow = (id: string, field: keyof RowState, value: number) => {
    setSelected((prev) => {
      const currentRow = prev[id] || { feeAssigned: 0, feePaid: 0 };
      return {
        ...prev,
        [id]: { ...currentRow, [field]: value },
      };
    });
  };

  const setRowDefault = (id: string) => {
    setSelected((prev) => ({
      ...prev,
      [id]: { feeAssigned: bulkAssigned, feePaid: bulkPaid },
    }));
  };

  const setRowFree = (id: string) => {
    setSelected((prev) => ({
      ...prev,
      [id]: { feeAssigned: 0, feePaid: 0 },
    }));
  };

  const applyBulkToSelected = () => {
    setSelected((prev) => {
      const next: Record<string, RowState> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = { feeAssigned: bulkAssigned, feePaid: bulkPaid };
      });
      return next;
    });
  };

  const setAllSelectedFree = () => {
    setSelected((prev) => {
      const next: Record<string, RowState> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = { feeAssigned: 0, feePaid: 0 };
      });
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId || selectedIds.length === 0) {
      setServerError('Please select at least one player.');
      return;
    }
    setServerError(null);
    setIsSubmitting(true);

    try {
      const results = await Promise.allSettled(
        selectedIds.map((playerId) =>
          fetchApi<{ success: boolean }>('/payments', {
            method: 'POST',
            body: JSON.stringify({
              matchId,
              playerId,
              feeAssigned: Number(selected[playerId].feeAssigned) || 0,
              feePaid: Number(selected[playerId].feePaid) || 0,
              paymentMethod: PaymentMethod.CASH,
            }),
          }),
        ),
      );

      const failedIds = selectedIds.filter(
        (_, i) =>
          results[i].status === 'rejected' ||
          !(results[i] as PromiseFulfilledResult<{ success: boolean }>).value?.success,
      );

      if (failedIds.length === 0) {
        setSelected({});
        onSuccess();
      } else {
        // Keep only the failed rows selected so the user can retry
        setSelected((prev) => {
          const next: Record<string, RowState> = {};
          failedIds.forEach((id) => (next[id] = prev[id]));
          return next;
        });
        setServerError(
          `${selectedIds.length - failedIds.length} saved, ${failedIds.length} failed. Failed players are still selected — try again.`,
        );
      }
    } catch (err: any) {
      setServerError(err?.message || 'Error recording squad fee payments.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAssigned = selectedIds.reduce((s, id) => s + (Number(selected[id].feeAssigned) || 0), 0);
  const totalPaid = selectedIds.reduce((s, id) => s + (Number(selected[id].feePaid) || 0), 0);
  const totalPending = Math.max(0, totalAssigned - totalPaid);

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '20px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
        marginBottom: '20px',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Assign Match Fee to Players
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Select players, set fee amounts, or mark players as free
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              background: selectedIds.length > 0 ? '#f0fdf4' : '#f1f5f9',
              color: selectedIds.length > 0 ? '#166534' : '#64748b',
              border: selectedIds.length > 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
            }}
          >
            {selectedIds.length} Player{selectedIds.length === 1 ? '' : 's'} Selected
          </span>
        </div>
      </div>

      {serverError && (
        <div style={{ marginBottom: '14px' }}>
          <Alert variant="danger" title="Error">
            {serverError}
          </Alert>
        </div>
      )}

      {/* Top Filter & Default Settings Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(140px, 1fr) minmax(140px, 1fr)',
          gap: '12px',
          marginBottom: '12px',
          alignItems: 'end',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: '#475569',
              marginBottom: '6px',
            }}
          >
            Search Players
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search name, jersey #, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 32px 0 34px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: '#475569',
              marginBottom: '6px',
            }}
          >
            Default Fee Assigned (Rs.)
          </label>
          <input
            type="number"
            value={bulkAssigned}
            onChange={(e) => setBulkAssigned(Number(e.target.value))}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              fontSize: '13.5px',
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              outline: 'none',
              background: '#ffffff',
              color: '#0f172a',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: '#475569',
              marginBottom: '6px',
            }}
          >
            Default Fee Paid (Rs.)
          </label>
          <input
            type="number"
            value={bulkPaid}
            onChange={(e) => setBulkPaid(Number(e.target.value))}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              fontSize: '13.5px',
              fontWeight: 600,
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              outline: 'none',
              background: '#ffffff',
              color: '#0f172a',
            }}
          />
        </div>
      </div>

      {/* Batch Action Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={applyBulkToSelected}
            disabled={selectedIds.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: selectedIds.length > 0 ? '1px solid #93c5fd' : '1px solid #e2e8f0',
              background: selectedIds.length > 0 ? '#eff6ff' : '#f8fafc',
              color: selectedIds.length > 0 ? '#0284c7' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
            title="Fill fee assigned and paid for all checked players with default amount"
          >
            <Sparkles size={13} />
            <span>Fill Selected with Default (Rs. {bulkAssigned})</span>
          </button>

          <button
            type="button"
            onClick={setAllSelectedFree}
            disabled={selectedIds.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: selectedIds.length > 0 ? '1px solid #86efac' : '1px solid #e2e8f0',
              background: selectedIds.length > 0 ? '#f0fdf4' : '#f8fafc',
              color: selectedIds.length > 0 ? '#15803d' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
            title="Set fee to Rs. 0 for all selected players"
          >
            <span>Free Selected Players (Rs. 0)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={toggleAllVisible}
          disabled={visiblePlayers.length === 0}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#0284c7',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 6px',
          }}
        >
          {allVisibleSelected ? 'Deselect All on Page' : 'Select All Available'}
        </button>
      </div>

      {/* Modern Player Checklist Table */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '14px',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 130px 120px 120px',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            disabled={visiblePlayers.length === 0}
            style={{ cursor: 'pointer', width: '15px', height: '15px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Player
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748b',
              }}
            >
              ({selectedIds.length} / {availablePlayers.length} selected)
            </span>
          </div>
          <div
            style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: '#475569',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Quick Action
          </div>
          <div
            style={{
              textAlign: 'right',
              fontSize: '11px',
              fontWeight: 800,
              color: '#475569',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Fee Assigned
          </div>
          <div
            style={{
              textAlign: 'right',
              fontSize: '11px',
              fontWeight: 800,
              color: '#475569',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Fee Paid
          </div>
        </div>

        {/* Scrollable Player Rows */}
        <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
          {visiblePlayers.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                fontSize: '13px',
                color: '#94a3b8',
              }}
            >
              {availablePlayers.length === 0
                ? 'All players already have a fee record for this match.'
                : 'No players match your search filter.'}
            </div>
          ) : (
            visiblePlayers.map((p) => {
              const row = selected[p._id];
              const isChecked = !!row;
              const isFree = isChecked && row.feeAssigned === 0 && row.feePaid === 0;
              const isDefault =
                isChecked && row.feeAssigned === bulkAssigned && row.feePaid === bulkPaid && bulkAssigned > 0;

              return (
                <div
                  key={p._id}
                  onClick={() => togglePlayer(p._id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr 130px 120px 120px',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 14px',
                    borderBottom: '1px solid #f1f5f9',
                    background: isChecked ? (isFree ? '#f0fdf4' : '#f0f9ff') : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.12s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePlayer(p._id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                  />

                  {/* Player Name, Jersey & Matches Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                      {p.name}
                      {p.jerseyNumber ? (
                        <span style={{ color: '#64748b', fontWeight: 500 }}> (#{p.jerseyNumber})</span>
                      ) : null}
                    </span>

                    {Number(p.matchesPlayed) > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#f1f5f9',
                          color: '#475569',
                        }}
                      >
                        {p.matchesPlayed} {p.matchesPlayed === 1 ? 'match' : 'matches'}
                      </span>
                    )}

                    {isChecked && isFree && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: '#dcfce7',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        FREE
                      </span>
                    )}
                  </div>

                  {/* Quick Action Buttons (Default & Free) */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      justifyContent: 'center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={!isChecked}
                      onClick={() => setRowDefault(p._id)}
                      title={`Fill with default fee (Rs. ${bulkAssigned})`}
                      style={{
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '5px',
                        border: isDefault ? '1px solid #0284c7' : '1px solid #cbd5e1',
                        background: isDefault ? '#eff6ff' : '#ffffff',
                        color: isDefault ? '#0284c7' : '#475569',
                        cursor: isChecked ? 'pointer' : 'not-allowed',
                        opacity: isChecked ? 1 : 0.35,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      disabled={!isChecked}
                      onClick={() => setRowFree(p._id)}
                      title="Set fee to Rs. 0 (Free Player)"
                      style={{
                        padding: '3px 9px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '5px',
                        border: isFree ? '1px solid #16a34a' : '1px solid #cbd5e1',
                        background: isFree ? '#f0fdf4' : '#ffffff',
                        color: isFree ? '#15803d' : '#475569',
                        cursor: isChecked ? 'pointer' : 'not-allowed',
                        opacity: isChecked ? 1 : 0.35,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      Free
                    </button>
                  </div>

                  {/* Fee Assigned Input */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      disabled={!isChecked}
                      value={isChecked ? row.feeAssigned : ''}
                      placeholder="—"
                      onChange={(e) => updateRow(p._id, 'feeAssigned', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '32px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textAlign: 'right',
                        padding: '0 8px',
                        borderRadius: '6px',
                        outline: 'none',
                        border: isChecked ? '1px solid #94a3b8' : '1px dashed #cbd5e1',
                        background: isChecked ? '#ffffff' : '#f8fafc',
                        color: isChecked ? '#0f172a' : '#94a3b8',
                      }}
                    />
                  </div>

                  {/* Fee Paid Input */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      disabled={!isChecked}
                      value={isChecked ? row.feePaid : ''}
                      placeholder="—"
                      onChange={(e) => updateRow(p._id, 'feePaid', Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '32px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textAlign: 'right',
                        padding: '0 8px',
                        borderRadius: '6px',
                        outline: 'none',
                        border: isChecked ? '1px solid #94a3b8' : '1px dashed #cbd5e1',
                        background: isChecked ? '#ffffff' : '#f8fafc',
                        color: isChecked ? (row.feePaid > 0 ? '#16a34a' : '#0f172a') : '#94a3b8',
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: '13px', color: '#475569', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span>
            Assigned: <strong style={{ color: '#0f172a' }}>Rs. {totalAssigned.toLocaleString()}</strong>
          </span>
          <span>•</span>
          <span>
            Paid: <strong style={{ color: '#16a34a' }}>Rs. {totalPaid.toLocaleString()}</strong>
          </span>
          {totalPending > 0 && (
            <>
              <span>•</span>
              <span>
                Pending: <strong style={{ color: '#d97706' }}>Rs. {totalPending.toLocaleString()}</strong>
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            type="submit"
            icon={<CheckCircle2 size={14} />}
            loading={isSubmitting}
            disabled={selectedIds.length === 0}
          >
            Save {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}Player Fee
            {selectedIds.length === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </form>
  );
};
