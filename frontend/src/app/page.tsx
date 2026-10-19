'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { fetchApi } from '../lib/api';
import {
  TrendingUpIcon,
  DollarIcon,
  TrophyIcon,
  UsersIcon,
  SwordsIcon,
  AlertCircleIcon,
  CalendarIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '../components/icons';

export default function DashboardPage() {
  const [teamId, setTeamId] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = () => {
    setLoading(true);
    const query = teamId ? `?teamId=${teamId}` : '';
    fetchApi<{
      success: boolean;
      summary: any;
      finances: any;
      recentMatches: any[];
      topDebtors: any[];
    }>(`/dashboard/stats${query}`)
      .then((res) => {
        if (res.success) {
          setStats(res);
        }
      })
      .catch((err) => console.error('Failed to load dashboard stats', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [teamId]);

  const fNum = (val: number | undefined) => {
    return (val || 0).toLocaleString('en-US');
  };

  return (
    <>
      <Header
        title="Captain's Command Center"
        subtitle="Live Financial ROI, Tournament Performance & Squad Dues Overview"
        selectedTeamId={teamId}
        onTeamChange={setTeamId}
      />

      <div className="content-body">
        {/* Top 4 Financial Metric Cards */}
        <div className="grid-4">
          <StatCard
            variant="blue"
            title="Total Invested"
            value={`Rs. ${fNum(stats?.finances?.totalInvested)}`}
            subtitle="Entry Fees + Team Expenses"
            icon={<DollarIcon size={20} color="var(--accent-blue)" />}
          />

          <StatCard
            variant="emerald"
            title="Total Returns"
            value={`Rs. ${fNum(stats?.finances?.totalReturns)}`}
            subtitle="Sponsors + Winning Prizes"
            icon={<TrendingUpIcon size={20} color="var(--accent-green)" />}
            trend={{ text: 'Inflow', positive: true }}
          />

          <StatCard
            variant={(stats?.finances?.netProfitLoss || 0) >= 0 ? 'amber' : 'rose'}
            title="Net Profit / Loss (ROI)"
            value={`Rs. ${fNum(stats?.finances?.netProfitLoss)}`}
            subtitle={
              (stats?.finances?.netProfitLoss || 0) >= 0
                ? 'Profitable Season'
                : 'Net Operating Deficit'
            }
            icon={<TrophyIcon size={20} color={(stats?.finances?.netProfitLoss || 0) >= 0 ? "var(--accent-amber)" : "var(--accent-rose)"} />}
            trend={{
              text: (stats?.finances?.netProfitLoss || 0) >= 0 ? '+ PROFIT' : '- LOSS',
              positive: (stats?.finances?.netProfitLoss || 0) >= 0,
            }}
          />

          <StatCard
            variant="purple"
            title="Player Fee Collection"
            value={`${stats?.finances?.collectionRate || 0}%`}
            subtitle={`Rs. ${fNum(stats?.finances?.totalPendingDues)} Pending Dues`}
            icon={<UsersIcon size={20} color="var(--accent-purple)" />}
            trend={{
              text: `Rs. ${fNum(stats?.finances?.totalFeeCollected)} Collected`,
              positive: true,
            }}
          />
        </div>

        {/* 2nd Row: Quick Stats & Win Rate */}
        <div className="grid-3">
          <div className="card card-theme-blue" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SwordsIcon size={26} color="var(--accent-blue)" />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Matches Record
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: '2px 0' }}>
                {stats?.summary?.matchesWon || 0}W - {stats?.summary?.matchesLost || 0}L
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)' }}>
                {stats?.summary?.winRate || 0}% Win Rate ({stats?.summary?.totalMatches || 0} Total)
              </div>
            </div>
          </div>

          <div className="card card-theme-emerald" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TrophyIcon size={26} color="var(--accent-green)" />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Tournaments & Leagues
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: '2px 0' }}>
                {stats?.summary?.activeTournaments || 0} Active
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                {stats?.summary?.totalTournaments || 0} Total Registered
              </div>
            </div>
          </div>

          <div className="card card-theme-purple" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SparklesIcon size={26} color="var(--accent-purple)" />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Sponsorship Revenue
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: '2px 0' }}>
                Rs. {fNum(stats?.finances?.netSponsorship)}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                Net Retained Team Funds
              </div>
            </div>
          </div>
        </div>

        {/* 3rd Row: Split Grid: Recent Matches vs Top Outstanding Dues */}
        <div className="grid-2">
          {/* Recent Matches */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarIcon size={18} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Recent Matches
                </h3>
              </div>
              <Link
                href="/matches"
                style={{
                  fontSize: '12px',
                  color: 'var(--accent-blue)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                View All <ChevronRightIcon size={14} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.recentMatches?.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No matches recorded yet. Click New Match to create one.
                </div>
              ) : (
                stats?.recentMatches?.map((match: any) => (
                  <div
                    key={match._id}
                    style={{
                      padding: '14px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          className={`badge ${
                            match.matchType === 'tournament' ? 'badge-purple' : 'badge-primary'
                          }`}
                        >
                          {match.matchType === 'tournament'
                            ? match.tournamentId?.name || 'Tournament'
                            : 'Friendly'}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          vs {match.opponentTeam}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(match.matchDate).toLocaleDateString()} • {match.venue}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        className={`badge ${
                          match.result === 'won'
                            ? 'badge-success'
                            : match.result === 'lost'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {match.result.toUpperCase()}
                      </span>
                      {match.winningPrizeMoney > 0 && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--accent-green)',
                            fontWeight: 600,
                            marginTop: '4px',
                          }}
                        >
                          +Rs. {fNum(match.winningPrizeMoney)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Outstanding Match Dues */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircleIcon size={18} color="var(--accent-rose)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Uncollected Player Dues
                </h3>
              </div>
              <Link
                href="/players"
                style={{
                  fontSize: '12px',
                  color: 'var(--accent-blue)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                All Players <ChevronRightIcon size={14} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.topDebtors?.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-green)' }}>
                  🎉 All players are 100% cleared! No outstanding match dues.
                </div>
              ) : (
                stats?.topDebtors?.map((player: any) => (
                  <div
                    key={player.id}
                    style={{
                      padding: '14px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {player.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Phone: {player.phone || 'N/A'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-rose)' }}>
                        Rs. {fNum(player.pending)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Paid Rs. {fNum(player.paid)} / {fNum(player.assigned)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
