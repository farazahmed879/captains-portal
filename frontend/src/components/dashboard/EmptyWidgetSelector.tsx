import React from 'react';
import { Button } from '../ui';
import {
  LayoutDashboardIcon,
  UsersIcon,
  TrophyIcon,
  ShieldIcon,
  HandshakeIcon,
  PlusIcon,
} from '../icons';
import { WidgetKey } from './types';
import styles from './EmptyWidgetSelector.module.css';

export interface EmptyWidgetSelectorProps {
  onToggleWidget: (widgetKey: WidgetKey) => void;
  onAddAllWidgets: () => void;
}

export const EmptyWidgetSelector: React.FC<EmptyWidgetSelectorProps> = ({
  onToggleWidget,
  onAddAllWidgets,
}) => {
  return (
    <div className="dashboard-empty-canvas">
      <div className="dashboard-empty-icon">
        <LayoutDashboardIcon size={28} />
      </div>
      <h2 className="dashboard-empty-title">Build Your Custom Dashboard</h2>
      <p className="dashboard-empty-desc">
        Your dashboard is currently empty. Choose the widgets you want to monitor, and select
        either the entire group or a specific <strong>individual player</strong>,{' '}
        <strong>tournament</strong>, or <strong>team</strong>.
      </p>

      <div className="widget-selector-grid">
        {/* 1. Player Widget */}
        <div className="widget-selector-card">
          <div className="widget-selector-header">
            <div className={`widget-selector-icon ${styles.playerIcon}`}>
              <UsersIcon size={18} />
            </div>
            <div className="widget-selector-name">Player Widget</div>
          </div>
          <div className="widget-selector-text">
            Track squad dues or select an individual player to inspect their personal match
            scorecard and ledger.
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon size={13} />}
            onClick={() => onToggleWidget('players')}
            className={styles.cardAddButton}
          >
            Add Player Widget
          </Button>
        </div>

        {/* 2. Tournament Widget */}
        <div className="widget-selector-card">
          <div className="widget-selector-header">
            <div className={`widget-selector-icon ${styles.tournamentIcon}`}>
              <TrophyIcon size={18} />
            </div>
            <div className="widget-selector-name">Tournament Widget</div>
          </div>
          <div className="widget-selector-text">
            Monitor all active leagues or select an individual tournament to inspect its entry
            cost, prize returns, and ROI.
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon size={13} />}
            onClick={() => onToggleWidget('tournaments')}
            className={styles.cardAddButton}
          >
            Add Tournament Widget
          </Button>
        </div>

        {/* 3. Team Widget */}
        <div className="widget-selector-card">
          <div className="widget-selector-header">
            <div className={`widget-selector-icon ${styles.teamIcon}`}>
              <ShieldIcon size={18} />
            </div>
            <div className="widget-selector-name">Team Widget</div>
          </div>
          <div className="widget-selector-text">
            View club teams overview or select an individual squad (Tape Ball / Hard Ball) to
            track its roster and match record.
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon size={13} />}
            onClick={() => onToggleWidget('teams')}
            className={styles.cardAddButton}
          >
            Add Team Widget
          </Button>
        </div>

        {/* 4. Sponsor Widget */}
        <div className="widget-selector-card">
          <div className="widget-selector-header">
            <div className={`widget-selector-icon ${styles.sponsorIcon}`}>
              <HandshakeIcon size={18} />
            </div>
            <div className="widget-selector-name">Sponsor Widget</div>
          </div>
          <div className="widget-selector-text">
            Follow all brand partners or select a specific brand sponsor to view their
            deliverables, inflow, and return payouts.
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon size={13} />}
            onClick={() => onToggleWidget('sponsors')}
            className={styles.cardAddButton}
          >
            Add Sponsor Widget
          </Button>
        </div>
      </div>

      <div className={styles.addAllWrapper}>
        <Button variant="secondary" size="sm" onClick={onAddAllWidgets}>
          <PlusIcon size={14} color="var(--accent-purple)" />
          <span className={styles.quickStartText}>Quick Start: Add All 4 Widgets</span>
        </Button>
      </div>
    </div>
  );
};
