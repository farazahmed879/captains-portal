'use client';

import React, { useMemo, useState } from 'react';
import { Button, Alert, Input, Select, Badge, Checkbox } from './ui';
import { Search, X, Users, CheckCircle2, Sparkles, Award } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { PaymentMethod } from '../constants';
import styles from './AssignSquadFeeForm.module.css';

interface AssignSquadFeeFormProps {
  matchId: string;
  defaultFee?: number;
  players: any[];
  /** Player IDs that already have a fee record for this match (hidden from the list). */
  excludePlayerIds?: string[];
  currentMomPlayerId?: string;
  currentMomPrizeMoney?: number;
  currentMomAwardDetails?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type RowState = { feeAssigned: number; feePaid: number; notes?: string };

export const AssignSquadFeeForm: React.FC<AssignSquadFeeFormProps> = ({
  matchId,
  defaultFee = 1000,
  players,
  excludePlayerIds = [],
  currentMomPlayerId,
  currentMomPrizeMoney,
  currentMomAwardDetails,
  onSuccess,
  onCancel,
}) => {
  const [search, setSearch] = useState('');
  const [bulkAssigned, setBulkAssigned] = useState<number>(defaultFee);
  const [bulkPaid, setBulkPaid] = useState<number>(defaultFee);
  const [selected, setSelected] = useState<Record<string, RowState>>({});

  // Man of the Match state
  const [momPlayerId, setMomPlayerId] = useState<string>(currentMomPlayerId || '');
  const [momPrizeMoney, setMomPrizeMoney] = useState<number | ''>(
    currentMomPrizeMoney !== undefined && currentMomPrizeMoney !== null && currentMomPrizeMoney > 0
      ? currentMomPrizeMoney
      : ''
  );
  const [momAwardDetails, setMomAwardDetails] = useState<string>(currentMomAwardDetails || '');
  const [showMomSection, setShowMomSection] = useState<boolean>(!!currentMomPlayerId);

  const setPlayerAsMom = (playerId: string) => {
    if (momPlayerId === playerId) {
      setMomPlayerId('');
    } else {
      setMomPlayerId(playerId);
      setShowMomSection(true);
      if (!momPrizeMoney) {
        setMomPrizeMoney(1000);
      }
      // If player not already selected in squad, select them automatically
      if (!selected[playerId]) {
        setSelected((prev) => ({
          ...prev,
          [playerId]: { feeAssigned: bulkAssigned, feePaid: bulkPaid },
        }));
      }
    }
  };

  const availablePlayers = useMemo(() => {
    const excluded = new Set(excludePlayerIds);
    return players
      .filter((p) => !excluded.has(p._id))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [players, excludePlayerIds]);

  const visiblePlayers = useMemo(() => {
    if (!search.trim()) return availablePlayers;
    const q = search.toLowerCase();
    return availablePlayers.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const jersey = p.jerseyNumber ? String(p.jerseyNumber) : '';
      return name.includes(q) || phone.includes(q) || jersey.includes(q);
    });
  }, [availablePlayers, search]);

  const selectedIds = Object.keys(selected);
  const isSomeSelected = visiblePlayers.some((p) => selected[p._id]);
  const allVisibleSelected =
    visiblePlayers.length > 0 && visiblePlayers.every((p) => selected[p._id]);

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = { ...prev };
        visiblePlayers.forEach((p) => delete next[p._id]);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = { ...prev };
        visiblePlayers.forEach((p) => {
          if (!next[p._id]) {
            next[p._id] = { feeAssigned: bulkAssigned, feePaid: bulkPaid };
          }
        });
        return next;
      });
    }
  };

  const togglePlayer = (id: string) => {
    setSelected((prev) => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [id]: { feeAssigned: bulkAssigned, feePaid: bulkPaid },
      };
    });
  };

  const updateRow = (id: string, field: 'feeAssigned' | 'feePaid', val: number) => {
    const safeVal = isNaN(val) ? 0 : Math.max(0, val);
    setSelected((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { feeAssigned: bulkAssigned, feePaid: bulkPaid }),
        [field]: safeVal,
      },
    }));
  };

  const setRowDefault = (id: string) => {
    setSelected((prev) => ({
      ...prev,
      [id]: { feeAssigned: bulkAssigned, feePaid: bulkPaid, notes: undefined },
    }));
  };

  const setRowFree = (id: string) => {
    setSelected((prev) => ({
      ...prev,
      [id]: { feeAssigned: 0, feePaid: 0, notes: undefined },
    }));
  };

  const setRowTopi = (id: string) => {
    const fee = bulkAssigned > 0 ? bulkAssigned : defaultFee;
    setSelected((prev) => ({
      ...prev,
      [id]: { feeAssigned: fee, feePaid: 0, notes: 'Topi / Defaulter' },
    }));
  };

  const applyBulkToSelected = () => {
    setSelected((prev) => {
      const next: Record<string, RowState> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = { feeAssigned: bulkAssigned, feePaid: bulkPaid, notes: undefined };
      });
      return next;
    });
  };

  const setAllSelectedFree = () => {
    setSelected((prev) => {
      const next: Record<string, RowState> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = { feeAssigned: 0, feePaid: 0, notes: undefined };
      });
      return next;
    });
  };

  const setAllSelectedTopi = () => {
    const fee = bulkAssigned > 0 ? bulkAssigned : defaultFee;
    setSelected((prev) => {
      const next: Record<string, RowState> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = { feeAssigned: fee, feePaid: 0, notes: 'Topi / Defaulter' };
      });
      return next;
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId) return;

    const momChanged =
      momPlayerId !== (currentMomPlayerId || '') ||
      (Number(momPrizeMoney) || 0) !== (currentMomPrizeMoney || 0) ||
      momAwardDetails !== (currentMomAwardDetails || '');

    if (selectedIds.length === 0) {
      if (momChanged) {
        setIsSubmitting(true);
        setServerError(null);
        try {
          await fetchApi(`/matches/${matchId}`, {
            method: 'PUT',
            body: JSON.stringify({
              momPlayerId: momPlayerId || null,
              momPrizeMoney: Number(momPrizeMoney) || 0,
              momAwardDetails,
            }),
          });
          onSuccess();
          return;
        } catch (err: any) {
          setServerError(err?.message || 'Failed to update Man of the Match.');
          return;
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setServerError('Please select at least one player or set Man of the Match.');
        return;
      }
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
              notes: selected[playerId].notes || undefined,
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
        if (momChanged) {
          await fetchApi(`/matches/${matchId}`, {
            method: 'PUT',
            body: JSON.stringify({
              momPlayerId: momPlayerId || null,
              momPrizeMoney: Number(momPrizeMoney) || 0,
              momAwardDetails,
            }),
          }).catch((e) => console.error('Failed to sync MOM', e));
        }
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
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Header bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox}>
            <Users size={19} />
          </div>
          <div>
            <h3 className={styles.headerTitle}>
              Assign Match Fee to Players
            </h3>
            <p className={styles.headerSubtitle}>
              Select players, set customized or default fees, and record cleared dues
            </p>
          </div>
        </div>

        <div>
          <Badge
            variant={selectedIds.length > 0 ? 'success' : 'secondary'}
            className={styles.headerBadge}
          >
            {selectedIds.length} Player{selectedIds.length === 1 ? '' : 's'} Selected
          </Badge>
        </div>
      </div>

      {serverError && (
        <div className={styles.errorContainer}>
          <Alert variant="danger" title="Error">
            {serverError}
          </Alert>
        </div>
      )}

      {/* Organizer Man of the Match (MOM) Prize Section */}
      <div className={`${styles.momCard} ${momPlayerId ? styles.momCardActive : ''}`}>
        <div
          className={styles.momHeader}
          onClick={() => setShowMomSection(!showMomSection)}
        >
          <div className={styles.momHeaderLeft}>
            <div className={styles.momIconBox}>
              <Award size={17} color="#d97706" />
            </div>
            <div>
              <span className={styles.momTitle}>
                Organizer Man of the Match (MOM) Cash Award
              </span>
              {momPlayerId ? (
                <Badge variant="warning" className={styles.momBadge}>
                  🏆 {players.find((p) => p._id === momPlayerId)?.name || 'Player'} (+Rs. {momPrizeMoney || 0})
                </Badge>
              ) : (
                <span className={styles.momSubtitle}>
                  (Optional cash prize paid by organizer)
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMomSection(!showMomSection);
            }}
            className={styles.momToggleBtn}
          >
            {showMomSection ? 'Hide' : momPlayerId ? 'Edit MOM' : '+ Add MOM Award'}
          </Button>
        </div>

        {showMomSection && (
          <div className={styles.momGrid}>
            <Select
              label="MOM Player"
              value={momPlayerId}
              options={[
                { value: '', label: 'None (No MOM Awarded)' },
                ...players.map((p) => ({
                  value: p._id,
                  label: `${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''} — ${p.role?.replace('_', ' ') || 'Player'}`,
                })),
              ]}
              onChange={(e) => {
                setMomPlayerId(e.target.value);
                if (e.target.value && !momPrizeMoney) setMomPrizeMoney(1000);
              }}
            />

            <Input
              label="Organizer Cash Prize (Rs.)"
              type="number"
              min="0"
              value={momPrizeMoney}
              onChange={(e) => setMomPrizeMoney(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              onWheel={(e) => e.currentTarget.blur()}
            />

            <Input
              label="Performance Note / Details"
              type="text"
              value={momAwardDetails}
              onChange={(e) => setMomAwardDetails(e.target.value)}
              placeholder="e.g. 54*(28) & 3/18 (4 ov)"
            />
          </div>
        )}
      </div>

      {/* Top Filter & Default Settings Bar */}
      <div className={styles.toolbarGrid}>
        <Input
          label="Search Players"
          placeholder="Search name, jersey #, phone..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          iconRight={
            search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={styles.searchClearBtn}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : undefined
          }
        />

        <Input
          label="Default Fee Assigned (Rs.)"
          type="number"
          value={bulkAssigned}
          onWheel={(e) => e.currentTarget.blur()}
          onChange={(e) => setBulkAssigned(Number(e.target.value))}
        />

        <Input
          label="Default Fee Paid (Rs.)"
          type="number"
          value={bulkPaid}
          onWheel={(e) => e.currentTarget.blur()}
          onChange={(e) => setBulkPaid(Number(e.target.value))}
        />
      </div>

      {/* Batch Action Toolbar */}
      <div className={styles.batchToolbar}>
        <div className={styles.batchActionsLeft}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Sparkles size={13} />}
            onClick={applyBulkToSelected}
            disabled={selectedIds.length === 0}
          >
            Fill Selected with Default (Rs. {bulkAssigned})
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={setAllSelectedFree}
            disabled={selectedIds.length === 0}
            className={selectedIds.length > 0 ? styles.btnFreeSelected : undefined}
          >
            Free Selected Players (Rs. 0)
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={setAllSelectedTopi}
            disabled={selectedIds.length === 0}
          >
            🧢 Topi Selected (Rs. 0 Paid)
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleAllVisible}
          disabled={visiblePlayers.length === 0}
          className={styles.btnDeselect}
        >
          {allVisibleSelected ? 'Deselect All on Page' : 'Select All Available'}
        </Button>
      </div>

      {/* Modern Player Checklist Table */}
      <div className={styles.tableContainer}>
        {/* Table Header */}
        <div className={styles.tableHeaderRow}>
          <div className={styles.headerColCenter}>
            <Checkbox
              size="md"
              checked={allVisibleSelected}
              indeterminate={isSomeSelected && !allVisibleSelected}
              onChange={toggleAllVisible}
              disabled={visiblePlayers.length === 0}
              aria-label="Select all visible players"
            />
          </div>

          <div className={styles.headerColLeft}>
            <span className={styles.headerColText}>
              Player
            </span>
            <span className={styles.headerCount}>
              ({selectedIds.length} / {availablePlayers.length} selected)
            </span>
          </div>

          <div className={styles.headerColTextCenter}>
            Quick Action
          </div>

          <div className={styles.headerColTextRight}>
            Fee Assigned
          </div>

          <div className={styles.headerColTextRight}>
            Fee Paid
          </div>
        </div>

        {/* Scrollable Player Rows */}
        <div className={styles.tableScrollArea}>
          {visiblePlayers.length === 0 ? (
            <div className={styles.emptyState}>
              {availablePlayers.length === 0
                ? 'All players already have a fee record for this match.'
                : 'No players match your search filter.'}
            </div>
          ) : (
            visiblePlayers.map((p) => {
              const row = selected[p._id];
              const isChecked = !!row;
              const isFree = isChecked && row.feeAssigned === 0 && row.feePaid === 0;
              const isTopi = isChecked && row.feeAssigned > 0 && row.feePaid === 0;
              const isDefault =
                isChecked && row.feeAssigned === bulkAssigned && row.feePaid === bulkPaid && bulkAssigned > 0;

              const rowClass = !isChecked
                ? styles.tableRow
                : isTopi
                ? `${styles.tableRow} ${styles.tableRowTopi}`
                : isFree
                ? `${styles.tableRow} ${styles.tableRowFree}`
                : `${styles.tableRow} ${styles.tableRowChecked}`;

              return (
                <div
                  key={p._id}
                  onClick={(e) => {
                    // Prevent toggling if user was selecting/dragging text
                    const selection = window.getSelection();
                    if (selection && selection.toString().trim().length > 0) {
                      return;
                    }
                    // Only toggle if the click target is within the checkbox or player info area
                    const target = e.target as HTMLElement;
                    if (target.closest('[data-player-select]')) {
                      togglePlayer(p._id);
                    }
                  }}
                  className={rowClass}
                >
                  <div
                    data-player-select="true"
                    className={styles.rowCheckCell}
                  >
                    <Checkbox
                      size="md"
                      checked={isChecked}
                      onChange={() => togglePlayer(p._id)}
                      variant={isTopi ? 'danger' : isFree ? 'success' : 'primary'}
                      aria-label={`Select ${p.name}`}
                    />
                  </div>

                  {/* Player Name, Jersey & Matches Badge */}
                  <div
                    data-player-select="true"
                    className={styles.playerInfoCell}
                  >
                    <span className={styles.playerName}>
                      {p.name}
                      {p.jerseyNumber ? (
                        <span className={styles.playerJersey}> (#{p.jerseyNumber})</span>
                      ) : null}
                    </span>

                    {momPlayerId === p._id && (
                      <Badge variant="warning" className={styles.badgeMom}>
                        🏆 MOM {momPrizeMoney ? `(Rs. ${momPrizeMoney})` : ''}
                      </Badge>
                    )}

                    {Number(p.matchesPlayed) > 0 && (
                      <Badge variant="secondary" className={styles.badgeMatches}>
                        {p.matchesPlayed} {p.matchesPlayed === 1 ? 'match' : 'matches'}
                      </Badge>
                    )}

                    {isChecked && isFree && (
                      <Badge variant="success" className={styles.badgeStatus}>
                        FREE
                      </Badge>
                    )}

                    {isChecked && isTopi && (
                      <Badge variant="danger" className={styles.badgeStatus}>
                        🧢 TOPI (Rs. {row.feeAssigned} DUE)
                      </Badge>
                    )}
                  </div>

                  {/* Quick Action Button Group */}
                  <div
                    data-no-toggle="true"
                    className={styles.quickActionGroup}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={!isChecked}
                      onClick={() => setRowDefault(p._id)}
                      title={`Fill with default fee (Rs. ${bulkAssigned})`}
                      className={`${styles.pillBtn} ${isDefault ? styles.pillBtnDefaultActive : ''}`}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      disabled={!isChecked}
                      onClick={() => setRowFree(p._id)}
                      title="Set fee to Rs. 0 (Free Player)"
                      className={`${styles.pillBtn} ${isFree ? styles.pillBtnFreeActive : ''}`}
                    >
                      Free
                    </button>
                    <button
                      type="button"
                      disabled={!isChecked}
                      onClick={() => setRowTopi(p._id)}
                      title={`Mark as Topi: Fee assigned Rs. ${bulkAssigned || defaultFee}, but Paid Rs. 0 (Defaulter)`}
                      className={`${styles.pillBtn} ${styles.pillBtnTopi} ${
                        isTopi ? styles.pillBtnTopiActive : ''
                      }`}
                    >
                      Topi 🧢
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlayerAsMom(p._id)}
                      title={`Toggle ${p.name} as Man of the Match`}
                      className={`${styles.pillBtn} ${styles.pillBtnMom} ${
                        momPlayerId === p._id ? styles.pillBtnMomActive : ''
                      }`}
                    >
                      🏆 MOM
                    </button>
                  </div>

                  {/* Fee Assigned Input (no spinner arrows, no scroll change) */}
                  <div
                    data-no-toggle="true"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <input
                      type="number"
                      disabled={!isChecked}
                      value={isChecked ? row.feeAssigned : ''}
                      placeholder="—"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onFocus={(e) => e.target.select()}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => updateRow(p._id, 'feeAssigned', Number(e.target.value))}
                      className={`form-input ${styles.feeInput} ${
                        isChecked ? styles.feeInputActive : ''
                      }`}
                    />
                  </div>

                  {/* Fee Paid Input (no spinner arrows, no scroll change) */}
                  <div
                    data-no-toggle="true"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <input
                      type="number"
                      disabled={!isChecked}
                      value={isChecked ? row.feePaid : ''}
                      placeholder="—"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onFocus={(e) => e.target.select()}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => updateRow(p._id, 'feePaid', Number(e.target.value))}
                      className={`form-input ${styles.feeInput} ${
                        isChecked ? styles.feeInputActive : ''
                      } ${isChecked && row.feePaid > 0 ? styles.feeInputPaidSuccess : ''}`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Bar */}
      <div className={styles.footerBar}>
        <div className={styles.footerStats}>
          <span>
            Assigned: <strong className={styles.statValAssigned}>Rs. {totalAssigned.toLocaleString()}</strong>
          </span>
          <span className={styles.footerDot}>•</span>
          <span>
            Paid: <strong className={styles.statValPaid}>Rs. {totalPaid.toLocaleString()}</strong>
          </span>
          {totalPending > 0 && (
            <>
              <span className={styles.footerDot}>•</span>
              <span>
                Pending: <strong className={styles.statValPending}>Rs. {totalPending.toLocaleString()}</strong>
              </span>
            </>
          )}
        </div>

        <div className={styles.footerActions}>
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
