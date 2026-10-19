'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../lib/api';
import { PlusCircleIcon, ShieldIcon } from './icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  selectedTeamId?: string;
  onTeamChange?: (teamId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  selectedTeamId,
  onTeamChange,
}) => {
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<{ success: boolean; teams: any[] }>('/teams')
      .then((res) => {
        if (res.success) {
          setTeams(res.teams);
        }
      })
      .catch((err) => console.log('Could not load teams', err));
  }, []);

  return (
    <header className="topbar">
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em', color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Team Selector */}
        {onTeamChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldIcon size={16} color="var(--accent-blue)" />
            <select
              className="form-select"
              style={{ width: '180px', padding: '6px 10px', fontSize: '13px' }}
              value={selectedTeamId || ''}
              onChange={(e) => onTeamChange(e.target.value)}
            >
              <option value="">All Teams (Global)</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Link href="/matches" className="btn btn-primary btn-sm">
          <PlusCircleIcon size={14} />
          <span>New Match</span>
        </Link>
        <Link href="/finances" className="btn btn-secondary btn-sm">
          <PlusCircleIcon size={14} />
          <span>Add Expense</span>
        </Link>
      </div>
    </header>
  );
};
