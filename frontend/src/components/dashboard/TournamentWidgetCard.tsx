import React from 'react';
import Link from 'next/link';
import { Badge, Button, SubCard, KpiCell, CustomSelect } from '../ui';
import {
  TrophyIcon,
  MapPinIcon,
  ChevronRightIcon,
} from '../icons';
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import { formatCurrency } from './types';
import styles from './TournamentWidgetCard.module.css';

export interface TournamentWidgetCardProps {
  tournamentsList: any[];
  selectedTournamentId: string;
  selectedTournament: any | null;
  stats: any | null;
  onSelectTournament: (id: string) => void;
  onRemove: () => void;
}

export const TournamentWidgetCard: React.FC<TournamentWidgetCardProps> = ({
  tournamentsList,
  selectedTournamentId,
  selectedTournament,
  stats,
  onSelectTournament,
  onRemove,
}) => {
  const tournamentOptions = [
    { value: 'all', label: 'All Tournaments' },
    ...tournamentsList.map((t) => ({ value: t._id, label: t.name })),
  ];

  const selectorDropdown = (
    <div style={{ width: '160px' }}>
      <CustomSelect
        size="sm"
        value={selectedTournamentId}
        onChange={(e) => onSelectTournament(e.target.value)}
        options={tournamentOptions}
        title="Select an individual tournament or view all"
      />
    </div>
  );

  const footerContent = selectedTournament ? (
    <>
      <span>Open full tournament breakdown for {selectedTournament.name}</span>
      <Link href={`/tournaments/${selectedTournament._id}`}>
        <span>Tournament Profile</span>
        <ChevronRightIcon size={12} />
      </Link>
    </>
  ) : (
    <>
      <span>Browse all tournaments & entry fees</span>
      <Link href="/tournaments">
        <span>Open Tournaments</span>
        <ChevronRightIcon size={12} />
      </Link>
    </>
  );

  return (
    <DashboardWidgetWrapper
      title="Tournaments & Leagues"
      icon={<TrophyIcon size={16} />}
      iconBg="#fef3c7"
      iconColor="#b45309"
      selector={selectorDropdown}
      onRemove={onRemove}
      removeTitle="Remove Tournament Widget"
      footer={footerContent}
    >
      {/* OPTION A: INDIVIDUAL TOURNAMENT SPOTLIGHT */}
      {selectedTournament ? (
        <div className={styles.tournamentSpotlightWrapper}>
          {/* Individual Tournament Header Card */}
          <SubCard padding="lg" className={styles.tournamentHeaderCard}>
            <div>
              <div className={styles.badgeRow}>
                <Badge variant="purple" className={styles.formatBadge}>
                  {selectedTournament.format || 'Tape Ball'}
                </Badge>
                <Badge
                  variant={
                    selectedTournament.status === 'champions'
                      ? 'gold'
                      : selectedTournament.status === 'ongoing'
                      ? 'primary'
                      : 'success'
                  }
                  className={styles.statusBadge}
                >
                  {selectedTournament.status || 'ongoing'}
                </Badge>
              </div>
              <div className={styles.tournamentName}>
                {selectedTournament.name}
              </div>
              <div className={styles.venueRow}>
                <MapPinIcon size={11} />
                <span>{selectedTournament.venue || 'Karachi Grounds'}</span>
              </div>
            </div>

            <div className={styles.netRoiCol}>
              <div className={styles.netRoiLabel}>
                Net ROI
              </div>
              <div
                className={`${styles.netRoiValue} ${
                  (selectedTournament.financials?.netPnl ?? 0) >= 0
                    ? styles.roiPositive
                    : styles.roiNegative
                }`}
              >
                {(selectedTournament.financials?.netPnl ?? 0) >= 0 ? '+' : ''}
                Rs. {formatCurrency(selectedTournament.financials?.netPnl ?? 0)}
              </div>
            </div>
          </SubCard>

          {/* 4 Financial KPI Cells */}
          <div className={`r-grid-4 ${styles.kpiGrid4}`}>
            <KpiCell
              label="Entry Fee"
              value={`Rs. ${formatCurrency(selectedTournament.entryFee || 0)}`}
              valueColor="var(--accent-rose)"
            />
            <KpiCell
              label="Match Costs"
              value={`Rs. ${formatCurrency(selectedTournament.financials?.totalMatchExpenses || 0)}`}
            />
            <KpiCell
              label="Prize Won"
              value={`Rs. ${formatCurrency(
                selectedTournament.financials?.actualWinningPrizeWon ||
                  selectedTournament.actualWinningPrizeWon ||
                  0
              )}`}
              valueColor="var(--accent-green)"
            />
            <KpiCell
              label="Matches"
              value={selectedTournament.matchesPlayed || 0}
              valueColor="var(--accent-blue)"
            />
          </div>

          {/* Secondary Info & Switch Back */}
          <SubCard
            padding="sm"
            borderRadius="8px"
            className={styles.secondaryInfoBar}
          >
            <span>
              Team: <strong>{selectedTournament.teamId?.name || 'Gulzar Cricket Team'}</strong>
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSelectTournament('all')}
              className={styles.switchAllBtn}
            >
              ← Switch to All Tournaments
            </Button>
          </SubCard>
        </div>
      ) : (
        /* OPTION B: ALL TOURNAMENTS OVERVIEW */
        <>
          {/* KPI Row */}
          <div className="widget-kpi-row">
            <KpiCell
              label="Active Leagues"
              value={
                tournamentsList.length > 0
                  ? tournamentsList.filter((t) => t.status === 'ongoing').length
                  : stats?.summary?.activeTournaments || 0
              }
              valueColor="var(--accent-amber)"
            />
            <KpiCell
              label="Prize Returns"
              value={`Rs. ${formatCurrency(stats?.finances?.totalPrizeMoney)}`}
              valueColor="var(--accent-green)"
            />
            <KpiCell
              label="Total Leagues"
              value={tournamentsList.length || stats?.summary?.totalTournaments || 0}
            />
          </div>

          {/* High Density Tournaments List */}
          <div className={styles.tournamentsList}>
            {tournamentsList.length === 0 ? (
              <div className={styles.emptyMessage}>
                No tournaments registered yet.
              </div>
            ) : (
              tournamentsList.slice(0, 4).map((trn) => {
                const netPnl = trn.financials?.netPnl ?? 0;
                const isProfitable = netPnl >= 0;

                return (
                  <SubCard
                    key={trn._id}
                    padding="md"
                    borderRadius="8px"
                    onClick={() => onSelectTournament(trn._id)}
                    className={styles.tournamentCard}
                    title={`Click to spotlight ${trn.name}`}
                  >
                    <div>
                      <div className={styles.badgeRow}>
                        <span className={styles.tournamentListTitle}>
                          {trn.name}
                        </span>
                        <Badge
                          variant="purple"
                          className={styles.tournamentListBadge}
                        >
                          {trn.format || 'Tape Ball'}
                        </Badge>
                      </div>
                      <div className={styles.venueRow}>
                        <MapPinIcon size={11} />
                        <span>{trn.venue || 'Karachi Grounds'}</span>
                      </div>
                    </div>

                    <div className={styles.tournamentListRight}>
                      <Badge
                        variant={
                          trn.status === 'champions'
                            ? 'gold'
                            : trn.status === 'ongoing'
                            ? 'primary'
                            : 'success'
                        }
                        className={styles.statusBadge}
                      >
                        {trn.status || 'ongoing'}
                      </Badge>
                      <div
                        className={`${styles.roiValueText} ${
                          isProfitable ? styles.roiPositive : styles.roiNegative
                        }`}
                      >
                        {isProfitable ? '+' : ''}Rs. {formatCurrency(netPnl)} ROI
                      </div>
                    </div>
                  </SubCard>
                );
              })
            )}
          </div>
        </>
      )}
    </DashboardWidgetWrapper>
  );
};
