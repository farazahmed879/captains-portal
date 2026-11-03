'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button, Badge, Input, Select } from './ui';
import {
  Search,
  X,
  CheckCircle2,
  Sparkles,
  Award,
  Trash2,
  ExternalLink,
  Save,
  Receipt,
  Pencil,
  ArrowUpDown,
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { showToast, confirmDelete } from '../lib/alerts';
import { PaymentMethod } from '../constants';
import Link from 'next/link';
import styles from './SquadFeesModal.module.css';

export interface SquadFeesModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  match: any;
  initialPayments?: any[];
  players: any[];
  /** Optional list of matches in the same tournament (avoids extra fetch if already loaded) */
  tournamentMatches?: any[];
  onSuccess?: () => void;
  /** Render inline on a page (without Modal wrapper) */
  inline?: boolean;
  /** Optional handler to open itemized ground expense editor (used on Match Detail page) */
  onEditExpenses?: () => void;
}

interface PlayerRowState {
  playerId: string;
  name: string;
  phone?: string;
  role?: string;
  jerseyNumber?: number | string;
  matchesPlayed?: number;
  lastMatchDate?: string | null;
  isRegular?: boolean;
  paymentId?: string;
  inSquad: boolean;
  feeAssigned: number;
  feePaid: number;
  notes?: string;
  isDirty?: boolean;
}

type FilterTab = 'all' | 'squad' | 'paid' | 'pending' | 'topi' | 'available';

export const SquadFeesModal: React.FC<SquadFeesModalProps> = ({
  isOpen = true,
  onClose,
  match,
  initialPayments = [],
  players,
  tournamentMatches,
  onSuccess,
  inline = false,
  onEditExpenses,
}) => {
  const matchId = match?._id;
  const tournamentId = match?.tournamentId?._id || match?.tournamentId || '';
  const defaultMatchFee = match?.perPlayerFee || 1000;
  const totalGroundCost = match?.totalMatchExpense || match?.groundCost || 0;

  // Local state
  const [rows, setRows] = useState<Record<string, PlayerRowState>>({});
  const [fetchedTournamentMatches, setFetchedTournamentMatches] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pinnedTopIds, setPinnedTopIds] = useState<string[]>([]);
  const tableBodyRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [bulkAssigned, setBulkAssigned] = useState<number>(defaultMatchFee);
  const [bulkPaid, setBulkPaid] = useState<number>(defaultMatchFee);
  const [isSaving, setIsSaving] = useState(false);

  // MOM local state
  const [momPlayerId, setMomPlayerId] = useState<string>('');
  const [momPrizeMoney, setMomPrizeMoney] = useState<number | ''>('');
  const [momAwardDetails, setMomAwardDetails] = useState<string>('');
  const [showMomCard, setShowMomCard] = useState<boolean>(false);
  const [isMomDirty, setIsMomDirty] = useState(false);

  // Stable content signature so parent re-renders (e.g. `data?.players || []`
  // producing a fresh array reference) don't wipe in-progress edits.
  const dataSignature = useMemo(() => {
    const paySig = (initialPayments || [])
      .map((p) => `${p._id}:${p.playerId?._id || p.playerId}:${p.feeAssigned}:${p.feePaid}:${p.notes || ''}`)
      .join('|');
    const playerSig = (players || []).map((p) => `${p._id}:${p.matchesPlayed || 0}`).join(',');
    const momSig = `${match?.momPlayerId?._id || match?.momPlayerId || ''}:${match?.momPrizeMoney || 0}:${match?.momAwardDetails || ''}`;
    return `${matchId}#${defaultMatchFee}#${paySig}#${playerSig}#${momSig}`;
  }, [initialPayments, players, match, matchId, defaultMatchFee]);

  // Reset view-level state (tab, selection, defaults) only when the modal opens or the match changes
  useEffect(() => {
    if (!isOpen || !matchId) return;
    setSelectedIds([]);
    setPinnedTopIds([]);
    setSearch('');
    setBulkAssigned(defaultMatchFee);
    setBulkPaid(defaultMatchFee);
    setActiveTab('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, matchId]);

  // Fetch tournament matches when match belongs to a tournament (if not already provided via props)
  useEffect(() => {
    if (!isOpen || !tournamentId) {
      setFetchedTournamentMatches([]);
      return;
    }
    if (tournamentMatches && tournamentMatches.length > 0) {
      return;
    }
    let cancelled = false;
    fetchApi<{ success: boolean; matches: any[] }>(`/tournaments/${tournamentId}`)
      .then((res) => {
        if (!cancelled && res.success && Array.isArray(res.matches)) {
          setFetchedTournamentMatches(res.matches);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchedTournamentMatches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, tournamentId, tournamentMatches]);

  // Map of playerId -> { count, lastDate } for matches played in THIS tournament
  const tournamentStatsMap = useMemo(() => {
    const map: Record<string, { count: number; lastDate: number }> = {};
    const list = tournamentMatches && tournamentMatches.length > 0 ? tournamentMatches : fetchedTournamentMatches;
    if (!list || list.length === 0) return map;

    list.forEach((m: any) => {
      const mDate = m.matchDate ? new Date(m.matchDate).getTime() : 0;
      const participantIds = new Set<string>();

      if (Array.isArray(m.payments)) {
        m.payments.forEach((p: any) => {
          const pid = p.playerId?._id || p.playerId;
          if (pid) participantIds.add(String(pid));
        });
      }
      if (Array.isArray(m.squadPlayerIds)) {
        m.squadPlayerIds.forEach((sp: any) => {
          const pid = sp?._id || sp;
          if (pid) participantIds.add(String(pid));
        });
      }

      participantIds.forEach((pid) => {
        if (!map[pid]) {
          map[pid] = { count: 1, lastDate: mDate };
        } else {
          map[pid].count += 1;
          if (mDate > map[pid].lastDate) {
            map[pid].lastDate = mDate;
          }
        }
      });
    });

    return map;
  }, [tournamentMatches, fetchedTournamentMatches]);

  // Sync rows + MOM from server data whenever the underlying data actually changes
  useEffect(() => {
    if (!isOpen || !matchId) return;

    // Load initial MOM state
    const currentMomId = match?.momPlayerId?._id || match?.momPlayerId || '';
    setMomPlayerId(currentMomId);
    setMomPrizeMoney(
      match?.momPrizeMoney !== undefined && match?.momPrizeMoney !== null && match?.momPrizeMoney > 0
        ? match.momPrizeMoney
        : ''
    );
    setMomAwardDetails(match?.momAwardDetails || '');
    setShowMomCard(Boolean(currentMomId));
    setIsMomDirty(false);

    // Map payments by playerId
    const paymentMap = new Map<string, any>();
    (initialPayments || []).forEach((p) => {
      const pid = p.playerId?._id || p.playerId;
      if (pid) paymentMap.set(String(pid), p);
    });

    const newRows: Record<string, PlayerRowState> = {};
    (players || []).forEach((p) => {
      const pid = String(p._id);
      const payment = paymentMap.get(pid);

      if (payment) {
        newRows[pid] = {
          playerId: pid,
          name: p.name || payment.playerId?.name || 'Unknown',
          phone: p.phone,
          role: p.role,
          jerseyNumber: p.jerseyNumber,
          matchesPlayed: p.matchesPlayed || 0,
          lastMatchDate: p.lastMatchDate || null,
          isRegular: Boolean(p.isRegular),
          paymentId: payment._id,
          inSquad: true,
          feeAssigned: Number(payment.feeAssigned) || 0,
          feePaid: Number(payment.feePaid) || 0,
          notes: payment.notes,
          isDirty: false,
        };
      } else {
        newRows[pid] = {
          playerId: pid,
          name: p.name || 'Unknown',
          phone: p.phone,
          role: p.role,
          jerseyNumber: p.jerseyNumber,
          matchesPlayed: p.matchesPlayed || 0,
          lastMatchDate: p.lastMatchDate || null,
          isRegular: Boolean(p.isRegular),
          paymentId: undefined,
          inSquad: false,
          feeAssigned: defaultMatchFee,
          feePaid: defaultMatchFee,
          notes: undefined,
          isDirty: false,
        };
      }
    });

    // Include squad players who have a payment record but are no longer in the club list
    paymentMap.forEach((payment, pid) => {
      if (newRows[pid]) return;
      const pl = payment.playerId && typeof payment.playerId === 'object' ? payment.playerId : {};
      newRows[pid] = {
        playerId: pid,
        name: pl.name || 'Unknown Player',
        phone: pl.phone,
        role: pl.role,
        jerseyNumber: pl.jerseyNumber,
        matchesPlayed: 0,
        paymentId: payment._id,
        inSquad: true,
        feeAssigned: Number(payment.feeAssigned) || 0,
        feePaid: Number(payment.feePaid) || 0,
        notes: payment.notes,
        isDirty: false,
      };
    });

    setRows(newRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dataSignature]);

  // Derived lists: prioritize client-pinned selected players, saved squad players & tournament players
  const allPlayerRows = useMemo(() => {
    const pinnedSet = new Set(pinnedTopIds);

    return Object.values(rows).sort((a, b) => {
      // 0. Client-side "Selected on Top" pinned players come first when triggered
      if (pinnedSet.size > 0) {
        const pinA = pinnedSet.has(a.playerId);
        const pinB = pinnedSet.has(b.playerId);
        if (pinA && !pinB) return -1;
        if (!pinA && pinB) return 1;
      }

      // 1. Players already saved in this match's squad come first
      const savedA = Boolean(a.paymentId);
      const savedB = Boolean(b.paymentId);
      if (savedA && !savedB) return -1;
      if (!savedA && savedB) return 1;

      // 2. Players who already played in THIS tournament come on top (most tournament matches first)
      const tourA = tournamentStatsMap[a.playerId]?.count || 0;
      const tourB = tournamentStatsMap[b.playerId]?.count || 0;
      if (tourA > 0 && tourB === 0) return -1;
      if (tourB > 0 && tourA === 0) return 1;
      if (tourB !== tourA) return tourB - tourA;

      const tourDateA = tournamentStatsMap[a.playerId]?.lastDate || 0;
      const tourDateB = tournamentStatsMap[b.playerId]?.lastDate || 0;
      if (tourDateB !== tourDateA) return tourDateB - tourDateA;

      // 3. Players who played matches overall (most matches played on top)
      const matchesA = Number(a.matchesPlayed) || 0;
      const matchesB = Number(b.matchesPlayed) || 0;
      if (matchesA > 0 && matchesB === 0) return -1;
      if (matchesB > 0 && matchesA === 0) return 1;
      if (matchesB !== matchesA) return matchesB - matchesA;

      // 4. For players with same match count, sort by most recent match date
      const dateA = a.lastMatchDate ? new Date(a.lastMatchDate).getTime() : 0;
      const dateB = b.lastMatchDate ? new Date(b.lastMatchDate).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;

      // 5. Regular squad members first
      if (a.isRegular && !b.isRegular) return -1;
      if (!a.isRegular && b.isRegular) return 1;

      // 6. Fallback alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [rows, tournamentStatsMap, pinnedTopIds]);

  // Stats calculation
  const stats = useMemo(() => {
    let squadCount = 0;
    let totalAssigned = 0;
    let totalCollected = 0;
    let paidCount = 0;
    let freeCount = 0;
    let topiCount = 0;
    let partialCount = 0;
    let dirtyCount = 0;

    Object.values(rows).forEach((r) => {
      if (r.isDirty) dirtyCount++;
      if (r.inSquad) {
        squadCount++;
        totalAssigned += Number(r.feeAssigned) || 0;
        totalCollected += Number(r.feePaid) || 0;

        if (r.feeAssigned === 0 && r.feePaid === 0) {
          freeCount++;
        } else if (r.feePaid >= r.feeAssigned && r.feeAssigned > 0) {
          paidCount++;
        } else if (r.feeAssigned > 0 && r.feePaid === 0) {
          topiCount++;
        } else if (r.feePaid > 0 && r.feePaid < r.feeAssigned) {
          partialCount++;
        }
      }
    });

    const activeMomPrize = momPlayerId ? Number(momPrizeMoney) || 0 : 0;
    const totalInflow = totalCollected + activeMomPrize;
    const pendingDues = Math.max(0, totalAssigned - totalCollected);
    const netBalance = totalInflow - totalGroundCost;
    const remainingDeficit = totalGroundCost > totalInflow ? totalGroundCost - totalInflow : 0;
    const recoveryRate =
      totalGroundCost > 0
        ? Math.min(100, Math.round((totalInflow / totalGroundCost) * 100))
        : 100;

    return {
      squadCount,
      totalAssigned,
      totalCollected,
      activeMomPrize,
      pendingDues,
      netBalance,
      remainingDeficit,
      recoveryRate,
      paidCount,
      freeCount,
      topiCount,
      partialCount,
      availableCount: Object.values(rows).filter((r) => !r.inSquad).length,
      dirtyCount: dirtyCount + (isMomDirty ? 1 : 0),
    };
  }, [rows, totalGroundCost, isMomDirty, momPlayerId, momPrizeMoney]);

  // Filtered rows for current tab & search
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPlayerRows.filter((r) => {
      // Tab filter
      if (activeTab === 'squad' && !r.inSquad) return false;
      if (activeTab === 'paid' && (!r.inSquad || r.feePaid < r.feeAssigned || r.feeAssigned === 0))
        return false;
      if (activeTab === 'pending' && (!r.inSquad || r.feePaid >= r.feeAssigned)) return false;
      if (activeTab === 'topi' && (!r.inSquad || r.feeAssigned === 0 || r.feePaid > 0)) return false;
      if (activeTab === 'available' && r.inSquad) return false;

      // Text search
      if (!q) return true;
      const name = (r.name || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const role = (r.role || '').toLowerCase();
      const jersey = r.jerseyNumber ? String(r.jerseyNumber) : '';
      return name.includes(q) || phone.includes(q) || role.includes(q) || jersey.includes(q);
    });
  }, [allPlayerRows, activeTab, search]);

  // Batch selection handlers
  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selectedIds.includes(r.playerId));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(visibleRows.map((r) => r.playerId));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const combined = new Set([...selectedIds, ...visibleRows.map((r) => r.playerId)]);
      setSelectedIds(Array.from(combined));
    }
  };

  // Client-only sort: bring currently selected / squad players to top on demand
  const activeSelectionOrSquadIds = useMemo(() => {
    const squadIds = Object.values(rows)
      .filter((r) => r.inSquad)
      .map((r) => r.playerId);
    return Array.from(new Set([...selectedIds, ...squadIds]));
  }, [selectedIds, rows]);

  const isSelectedSortedTop =
    pinnedTopIds.length > 0 &&
    activeSelectionOrSquadIds.length > 0 &&
    activeSelectionOrSquadIds.every((id) => pinnedTopIds.includes(id));

  const handleSortSelectedToTop = () => {
    if (isSelectedSortedTop) {
      setPinnedTopIds([]);
    } else {
      setPinnedTopIds(activeSelectionOrSquadIds);
      tableBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRowClick = (row: PlayerRowState) => {
    const id = row.playerId;
    const isCurrentlySelected = selectedIds.includes(id);

    if (!row.inSquad) {
      // Clicking a row that is not in the squad adds them with default fee and selects them
      setRows((prev) => {
        const current = prev[id];
        if (!current) return prev;
        return {
          ...prev,
          [id]: {
            ...current,
            inSquad: true,
            feeAssigned: bulkAssigned || defaultMatchFee,
            feePaid: bulkPaid || defaultMatchFee,
            isDirty: true,
          },
        };
      });
      if (!isCurrentlySelected) {
        setSelectedIds((prev) => [...prev, id]);
      }
      return;
    }

    if (isCurrentlySelected) {
      setSelectedIds((prev) => prev.filter((k) => k !== id));
      // If this row was an unsaved addition in this session, clicking again toggles them off
      if (!row.paymentId) {
        setRows((prev) => {
          const current = prev[id];
          if (!current) return prev;
          return {
            ...prev,
            [id]: {
              ...current,
              inSquad: false,
              feeAssigned: defaultMatchFee,
              feePaid: defaultMatchFee,
              notes: undefined,
              isDirty: false,
            },
          };
        });
      }
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  // Row edit handlers
  const updateRowField = (id: string, field: 'feeAssigned' | 'feePaid', val: number) => {
    const safeVal = isNaN(val) ? 0 : Math.max(0, val);
    setRows((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: safeVal,
          inSquad: true,
          isDirty: true,
        },
      };
    });
  };

  const setRowDefault = (id: string) => {
    setRows((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          feeAssigned: bulkAssigned,
          feePaid: bulkPaid,
          notes: undefined,
          inSquad: true,
          isDirty: true,
        },
      };
    });
  };

  const setRowFree = (id: string) => {
    setRows((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return {
        ...prev,
        [id]: {
          ...current,
          feeAssigned: 0,
          feePaid: 0,
          notes: undefined,
          inSquad: true,
          isDirty: true,
        },
      };
    });
  };

  const setRowTopi = (id: string) => {
    setRows((prev) => {
      const current = prev[id];
      if (!current) return prev;
      const fee = bulkAssigned > 0 ? bulkAssigned : defaultMatchFee;
      return {
        ...prev,
        [id]: {
          ...current,
          feeAssigned: fee,
          feePaid: 0,
          notes: 'Topi / Defaulter',
          inSquad: true,
          isDirty: true,
        },
      };
    });
  };

  const toggleMomPlayer = (id: string) => {
    if (momPlayerId === id) {
      setMomPlayerId('');
      setIsMomDirty(true);
    } else {
      setMomPlayerId(id);
      setShowMomCard(true);
      if (!momPrizeMoney) setMomPrizeMoney(1000);
      setIsMomDirty(true);
      // Auto-include player in squad
      setRows((prev) => {
        const current = prev[id];
        if (!current || current.inSquad) return prev;
        return {
          ...prev,
          [id]: {
            ...current,
            inSquad: true,
            isDirty: true,
          },
        };
      });
    }
  };

  const removeRowFromSquad = async (id: string) => {
    const row = rows[id];
    if (!row) return;

    if (row.paymentId) {
      const confirmed = await confirmDelete(
        `squad fee record for "${row.name}"`,
        'Remove this player from the match squad?'
      );
      if (!confirmed) return;

      try {
        await fetchApi(`/payments/${row.paymentId}`, { method: 'DELETE' });
        showToast.success(`Removed ${row.name} from squad.`);
        setSelectedIds((prev) => prev.filter((k) => k !== id));
        setRows((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            inSquad: false,
            paymentId: undefined,
            feeAssigned: defaultMatchFee,
            feePaid: defaultMatchFee,
            notes: undefined,
            isDirty: false,
          },
        }));
        onSuccess?.();
      } catch (err: any) {
        showToast.error(err?.message || 'Failed to remove player payment.');
      }
    } else {
      // Just mark not in squad locally
      setSelectedIds((prev) => prev.filter((k) => k !== id));
      setRows((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          inSquad: false,
          feeAssigned: defaultMatchFee,
          feePaid: defaultMatchFee,
          notes: undefined,
          isDirty: false,
        },
      }));
    }
  };

  // Bulk actions on selected
  const applyBulkDefaultToSelected = () => {
    if (selectedIds.length === 0) return;
    setRows((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id]) {
          next[id] = {
            ...next[id],
            feeAssigned: bulkAssigned,
            feePaid: bulkPaid,
            notes: undefined,
            inSquad: true,
            isDirty: true,
          };
        }
      });
      return next;
    });
  };

  const applyBulkFreeToSelected = () => {
    if (selectedIds.length === 0) return;
    setRows((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id]) {
          next[id] = {
            ...next[id],
            feeAssigned: 0,
            feePaid: 0,
            notes: undefined,
            inSquad: true,
            isDirty: true,
          };
        }
      });
      return next;
    });
  };

  const applyBulkTopiToSelected = () => {
    if (selectedIds.length === 0) return;
    const fee = bulkAssigned > 0 ? bulkAssigned : defaultMatchFee;
    setRows((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id]) {
          next[id] = {
            ...next[id],
            feeAssigned: fee,
            feePaid: 0,
            notes: 'Topi / Defaulter',
            inSquad: true,
            isDirty: true,
          };
        }
      });
      return next;
    });
  };

  // Save all modified rows and MOM
  const handleSaveAll = async () => {
    if (!matchId) return;
    const dirtyRows = Object.values(rows).filter((r) => r.isDirty && r.inSquad);

    if (dirtyRows.length === 0 && !isMomDirty) {
      showToast.info('No unsaved changes detected.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save all dirty squad payment rows
      if (dirtyRows.length > 0) {
        const promises = dirtyRows.map((r) =>
          fetchApi<{ success: boolean; payment: any }>('/payments', {
            method: 'POST',
            body: JSON.stringify({
              matchId,
              playerId: r.playerId,
              feeAssigned: Number(r.feeAssigned) || 0,
              feePaid: Number(r.feePaid) || 0,
              paymentMethod: PaymentMethod.CASH,
              notes: r.notes || undefined,
            }),
          })
        );
        const results = await Promise.allSettled(promises);
        const failed: string[] = [];

        setRows((prev) => {
          const next = { ...prev };
          results.forEach((res, i) => {
            const r = dirtyRows[i];
            if (res.status === 'fulfilled' && res.value?.success) {
              next[r.playerId] = {
                ...next[r.playerId],
                paymentId: res.value.payment?._id || next[r.playerId].paymentId,
                isDirty: false,
              };
            } else {
              failed.push(r.name);
            }
          });
          return next;
        });

        if (failed.length > 0) {
          showToast.warning(`${failed.length} player(s) failed to save: ${failed.join(', ')}`);
        } else {
          showToast.success(`Successfully saved ${dirtyRows.length} player fee(s)!`);
        }
      }

      // 2. Save MOM updates if dirty
      if (isMomDirty) {
        await fetchApi(`/matches/${matchId}`, {
          method: 'PUT',
          body: JSON.stringify({
            momPlayerId: momPlayerId || null,
            momPrizeMoney: Number(momPrizeMoney) || 0,
            momAwardDetails,
          }),
        });
        setIsMomDirty(false);
        showToast.success('Updated Man of the Match details.');
      }

      onSuccess?.();
    } catch (err: any) {
      showToast.error(err?.message || 'Error saving squad fees.');
    } finally {
      setIsSaving(false);
    }
  };

  // Mark all squad match fees paid
  const handleMarkAllPaid = async () => {
    if (!matchId) return;
    try {
      setIsSaving(true);
      const res = await fetchApi<{ success: boolean; message?: string }>(
        `/payments/matches/${matchId}/mark-all-paid`,
        { method: 'PUT' }
      );
      if (res.success) {
        showToast.success('All squad player match fees marked as paid!');
        setRows((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            if (next[k].inSquad) {
              next[k] = {
                ...next[k],
                feePaid: next[k].feeAssigned,
                isDirty: false,
              };
            }
          });
          return next;
        });
        onSuccess?.();
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to mark all paid.');
    } finally {
      setIsSaving(false);
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  const ledgerBody = (
    <div className={styles.container}>
      {/* Two-Column Grid */}
      <div className={styles.twoColGrid}>
        {/* COLUMN 1: Unified Players List (Main Column) */}
        <div className={`${styles.leftCol} ${inline ? styles.leftColCard : ''}`}>
          {/* Top Toolbar: Search & Default Inputs */}
          <div className={styles.toolbarRow}>
              <Input
                label="Search Players"
                placeholder="Search name, jersey #, role..."
                icon={<Search size={14} />}
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
                      <X size={13} />
                    </button>
                  ) : undefined
                }
              />

              <Input
                label="Default Fee (Rs.)"
                type="number"
                value={bulkAssigned}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => setBulkAssigned(Number(e.target.value))}
              />

              <Input
                label="Default Paid (Rs.)"
                type="number"
                value={bulkPaid}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => setBulkPaid(Number(e.target.value))}
              />
            </div>

            {/* Filter Tabs Bar */}
            <div className={styles.filterPillsBar}>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`${styles.filterPill} ${activeTab === 'all' ? styles.filterPillActive : ''}`}
              >
                All Players <span className={styles.filterCountBadge}>{allPlayerRows.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('squad')}
                className={`${styles.filterPill} ${activeTab === 'squad' ? styles.filterPillActive : ''}`}
              >
                In Squad <span className={styles.filterCountBadge}>{stats.squadCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paid')}
                className={`${styles.filterPill} ${activeTab === 'paid' ? styles.filterPillActive : ''}`}
              >
                Paid <span className={styles.filterCountBadge}>{stats.paidCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`${styles.filterPill} ${activeTab === 'pending' ? styles.filterPillActive : ''}`}
              >
                Pending Dues{' '}
                <span className={styles.filterCountBadge}>
                  {stats.partialCount + stats.topiCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('topi')}
                className={`${styles.filterPill} ${activeTab === 'topi' ? styles.filterPillActive : ''}`}
              >
                🧢 Topi <span className={styles.filterCountBadge}>{stats.topiCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('available')}
                className={`${styles.filterPill} ${activeTab === 'available' ? styles.filterPillActive : ''}`}
              >
                Not in Squad <span className={styles.filterCountBadge}>{stats.availableCount}</span>
              </button>
            </div>

            {/* Batch Action Bar */}
            <div className={styles.batchBar}>
              <div className={styles.batchLeft}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Sparkles size={12} />}
                  onClick={applyBulkDefaultToSelected}
                  disabled={selectedIds.length === 0}
                  className={styles.btnBatch}
                >
                  Fill Default ({selectedIds.length})
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={applyBulkFreeToSelected}
                  disabled={selectedIds.length === 0}
                  className={`${styles.btnBatch} ${selectedIds.length > 0 ? styles.btnFreeSelected : ''}`}
                >
                  Free (Rs. 0)
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={applyBulkTopiToSelected}
                  disabled={selectedIds.length === 0}
                  className={styles.btnBatch}
                >
                  🧢 Topi (Rs. 0 Paid)
                </Button>
              </div>

              <div className={styles.batchRight}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<ArrowUpDown size={12} />}
                  onClick={handleSortSelectedToTop}
                  disabled={activeSelectionOrSquadIds.length === 0 && pinnedTopIds.length === 0}
                  className={`${styles.btnBatch} ${
                    isSelectedSortedTop ? styles.btnSortTopActive : ''
                  }`}
                  title="Sort selected / squad players to the top of the list"
                >
                  {isSelectedSortedTop
                    ? 'Reset Sort'
                    : `Selected on Top (${activeSelectionOrSquadIds.length})`}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAllVisible}
                  disabled={visibleRows.length === 0}
                  className={styles.btnDeselect}
                >
                  {allVisibleSelected ? 'Deselect All' : `Select All Visible (${visibleRows.length})`}
                </Button>
              </div>
            </div>

            {/* Table Card (Single Unified List with In-Place Edit) */}
            <div className={styles.tableCard}>
              {/* Header */}
              <div className={styles.tableHeader}>
                <div className={styles.thCenterText}>#</div>
                <div className={styles.thLeft}>Player</div>
                <div className={styles.thRight}>Fee Assigned</div>
                <div className={styles.thRight}>Fee Paid</div>
                <div className={styles.thRight}>Quick Action</div>
              </div>

              {/* Table Body */}
              <div ref={tableBodyRef} className={styles.tableBody}>
                {visibleRows.length === 0 ? (
                  <div className={styles.emptyState}>
                    No players found matching the current search & filter.
                  </div>
                ) : (
                  visibleRows.map((row, idx) => {
                    const isChecked = selectedIds.includes(row.playerId);
                    const isMom = momPlayerId === row.playerId;
                    const tourMatches = tournamentStatsMap[row.playerId]?.count || 0;
                    const displayMatches = tourMatches > 0 ? tourMatches : row.matchesPlayed || 0;
                    const isFree = row.inSquad && row.feeAssigned === 0 && row.feePaid === 0;
                    const isTopi = row.inSquad && row.feeAssigned > 0 && row.feePaid === 0;
                    const isPaid =
                      row.inSquad && row.feePaid >= row.feeAssigned && row.feeAssigned > 0;
                    const isPartial =
                      row.inSquad && row.feePaid > 0 && row.feePaid < row.feeAssigned;
                    const isDefault =
                      row.inSquad &&
                      row.feeAssigned === bulkAssigned &&
                      row.feePaid === bulkPaid &&
                      bulkAssigned > 0;

                    const rowClass = `${styles.tableRow} ${
                      !row.inSquad
                        ? styles.rowNotInSquad
                        : isTopi
                        ? styles.rowTopi
                        : isFree
                        ? styles.rowFree
                        : isPaid
                        ? styles.rowPaid
                        : isPartial
                        ? styles.rowPartial
                        : styles.rowInSquad
                    } ${row.isDirty ? styles.rowDirty : ''} ${
                      isChecked ? styles.rowSelected : ''
                    }`;

                    return (
                      <div
                        key={row.playerId}
                        className={rowClass}
                        onClick={() => handleRowClick(row)}
                      >
                        {/* Serial Number */}
                        <div className={styles.thCenter}>
                          <span
                            className={`${styles.serialCell} ${
                              isChecked ? styles.serialCellSelected : ''
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </div>

                        {/* Player Info & Status Badges */}
                        <div className={styles.playerInfoCell}>
                          <span className={styles.playerName} title={row.name}>
                            {row.name}
                            {row.jerseyNumber ? (
                              <span className={styles.playerJersey}> (#{row.jerseyNumber})</span>
                            ) : null}
                          </span>

                          {row.role && (
                            <Badge variant="secondary" className={styles.playerRoleBadge}>
                              {row.role.replace('_', ' ')}
                            </Badge>
                          )}

                          {displayMatches > 0 && (
                            <Badge
                              variant={tourMatches > 0 ? 'primary' : 'secondary'}
                              className={styles.badgeStatus}
                            >
                              {displayMatches} {displayMatches === 1 ? 'match' : 'matches'}
                            </Badge>
                          )}

                          {isMom && (
                            <Badge variant="warning" className={styles.badgeMom}>
                              🏆 MOM {momPrizeMoney ? `(Rs. ${momPrizeMoney})` : ''}
                            </Badge>
                          )}

                          {!row.inSquad && (
                            <Badge variant="secondary" className={styles.badgeStatus}>
                              Not in Squad
                            </Badge>
                          )}

                          {isFree && (
                            <Badge variant="success" className={styles.badgeStatus}>
                              FREE
                            </Badge>
                          )}

                          {isTopi && (
                            <Badge variant="danger" className={styles.badgeStatus}>
                              🧢 TOPI
                            </Badge>
                          )}

                          {isPaid && (
                            <Badge variant="success" className={styles.badgeStatus}>
                              PAID
                            </Badge>
                          )}

                          {isPartial && (
                            <Badge variant="warning" className={styles.badgeStatus}>
                              DUE Rs. {row.feeAssigned - row.feePaid}
                            </Badge>
                          )}
                        </div>

                        {/* Fee Assigned Input (In-Place Edit) */}
                        <div
                          onClick={(e) => {
                            if (row.inSquad) e.stopPropagation();
                          }}
                        >
                          <input
                            type="number"
                            value={row.inSquad ? row.feeAssigned : ''}
                            placeholder="—"
                            disabled={!row.inSquad}
                            onFocus={(e) => e.target.select()}
                            onWheel={(e) => e.currentTarget.blur()}
                            onChange={(e) =>
                              updateRowField(row.playerId, 'feeAssigned', Number(e.target.value))
                            }
                            className={`form-input ${styles.feeInput} ${
                              !row.inSquad ? styles.feeInputDisabled : ''
                            }`}
                          />
                        </div>

                        {/* Fee Paid Input (In-Place Edit) */}
                        <div
                          onClick={(e) => {
                            if (row.inSquad) e.stopPropagation();
                          }}
                        >
                          <input
                            type="number"
                            value={row.inSquad ? row.feePaid : ''}
                            placeholder="—"
                            disabled={!row.inSquad}
                            onFocus={(e) => e.target.select()}
                            onWheel={(e) => e.currentTarget.blur()}
                            onChange={(e) =>
                              updateRowField(row.playerId, 'feePaid', Number(e.target.value))
                            }
                            className={`form-input ${styles.feeInput} ${
                              !row.inSquad ? styles.feeInputDisabled : ''
                            } ${isPaid ? styles.feeInputPaidSuccess : ''}`}
                          />
                        </div>

                        {/* Quick Action (Extreme Right) */}
                        <div
                          className={styles.quickActionCell}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.quickActionGroup}>
                            <button
                              type="button"
                              onClick={() => setRowDefault(row.playerId)}
                              title={`Fill with default fee (Rs. ${bulkAssigned})`}
                              className={`${styles.pillBtn} ${
                                isDefault ? styles.pillBtnDefaultActive : ''
                              }`}
                            >
                              Default
                            </button>
                            <button
                              type="button"
                              onClick={() => setRowFree(row.playerId)}
                              title="Set fee to Rs. 0 (Free Player)"
                              className={`${styles.pillBtn} ${
                                isFree ? styles.pillBtnFreeActive : ''
                              }`}
                            >
                              Free
                            </button>
                            <button
                              type="button"
                              onClick={() => setRowTopi(row.playerId)}
                              title="Mark Topi: Rs. 0 Paid"
                              className={`${styles.pillBtn} ${
                                isTopi ? styles.pillBtnTopiActive : ''
                              }`}
                            >
                              Topi 🧢
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleMomPlayer(row.playerId)}
                              title={`Toggle ${row.name} as MOM`}
                              className={`${styles.pillBtn} ${styles.pillBtnMom} ${
                                isMom ? styles.pillBtnMomActive : ''
                              }`}
                            >
                              🏆 MOM
                            </button>
                          </div>

                          {row.inSquad && (
                            <button
                              type="button"
                              onClick={() => removeRowFromSquad(row.playerId)}
                              className={styles.btnRowDelete}
                              title="Remove player from squad"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Table Bottom Ledger Summary */}
              <div className={styles.tableFooter}>
                <div>
                  Showing <strong>{visibleRows.length}</strong> player(s) •{' '}
                  <strong className={styles.textBlue}>{stats.squadCount}</strong> in squad
                </div>
                {selectedIds.length > 0 && (
                  <div className={styles.selectedCount}>
                    {selectedIds.length} player(s) selected
                  </div>
                )}
              </div>
            </div>

            {inline && (
              <div className={styles.ledgerBottomBar}>
                <div className={styles.modalFooterStatus}>
                  {stats.dirtyCount > 0 ? (
                    <span className={styles.modalFooterDirty}>
                      • {stats.dirtyCount} unsaved change{stats.dirtyCount === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span>All changes saved to ledger</span>
                  )}
                </div>
                <div className={styles.modalFooterActions}>
                  <Button
                    variant="success"
                    size="sm"
                    icon={<Save size={14} />}
                    loading={isSaving}
                    onClick={handleSaveAll}
                  >
                    Save Squad Fees {stats.dirtyCount > 0 ? `(${stats.dirtyCount})` : ''}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 2: Stats & Match Financials Sidebar */}
          <div className={styles.rightCol}>
            <div className={styles.sidebarCard}>
              {/* Match Header */}
              <div className={styles.matchMetaBanner}>
                <div>
                  <div className={styles.matchMetaTitle}>
                    vs {match?.opponentTeam || 'Opponent'}
                  </div>
                  <div className={styles.matchMetaSubtitle}>
                    {match?.venue || 'Ground'} • {match?.tournamentStage || 'Match'}
                  </div>
                </div>
                {match?.result && (
                  <Badge
                    variant={
                      match.result.toLowerCase() === 'won'
                        ? 'success'
                        : match.result.toLowerCase() === 'lost'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {match.result.toUpperCase()}
                  </Badge>
                )}
              </div>

              {/* 2x2 Financial Metric Boxes */}
              <div className={styles.statBoxesGrid}>
                <div className={`${styles.statBox} ${styles.statBoxCost}`}>
                  <span className={styles.statLabel}>Ground Cost</span>
                  <span className={styles.statVal}>Rs. {fNum(totalGroundCost)}</span>
                </div>

                <div className={`${styles.statBox} ${styles.statBoxCollected}`}>
                  <span className={styles.statLabel}>Fees Collected</span>
                  <span className={styles.statVal}>Rs. {fNum(stats.totalCollected)}</span>
                </div>

                <div className={`${styles.statBox} ${styles.statBoxPending}`}>
                  <span className={styles.statLabel}>Pending Dues</span>
                  <span className={styles.statVal}>Rs. {fNum(stats.pendingDues)}</span>
                </div>

                <div
                  className={`${styles.statBox} ${
                    stats.remainingDeficit === 0
                      ? styles.statBoxBalanceRecovered
                      : styles.statBoxBalanceDeficit
                  }`}
                >
                  <span className={styles.statLabel}>Net Balance</span>
                  <span className={styles.statVal}>
                    {stats.remainingDeficit === 0
                      ? stats.netBalance > 0
                        ? `+Rs. ${fNum(stats.netBalance)}`
                        : 'Break-Even'
                      : `Rs. ${fNum(stats.remainingDeficit)} Deficit`}
                  </span>
                </div>
              </div>

              {/* Recovery Progress Bar */}
              {totalGroundCost > 0 && (
                <div className={styles.progressSection}>
                  <div className={styles.progressLabelRow}>
                    <span>Expense Recovery</span>
                    <span>{stats.recoveryRate}%</span>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <progress
                      className={`${styles.progressBarNative} ${
                        stats.recoveryRate >= 100
                          ? styles.progressGreen
                          : stats.recoveryRate >= 70
                          ? styles.progressBlue
                          : styles.progressOrange
                      }`}
                      value={stats.recoveryRate}
                      max={100}
                      aria-label="Expense recovery"
                    />
                  </div>
                </div>
              )}

              {/* Squad Count Breakdown */}
              <div className={styles.squadBreakdownList}>
                <div className={styles.squadBreakdownItem}>
                  <span>Squad Players:</span>
                  <strong>{stats.squadCount} Players</strong>
                </div>
                <div className={styles.squadBreakdownItem}>
                  <span>Paid in Full:</span>
                  <strong className={styles.textGreen}>{stats.paidCount}</strong>
                </div>
                <div className={styles.squadBreakdownItem}>
                  <span>Topi / Defaulters:</span>
                  <strong className={styles.textRose}>{stats.topiCount}</strong>
                </div>
                <div className={styles.squadBreakdownItem}>
                  <span>Free Players:</span>
                  <strong className={styles.textBlue}>{stats.freeCount}</strong>
                </div>
              </div>

              {/* Organizer MOM Award Section */}
              <div
                className={`${styles.momSidebarCard} ${
                  momPlayerId ? styles.momSidebarCardActive : ''
                }`}
              >
                <div
                  className={styles.momSidebarHeader}
                  onClick={() => setShowMomCard(!showMomCard)}
                >
                  <div className={styles.momSidebarTitle}>
                    <Award size={15} color="#d97706" />
                    <span>Organizer MOM Award</span>
                  </div>
                  <span className={styles.momToggleText}>
                    {showMomCard ? 'Hide' : momPlayerId ? 'Edit' : '+ Add'}
                  </span>
                </div>

                {momPlayerId && !showMomCard && (
                  <Badge variant="warning" className={styles.momSummaryBadge}>
                    🏆 {players.find((p) => p._id === momPlayerId)?.name || 'Player'} (+Rs.{' '}
                    {momPrizeMoney || 0})
                  </Badge>
                )}

                {showMomCard && (
                  <div className={styles.momSidebarFields}>
                    <Select
                      label="MOM Player"
                      value={momPlayerId}
                      options={[
                        { value: '', label: 'None (No MOM Awarded)' },
                        ...players.map((p) => ({
                          value: p._id,
                          label: `${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''}`,
                        })),
                      ]}
                      onChange={(e) => {
                        setMomPlayerId(e.target.value);
                        if (e.target.value && !momPrizeMoney) setMomPrizeMoney(1000);
                        setIsMomDirty(true);
                      }}
                    />

                    <Input
                      label="Cash Prize (Rs.)"
                      type="number"
                      min="0"
                      value={momPrizeMoney}
                      onChange={(e) => {
                        setMomPrizeMoney(e.target.value === '' ? '' : Number(e.target.value));
                        setIsMomDirty(true);
                      }}
                      placeholder="0"
                      onWheel={(e) => e.currentTarget.blur()}
                    />

                    <Input
                      label="Performance Note"
                      type="text"
                      value={momAwardDetails}
                      onChange={(e) => {
                        setMomAwardDetails(e.target.value);
                        setIsMomDirty(true);
                      }}
                      placeholder="e.g. 54*(28) & 3/18"
                    />
                  </div>
                )}
              </div>

              {/* Sidebar Action Buttons */}
              <div className={styles.sidebarActions}>
                {stats.pendingDues > 0 && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={<CheckCircle2 size={13} />}
                    onClick={handleMarkAllPaid}
                    disabled={isSaving}
                    className={styles.btnClearDues}
                    title="Mark all pending squad match fees as paid"
                  >
                    Clear Player Dues (Rs. {fNum(stats.pendingDues)})
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save size={14} />}
                  loading={isSaving}
                  onClick={handleSaveAll}
                  className={styles.btnSaveAll}
                >
                  Save Squad Fees {stats.dirtyCount > 0 ? `(${stats.dirtyCount})` : ''}
                </Button>

                {!inline && matchId && (
                  <Link href={`/matches/${matchId}`} passHref legacyBehavior>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<ExternalLink size={13} />}
                      className={styles.btnFullWidth}
                    >
                      Open Match Detail Page
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Itemized Ground Expenses Card (shown on Match Detail Page) */}
            {inline && (
              <div className={styles.sidebarCard}>
                <div className={styles.expenseHeader}>
                  <h4 className={styles.expenseTitle}>
                    <Receipt size={15} color="#0284c7" />
                    Itemized Ground Expenses
                  </h4>
                  {onEditExpenses && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Pencil size={11} color="#0284c7" />}
                      onClick={onEditExpenses}
                      className={styles.btnBatch}
                    >
                      Match Fee
                    </Button>
                  )}
                </div>

                <div className={styles.expenseList}>
                  <div className={styles.expenseRow}>
                    <span>Pitch / Ground Rent</span>
                    <strong>Rs. {fNum(match?.groundCost)}</strong>
                  </div>
                  <div className={styles.expenseRow}>
                    <span>Umpire Charges</span>
                    <strong>Rs. {fNum(match?.umpireCost)}</strong>
                  </div>
                  <div className={styles.expenseRow}>
                    <span>Match Balls</span>
                    <strong>Rs. {fNum(match?.ballCost)}</strong>
                  </div>
                  <div className={styles.expenseRow}>
                    <span>Refreshments & Water</span>
                    <strong>Rs. {fNum(match?.refreshmentCost)}</strong>
                  </div>
                  <div className={styles.expenseRow}>
                    <span>Other Miscellaneous</span>
                    <strong>Rs. {fNum(match?.otherCosts)}</strong>
                  </div>
                  <div className={styles.expenseTotalRow}>
                    <span>Total Ground Expense</span>
                    <span>Rs. {fNum(totalGroundCost)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );

  if (inline) {
    return ledgerBody;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      maxWidth="1200px"
      title={`Squad Fees — ${match?.opponentTeam || match?.venue || 'Match'}`}
      subtitle="Unified squad ledger — assign, edit, and track player match fees & financials"
      footer={
        <div className={styles.modalFooter}>
          <div className={styles.modalFooterStatus}>
            {stats.dirtyCount > 0 ? (
              <span className={styles.modalFooterDirty}>
                • {stats.dirtyCount} unsaved change{stats.dirtyCount === 1 ? '' : 's'}
              </span>
            ) : (
              <span>All changes saved to ledger</span>
            )}
          </div>
          <div className={styles.modalFooterActions}>
            {onClose && (
              <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
                Close
              </Button>
            )}
            <Button
              variant="success"
              size="sm"
              icon={<Save size={14} />}
              loading={isSaving}
              onClick={handleSaveAll}
            >
              Save Squad Fees {stats.dirtyCount > 0 ? `(${stats.dirtyCount})` : ''}
            </Button>
          </div>
        </div>
      }
    >
      {ledgerBody}
    </Modal>
  );
};

