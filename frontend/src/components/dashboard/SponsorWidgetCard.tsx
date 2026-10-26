import React from 'react';
import Link from 'next/link';
import { Badge, Button, SubCard, KpiCell, CustomSelect } from '../ui';
import {
  HandshakeIcon,
  ChevronRightIcon,
} from '../icons';
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import { formatCurrency } from './types';
import styles from './SponsorWidgetCard.module.css';

export interface SponsorWidgetCardProps {
  sponsorsList: any[];
  selectedSponsorId: string;
  selectedSponsor: any | null;
  stats: any | null;
  onSelectSponsor: (id: string) => void;
  onRemove: () => void;
}

export const SponsorWidgetCard: React.FC<SponsorWidgetCardProps> = ({
  sponsorsList,
  selectedSponsorId,
  selectedSponsor,
  stats,
  onSelectSponsor,
  onRemove,
}) => {
  const sponsorOptions = [
    { value: 'all', label: 'All Sponsors' },
    ...sponsorsList.map((s) => ({
      value: s._id,
      label: s.companyName || s.sponsorName,
    })),
  ];

  const selectorDropdown = (
    <div style={{ width: '160px' }}>
      <CustomSelect
        size="sm"
        value={selectedSponsorId}
        onChange={(e) => onSelectSponsor(e.target.value)}
        options={sponsorOptions}
        title="Select an individual sponsor or view all"
      />
    </div>
  );

  const footerContent = selectedSponsor ? (
    <>
      <span>Open brand contract for {selectedSponsor.companyName || selectedSponsor.sponsorName}</span>
      <Link href={`/sponsors/${selectedSponsor._id}`}>
        <span>Sponsor Details</span>
        <ChevronRightIcon size={12} />
      </Link>
    </>
  ) : (
    <>
      <span>View all brand sponsors, deliverables & payouts</span>
      <Link href="/sponsors">
        <span>Open Sponsors</span>
        <ChevronRightIcon size={12} />
      </Link>
    </>
  );

  return (
    <DashboardWidgetWrapper
      title="Brand Sponsors & Grants"
      icon={<HandshakeIcon size={16} />}
      iconBg="#f3e8ff"
      iconColor="#7e22ce"
      selector={selectorDropdown}
      onRemove={onRemove}
      removeTitle="Remove Sponsor Widget"
      footer={footerContent}
    >
      {/* OPTION A: INDIVIDUAL SPONSOR SPOTLIGHT */}
      {selectedSponsor ? (
        <div className={styles.sponsorSpotlightWrapper}>
          {/* Individual Sponsor Header Card */}
          <SubCard padding="lg" className={styles.sponsorHeaderCard}>
            <div>
              <div className={styles.sponsorTitleGroup}>
                <span className={styles.sponsorName}>
                  {selectedSponsor.companyName || selectedSponsor.sponsorName}
                </span>
                <Badge variant="purple" className={styles.contractBadge}>
                  {selectedSponsor.contractType?.replace(/_/g, ' ') || 'General Grant'}
                </Badge>
                <Badge variant="success" className={styles.statusBadge}>
                  {selectedSponsor.status || 'ACTIVE'}
                </Badge>
              </div>
              <div className={styles.contactPartnerText}>
                Contact Partner: {selectedSponsor.sponsorName}
              </div>
            </div>

            <div className={styles.retainedCol}>
              <div className={styles.retainedLabel}>
                Net Retained
              </div>
              <div className={styles.retainedValue}>
                Rs. {formatCurrency((selectedSponsor.amountInvested || 0) - (selectedSponsor.returnsPaid || 0))}
              </div>
            </div>
          </SubCard>

          {/* 3 KPI Cells */}
          <div className="widget-kpi-row">
            <KpiCell
              label="Inflow Invested"
              value={`Rs. ${formatCurrency(selectedSponsor.amountInvested)}`}
              valueColor="var(--accent-blue)"
            />
            <KpiCell
              label="Returns Paid"
              value={`Rs. ${formatCurrency(selectedSponsor.returnsPaid)}`}
              valueColor="var(--accent-rose)"
            />
            <KpiCell
              label="Net Club Fund"
              value={`Rs. ${formatCurrency((selectedSponsor.amountInvested || 0) - (selectedSponsor.returnsPaid || 0))}`}
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
              Contract: <strong>{selectedSponsor.deliverables || 'Kit & Banner Rights'}</strong>
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSelectSponsor('all')}
              className={styles.switchAllBtn}
            >
              ← Switch to All Sponsors
            </Button>
          </SubCard>
        </div>
      ) : (
        /* OPTION B: ALL SPONSORS OVERVIEW */
        <>
          {/* KPI Row */}
          <div className="widget-kpi-row">
            <KpiCell
              label="Inflow Invested"
              value={`Rs. ${formatCurrency(stats?.finances?.totalSponsorInvested)}`}
              valueColor="var(--accent-blue)"
            />
            <KpiCell
              label="Net Retained"
              value={`Rs. ${formatCurrency(stats?.finances?.netSponsorship)}`}
              valueColor="var(--accent-green)"
            />
            <KpiCell
              label="Active Grants"
              value={sponsorsList.filter((s) => s.status === 'active').length || sponsorsList.length}
            />
          </div>

          {/* High Density Sponsors List */}
          <div className={styles.sponsorsList}>
            {sponsorsList.length === 0 ? (
              <div className={styles.emptyMessage}>
                No sponsors registered yet.
              </div>
            ) : (
              sponsorsList.slice(0, 4).map((spons) => (
                <SubCard
                  key={spons._id}
                  padding="md"
                  borderRadius="8px"
                  onClick={() => onSelectSponsor(spons._id)}
                  className={styles.sponsorCard}
                  title={`Click to spotlight ${spons.companyName || spons.sponsorName}`}
                >
                  <div>
                    <div className={styles.sponsorTitleGroup}>
                      <span className={styles.sponsorListName}>
                        {spons.companyName || spons.sponsorName}
                      </span>
                      <Badge
                        variant="purple"
                        className={styles.sponsorListBadge}
                      >
                        {spons.contractType?.replace(/_/g, ' ') || 'Grant'}
                      </Badge>
                    </div>
                    <div className={styles.sponsorListContact}>
                      Contact: {spons.sponsorName}
                    </div>
                  </div>

                  <div className={styles.sponsorListRight}>
                    <div className={styles.sponsorAmountInvested}>
                      Rs. {formatCurrency(spons.amountInvested)}
                    </div>
                    <div className={styles.sponsorPayoutText}>
                      Payout: Rs. {formatCurrency(spons.returnsPaid)}
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
