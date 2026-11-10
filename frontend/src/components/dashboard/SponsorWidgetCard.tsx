import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, SubCard, KpiCell, CustomSelect } from '../ui';
import {
  HandshakeIcon,
  ChevronRightIcon,
} from '../icons';
import { DashboardWidgetWrapper } from './DashboardWidgetWrapper';
import styles from './SponsorWidgetCard.module.css';
import { formatNumber } from '../../lib/format';

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
  const router = useRouter();
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/sponsors" style={{ color: 'var(--text-secondary)' }}>
          <span>View All</span>
        </Link>
        <span style={{ color: '#cbd5e1' }}>•</span>
        <Link href={`/sponsors/${selectedSponsor._id}`}>
          <span>Sponsor Details</span>
          <ChevronRightIcon size={12} />
        </Link>
      </div>
    </>
  ) : (
    <>
      <span>View all brand sponsors, deliverables & payouts</span>
      <Link href="/sponsors">
        <span>View All Sponsors</span>
        <ChevronRightIcon size={12} />
      </Link>
    </>
  );

  return (
    <DashboardWidgetWrapper
      title="Brand Sponsors & Grants"
      icon={<HandshakeIcon size={16} />}
      iconBg="#f1f5f9"
      iconColor="#475569"
      selector={selectorDropdown}
      onRemove={onRemove}
      removeTitle="Remove Sponsor Widget"
      footer={footerContent}
    >
      {/* OPTION A: INDIVIDUAL SPONSOR SPOTLIGHT */}
      {selectedSponsor ? (
        <div className={styles.sponsorSpotlightWrapper}>
          {/* Individual Sponsor Header Card */}
          <SubCard
            padding="lg"
            className={styles.sponsorHeaderCard}
            onClick={() => router.push(`/sponsors/${selectedSponsor._id}`)}
            title={`Open ${selectedSponsor.companyName || selectedSponsor.sponsorName}`}
          >
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
                Rs. {formatNumber((selectedSponsor.amountInvested || 0) - (selectedSponsor.returnsPaid || 0))}
              </div>
            </div>
          </SubCard>

          {/* 3 KPI Cells */}
          <div className="widget-kpi-row">
            <KpiCell
              label="Inflow Invested"
              value={`Rs. ${formatNumber(selectedSponsor.amountInvested)}`}
              valueColor="var(--accent-blue)"
            />
            <KpiCell
              label="Returns Paid"
              value={`Rs. ${formatNumber(selectedSponsor.returnsPaid)}`}
              valueColor="var(--accent-rose)"
            />
            <KpiCell
              label="Net Club Fund"
              value={`Rs. ${formatNumber((selectedSponsor.amountInvested || 0) - (selectedSponsor.returnsPaid || 0))}`}
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
              value={`Rs. ${formatNumber(stats?.finances?.totalSponsorInvested)}`}
              valueColor="var(--accent-blue)"
            />
            <KpiCell
              label="Net Retained"
              value={`Rs. ${formatNumber(stats?.finances?.netSponsorship)}`}
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
                  onClick={() => router.push(`/sponsors/${spons._id}`)}
                  className={styles.sponsorCard}
                  title={`Open ${spons.companyName || spons.sponsorName}`}
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
                      Rs. {formatNumber(spons.amountInvested)}
                    </div>
                    <div className={styles.sponsorPayoutText}>
                      Payout: Rs. {formatNumber(spons.returnsPaid)}
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
