import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, SubCard, KpiCell, CustomSelect } from '../ui';
import {
  ShieldIcon,
  ChevronRightIcon,
} from '../icons';
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import styles from './TeamWidgetCard.module.css';
import { EMPTY_VALUE } from '../../constants';

export interface TeamWidgetCardProps {
  teamsList: any[];
  selectedTeamId: string;
  selectedTeam: any | null;
  stats: any | null;
  onSelectTeam: (id: string) => void;
  onRemove: () => void;
}

export const TeamWidgetCard: React.FC<TeamWidgetCardProps> = ({
  teamsList,
  selectedTeamId,
  selectedTeam,
  stats,
  onSelectTeam,
  onRemove,
}) => {
  const router = useRouter();
  const teamOptions = [
    { value: 'all', label: 'All Teams' },
    ...teamsList.map((tm) => ({
      value: tm._id,
      label: `${tm.shortName} - ${tm.name}`,
    })),
  ];

  const selectorDropdown = (
    <div style={{ width: '160px' }}>
      <CustomSelect
        size="sm"
        value={selectedTeamId}
        onChange={(e) => onSelectTeam(e.target.value)}
        options={teamOptions}
        title="Select an individual team or view all"
      />
    </div>
  );

  const footerContent = selectedTeam ? (
    <>
      <span>Open squad list for {selectedTeam.name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/teams" style={{ color: 'var(--text-secondary)' }}>
          <span>View All</span>
        </Link>
        <span style={{ color: '#cbd5e1' }}>•</span>
        <Link href={`/teams/${selectedTeam._id}`}>
          <span>Team Details</span>
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </>
  ) : (
    <>
      <span>Manage club teams, tape ball & hard ball squads</span>
      <Link href="/teams">
        <span>View All Teams</span>
        <ChevronRightIcon size={12} />
      </Link>
    </>
  );

  return (
    <DashboardWidgetWrapper
      title="Club Teams & Squads"
      icon={<ShieldIcon size={16} />}
      iconBg="#e2e8f0"
      iconColor="#166534"
      selector={selectorDropdown}
      onRemove={onRemove}
      removeTitle="Remove Team Widget"
      footer={footerContent}
    >
      {/* OPTION A: INDIVIDUAL TEAM SPOTLIGHT */}
      {selectedTeam ? (
        <div className={styles.teamSpotlightWrapper}>
          {/* Individual Team Header Card */}
          <SubCard
            padding="lg"
            borderLeftColor="#e2e8f0"
            className={styles.teamHeaderCard}
            onClick={() => router.push(`/teams/${selectedTeam._id}`)}
            title={`Open ${selectedTeam.name}`}
          >
            <div>
              <div className={styles.teamTitleGroup}>
                <span className={styles.teamName}>
                  {selectedTeam.name}
                </span>
                <Badge
                  variant="purple"
                  className={styles.teamShortNameBadge}
                  style={{
                  }}
                >
                  {selectedTeam.shortName}
                </Badge>
              </div>
              <div className={styles.teamSubText}>
                Base City: {selectedTeam.city || EMPTY_VALUE}
                {selectedTeam.description && ` • ${selectedTeam.description}`}
              </div>
            </div>
          </SubCard>

          {/* 3 KPI Cells */}
          <div className="widget-kpi-row">
            <KpiCell
              label="Active Squad"
              value={`${selectedTeam.playerCount || 0} Players`}
            />
            <KpiCell
              label="Matches Played"
              value={`${selectedTeam.matchCount || 0} Matches`}
              valueColor="var(--accent-blue)"
            />
            <KpiCell
              label="Leagues Enrolled"
              value={`${selectedTeam.tournamentCount || 0} Leagues`}
              valueColor="var(--accent-green)"
            />
          </div>

          {/* Secondary Info & Switch Back */}
          <SubCard
            padding="sm"
            borderRadius="8px"
            className={styles.secondaryInfoBar}
          >
            <span>
              Jersey Color:{' '}
              <strong>
                {selectedTeam.primaryColor || '#475569'}
              </strong>
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSelectTeam('all')}
              className={styles.switchAllBtn}
            >
              ← Switch to All Teams
            </Button>
          </SubCard>
        </div>
      ) : (
        /* OPTION B: ALL TEAMS OVERVIEW */
        <>
          {/* KPI Row */}
          <div className="widget-kpi-row">
            <KpiCell
              label="Active Teams"
              value={teamsList.length || stats?.summary?.totalTeams || 0}
            />
            <KpiCell
              label="Total Matches"
              value={stats?.summary?.totalMatches || 0}
              valueColor="var(--accent-blue)"
            />
            <KpiCell
              label="Win Rate"
              value={`${stats?.summary?.winRate || 0}%`}
              valueColor="var(--accent-green)"
            />
          </div>

          {/* High Density Team Cards List */}
          <div className={styles.teamsList}>
            {teamsList.length === 0 ? (
              <div className={styles.emptyMessage}>
                No teams found. Click Manage to add club teams.
              </div>
            ) : (
              teamsList.map((tm) => (
                <SubCard
                  key={tm._id}
                  padding="md"
                  borderRadius="8px"
                  borderLeftColor="#e2e8f0"
                  onClick={() => router.push(`/teams/${tm._id}`)}
                  className={styles.teamCard}
                  title={`Open ${tm.name}`}
                >
                  <div>
                    <div className={styles.teamListTitleGroup}>
                      <span className={styles.teamListName}>
                        {tm.name}
                      </span>
                      <Badge
                        variant="purple"
                        className={styles.teamListBadge}
                        style={{
                        }}
                      >
                        {tm.shortName}
                      </Badge>
                    </div>
                    <div className={styles.teamListCity}>
                      Base: {tm.city || EMPTY_VALUE}
                    </div>
                  </div>

                  <div className={styles.teamStatsRow}>
                    <div className={styles.teamStatCol}>
                      <div className={styles.teamStatLabel}>
                        Players
                      </div>
                      <div className={styles.teamStatValue}>
                        {tm.playerCount || 0}
                      </div>
                    </div>
                    <div className={styles.teamStatCol}>
                      <div className={styles.teamStatLabel}>
                        Matches
                      </div>
                      <div className={styles.teamStatValueBlue}>
                        {tm.matchCount || 0}
                      </div>
                    </div>
                    <div className={styles.teamStatCol}>
                      <div className={styles.teamStatLabel}>
                        Leagues
                      </div>
                      <div className={styles.teamStatValueGreen}>
                        {tm.tournamentCount || 0}
                      </div>
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
