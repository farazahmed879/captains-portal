import React from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Badge, Button, SubCard, KpiCell, CustomSelect } from "../ui";
import {
  UsersIcon,
  ChevronRightIcon,
} from "../icons";
import { DashboardWidgetWrapper } from "./DashboardWidgetWrapper";
import styles from "./PlayerWidgetCard.module.css";
import { formatNumber } from "../../lib/format";

export interface PlayerWidgetCardProps {
  playersList: any[];
  selectedPlayerId: string;
  selectedPlayer: any | null;
  stats: any | null;
  onSelectPlayer: (id: string) => void;
  onRemove: () => void;
  onOpenReturnModal: (player: any) => void;
}

export const PlayerWidgetCard: React.FC<PlayerWidgetCardProps> = ({
  playersList,
  selectedPlayerId,
  selectedPlayer,
  stats,
  onSelectPlayer,
  onRemove,
  onOpenReturnModal,
}) => {
  const router = useRouter();
  const playerOptions = [
    { value: "all", label: "All Players (Overview)" },
    ...playersList.map((p) => ({
      value: p._id,
      label: `${
        p.jerseyNumber !== undefined &&
        p.jerseyNumber !== null &&
        p.jerseyNumber !== ""
          ? `#${p.jerseyNumber} `
          : ""
      }${p.name}`,
    })),
  ];

  const selectorDropdown = (
    <div style={{ width: "175px" }}>
      <CustomSelect
        size="sm"
        value={selectedPlayerId}
        onChange={(e) => onSelectPlayer(e.target.value)}
        options={playerOptions}
        title="Select an individual player or view all"
      />
    </div>
  );

  const footerContent = selectedPlayer ? (
    <>
      <span>Open full ledger for {selectedPlayer.name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/players" style={{ color: 'var(--text-secondary)' }}>
          <span>View All</span>
        </Link>
        <span style={{ color: '#cbd5e1' }}>•</span>
        <Link href={`/players/${selectedPlayer._id}`}>
          <span>Player Profile</span>
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </>
  ) : (
    <>
      <span>Manage all player profiles & ledgers</span>
      <Link href="/players">
        <span>View All Players</span>
        <ChevronRightIcon size={12} />
      </Link>
    </>
  );

  return (
    <DashboardWidgetWrapper
      title="Player Squad & Dues"
      icon={<UsersIcon size={16} />}
      iconBg="#f1f5f9"
      iconColor="#334155"
      selector={selectorDropdown}
      onRemove={onRemove}
      removeTitle="Remove Player Widget"
      footer={footerContent}
    >
      {/* OPTION A: INDIVIDUAL PLAYER SPOTLIGHT */}
      {selectedPlayer ? (
        <div className={styles.playerSpotlightWrapper}>
          {/* Individual Player Card */}
          <SubCard
            padding="lg"
            onClick={() => router.push(`/players/${selectedPlayer._id}`)}
            title={`Open ${selectedPlayer.name}`}
          >
            <div className={styles.playerHeaderLeft}>
              <div className={styles.playerAvatar}>
                {selectedPlayer.jerseyNumber !== undefined &&
                selectedPlayer.jerseyNumber !== null &&
                selectedPlayer.jerseyNumber !== ""
                  ? `#${selectedPlayer.jerseyNumber}`
                  : selectedPlayer.name.substring(0, 2).toUpperCase()}
              </div>
              <div className={styles.playerInfoCol}>
                <div className={styles.playerNameGroup}>
                  <span className={styles.playerName}>
                    {selectedPlayer.name}
                  </span>
                </div>
                <div className={styles.playerPhone}>
                  {selectedPlayer.phone
                    ? `Phone: ${selectedPlayer.phone}`
                    : "No phone recorded"}
                </div>
              </div>
            </div>

            <div className={styles.playerHeaderRight}>
              {(selectedPlayer.pendingDue || 0) > 0 ? (
                <Badge variant="danger" className={styles.dueBadge}>
                  Rs. {formatNumber(selectedPlayer.pendingDue)} Due
                </Badge>
              ) : (
                <Badge
                  variant="success"
                  className={styles.clearedBadge}
                >
                  Fully Cleared
                </Badge>
              )}

              {(selectedPlayer.totalReturned || 0) > 0 && (
                <span
                  className={styles.returnedBadge}
                  title="Total funds returned/refunded to this player from winnings/sponsors"
                >
                  Rs. {formatNumber(selectedPlayer.totalReturned)} Returned
                </span>
              )}
            </div>
          </SubCard>

          {/* 6 KPI Cells for Individual Player */}
          <div className={`widget-kpi-row r-grid-3 ${styles.kpiGrid3}`}>
            <KpiCell
              label="Matches Played"
              value={selectedPlayer.matchesPlayed || 0}
              valueColor="var(--accent-blue)"
            />
            <KpiCell
              label="Tournaments"
              value={selectedPlayer.tournamentsCount || 0}
              valueColor="var(--accent-purple)"
            />
            <KpiCell
              label="Fee Assigned"
              value={`Rs. ${formatNumber(selectedPlayer.totalFeeAssigned)}`}
              valueColor="var(--text-primary)"
            />
            <KpiCell
              label="Fee Paid"
              value={`Rs. ${formatNumber(selectedPlayer.totalFeePaid)}`}
              valueColor="var(--accent-green)"
            />
            <KpiCell
              label="Returned / Refund"
              value={`Rs. ${formatNumber(selectedPlayer.totalReturned || 0)}`}
              valueColor={
                (selectedPlayer.totalReturned || 0) > 0
                  ? "var(--accent-amber)"
                  : "var(--text-muted)"
              }
            />
            <KpiCell
              label="Outstanding Due"
              value={`Rs. ${formatNumber(selectedPlayer.pendingDue || 0)}`}
              valueColor={
                (selectedPlayer.pendingDue || 0) > 0
                  ? "var(--accent-rose)"
                  : "var(--accent-green)"
              }
            />
          </div>

          {/* Secondary Info, Quick Return Action & Switch Back */}
          <SubCard
            padding="sm"
            borderRadius="8px"
            className={styles.secondaryInfoBar}
          >
            <div className={styles.secondaryInfoLeft}>
              <span>
                Batting:{" "}
                <strong>
                  {selectedPlayer.battingStyle?.replace(/_/g, " ") ||
                    "Right Hand"}
                </strong>
              </span>
            </div>

            <div className={styles.secondaryInfoActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenReturnModal(selectedPlayer)}
                className={styles.returnMoneyBtn}
                title="Return excess fee, winning prize share, or sponsor payout"
              >
                <span>Return Money</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectPlayer("all")}
                className={styles.switchAllBtn}
              >
                ← Switch to All
              </Button>
            </div>
          </SubCard>
        </div>
      ) : (
        /* OPTION B: ALL PLAYERS OVERVIEW */
        <>
          {/* KPI Row */}
          <div className={`widget-kpi-row r-grid-4 ${styles.kpiGrid4}`}>
            <KpiCell
              label="Squad"
              value={playersList.length || stats?.summary?.totalPlayers || 0}
            />
            <KpiCell
              label="Assigned"
              value={`Rs. ${formatNumber(stats?.finances?.totalFeeAssigned)}`}
              valueColor="var(--text-primary)"
            />
            <KpiCell
              label="Collected"
              value={`Rs. ${formatNumber(stats?.finances?.totalFeeCollected)}`}
              valueColor="var(--accent-green)"
            />
            <KpiCell
              label="Uncollected"
              value={`Rs. ${formatNumber(stats?.finances?.totalPendingDues)}`}
              valueColor="var(--accent-rose)"
            />
          </div>

          {/* High Density Player Dues List */}
          <div className={styles.debtorsList}>
            {stats?.topDebtors?.length === 0 ? (
              <div className={styles.clearedMessage}>
                All players are 100% cleared! No outstanding match fees.
              </div>
            ) : (
              stats?.topDebtors?.slice(0, 4).map((pl: any) => (
                <SubCard
                  key={pl.id}
                  padding="md"
                  borderRadius="8px"
                  onClick={() => router.push(`/players/${pl.id}`)}
                  title={`Open ${pl.name}`}
                  className={styles.debtorCard}
                >
                  <div className={styles.debtorLeft}>
                    <div className={styles.debtorAvatar}>
                      {pl.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.debtorName}>{pl.name}</div>
                      <div className={styles.debtorPhone}>
                        {pl.phone || "No phone"}
                      </div>
                    </div>
                  </div>

                  <div className={styles.debtorRight}>
                    <Badge variant="danger" className={styles.debtorBadge}>
                      Rs. {formatNumber(pl.pending)} Due
                    </Badge>
                    <div className={styles.debtorPaidInfo}>
                      Paid: Rs. {formatNumber(pl.paid)} /{" "}
                      {formatNumber(pl.assigned)}
                      {(pl.returned || 0) > 0 && (
                        <span className={styles.debtorReturnedInfo}>
                          • Ret: Rs. {formatNumber(pl.returned)}
                        </span>
                      )}
                    </div>
                  </div>
                </SubCard>
              ))
            )}
          </div>
        </>
      )}
    </DashboardWidgetWrapper>
  );
};
