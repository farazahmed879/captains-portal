import React from "react";
import Link from "next/link";
import { Column } from "../components/ui/DataTable";
import { Badge, Button } from "../components/ui";
import { ExternalLinkIcon, PencilIcon, TrashIcon } from "../components/icons";
import { Tournament } from "../types";
import { formatDate } from "../lib/format";

interface TournamentColumnActions {
  onEdit: (tournament: Tournament) => void;
  onDelete: (id: string, name: string) => void;
  getStatusBadgeVariant: (status?: string) => any;
  fNum: (val: number | undefined) => string;
}

export const getTournamentColumns = ({
  onEdit,
  onDelete,
  getStatusBadgeVariant,
  fNum,
}: TournamentColumnActions): Column<Tournament>[] => [
  {
    header: "Tournament Name",
    width: "24%",
    render: (trn: any) => (
      <div>
        <Link
          href={`/tournaments/${trn._id}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontWeight: 700,
            color: "var(--text-primary)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>{trn.name}</span>
          <ExternalLinkIcon size={11} color="var(--accent-blue)" />
        </Link>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Team: {trn.teamId?.name || "Main Team"}
        </div>
      </div>
    ),
  },
  {
    header: "Format",
    width: "10%",
    render: (trn: any) => (
      <Badge variant="purple">{trn.format || "Hard Ball"}</Badge>
    ),
  },
  {
    header: "Venue & Date",
    width: "15%",
    render: (trn: any) => (
      <div>
        <div style={{ fontSize: "13px" }}>{trn.venue || "Karachi Grounds"}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {trn.startDate ? formatDate(trn.startDate) : "Active Season"}
        </div>
      </div>
    ),
  },
  {
    header: "Entry Fee & Balance",
    width: "13%",
    render: (trn: any) => {
      const entry = trn.financials?.entryFee ?? trn.entryFee ?? 0;
      const balance = trn.financials?.entryFeeBalance ?? entry;
      return (
        <div>
          <div style={{ fontWeight: 700, fontSize: "12.5px" }}>
            Rs. {fNum(entry)}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: balance > 0 ? "var(--accent-rose)" : "var(--accent-green)",
            }}
          >
            Bal: Rs. {fNum(balance)}
          </div>
        </div>
      );
    },
  },
  {
    header: "Total Paid",
    width: "11%",
    style: { fontWeight: 600, color: "var(--accent-rose)" },
    render: (trn: any) =>
      `Rs. ${fNum(trn.financials?.totalPaid ?? trn.financials?.matchExpenses ?? 0)}`,
  },
  {
    header: "Prize Won",
    width: "11%",
    style: { fontWeight: 700, color: "var(--accent-green)" },
    render: (trn: any) => {
      const winPrize =
        trn.financials?.actualWinningPrizeWon || trn.actualWinningPrizeWon || 0;
      const matchPrize = trn.financials?.matchPrizeWon || 0;
      const total = winPrize + matchPrize;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span>Rs. {fNum(total)}</span>
          {matchPrize > 0 && (
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                color: "var(--accent-amber)",
              }}
            >
              🏆 MOM: Rs. {fNum(matchPrize)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    header: "Net ROI",
    width: "10%",
    render: (trn: any) => {
      const netPnl = trn.financials?.netPnl ?? 0;
      const isProfitable = netPnl >= 0;
      return (
        <Badge variant={isProfitable ? "success" : "danger"}>
          {isProfitable ? "+" : ""}Rs. {fNum(netPnl)}
        </Badge>
      );
    },
  },
  {
    header: "Status",
    width: "9%",
    render: (trn: any) => (
      <Badge variant={getStatusBadgeVariant(trn.status)}>
        {trn.status?.toUpperCase() || "ONGOING"}
      </Badge>
    ),
  },
  {
    header: "Actions",
    width: "9%",
    align: "right",
    render: (trn: any) => (
      <div
        className="action-group"
        style={{ justifyContent: "flex-end" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          icon={<PencilIcon size={14} color="var(--accent-blue)" />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(trn);
          }}
          title="Edit Tournament"
        />
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<TrashIcon size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(trn._id, trn.name);
          }}
          title="Delete Tournament"
        />
      </div>
    ),
  },
];
