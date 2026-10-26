"use client";

import React from "react";
import styles from "./Skeleton.module.css";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rounded",
  width,
  height,
  borderRadius,
  className = "",
  style,
  ...props
}) => {
  const variantClass = styles[variant] || styles.rounded;

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className}`.trim()}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius:
          borderRadius !== undefined
            ? typeof borderRadius === "number"
              ? `${borderRadius}px`
              : borderRadius
            : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};

/* ----------------------------------------------------
   1. Mini Stats Grid Skeleton (Top 4 Metrics)
---------------------------------------------------- */
export const MiniStatsSkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div className={`${styles.miniStatsGrid} ${className}`.trim()}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.miniStatCardSkeleton}>
          <Skeleton variant="rounded" width={38} height={38} borderRadius={10} />
          <div className={styles.miniStatInfo}>
            <Skeleton variant="text" width="60%" height={11} />
            <Skeleton variant="text" width="85%" height={18} />
            <Skeleton variant="text" width="45%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ----------------------------------------------------
   2. Dashboard Widget Card Skeleton
---------------------------------------------------- */
export const DashboardWidgetSkeleton: React.FC<{ count?: number }> = ({
  count = 2,
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={styles.widgetCardSkeleton}>
          {/* Header Row */}
          <div className={styles.widgetHeaderSkeleton}>
            <div className={styles.widgetHeaderLeft}>
              <Skeleton variant="rounded" width={28} height={28} borderRadius={7} />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <Skeleton variant="text" width={110} height={14} />
                <Skeleton variant="text" width={60} height={10} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Skeleton variant="rounded" width={110} height={26} borderRadius={6} />
              <Skeleton variant="rounded" width={24} height={24} borderRadius={6} />
            </div>
          </div>

          {/* 3 KPI Boxes */}
          <div className={styles.widgetKpiRowSkeleton}>
            {[1, 2, 3].map((kpi) => (
              <div key={kpi} className={styles.widgetKpiBoxSkeleton}>
                <Skeleton variant="text" width="55%" height={11} />
                <Skeleton variant="text" width="80%" height={18} />
              </div>
            ))}
          </div>

          {/* List Rows */}
          <div className={styles.widgetListSkeleton}>
            {[1, 2, 3].map((item) => (
              <div key={item} className={styles.widgetListItemSkeleton}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  <Skeleton variant="rounded" width={26} height={26} borderRadius={6} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={13} />
                    <Skeleton variant="text" width="25%" height={10} />
                  </div>
                </div>
                <Skeleton variant="rounded" width={65} height={18} borderRadius={4} />
              </div>
            ))}
          </div>

          {/* Footer Bar */}
          <div style={{ marginTop: "auto", paddingTop: 10 }}>
            <Skeleton variant="rounded" width="100%" height={34} borderRadius={8} />
          </div>
        </div>
      ))}
    </>
  );
};

/* ----------------------------------------------------
   3. Table Skeleton Rows for DataTable
---------------------------------------------------- */
export const TableSkeletonRows: React.FC<{
  columnsCount: number;
  rowsCount?: number;
}> = ({ columnsCount, rowsCount = 5 }) => {
  return (
    <>
      {Array.from({ length: rowsCount }).map((_, rIdx) => (
        <tr key={rIdx} className={styles.tableRowSkeleton}>
          {Array.from({ length: columnsCount }).map((_, cIdx) => (
            <td key={cIdx} className={styles.tableCellSkeleton}>
              <Skeleton
                variant="text"
                width={cIdx === 0 ? "75%" : cIdx === columnsCount - 1 ? "45%" : "60%"}
                height={14}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

/* ----------------------------------------------------
   4. Card Grid Skeleton (for ViewMode = 'grid')
---------------------------------------------------- */
export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={styles.widgetCardSkeleton} style={{ minHeight: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Skeleton variant="rounded" width={60} height={20} borderRadius={5} />
              <Skeleton variant="rounded" width={75} height={20} borderRadius={5} />
            </div>
            <Skeleton variant="circular" width={28} height={28} />
          </div>
          <Skeleton variant="text" width="65%" height={20} style={{ marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: "auto" }}>
            <Skeleton variant="rounded" width="100%" height={45} borderRadius={8} />
            <Skeleton variant="rounded" width="100%" height={45} borderRadius={8} />
          </div>
        </div>
      ))}
    </div>
  );
};
