import React from "react";
import Link from "next/link";
import { Column } from "../components/ui/DataTable";
import { Badge, Button } from "../components/ui";
import { PencilIcon, TrashIcon } from "../components/icons";
import { Tournament } from "../types";
import { formatDate, formatNumber } from "../lib/format";
import { cellMain as main, cellSub as sub, cellNum as num, cellOneLine } from "./cellStyles";
import { getTournamentStatusVariant } from "../constants/badgeVariants";

const oneLine = { ...cellOneLine, maxWidth: "180px" };

interface TournamentColumnActions {
  onEdit: (tournament: Tournament) => void;
  onDelete: (id: string, name: string) => void;
}

export const getTournamentColumns = ({
  onEdit,
  onDelete,
}: TournamentColumnActions): Column<Tournament>[] => {
  const money = (v: number) => `${v < 0 ? "−" : ""}Rs. ${formatNumber(Math.abs(v))}`;

  return [
    {
      header: "Tournament",
      render: (trn: any) => (
        <div>
          <Link
            href={`/tournaments/${trn._id}`}
            onClick={(e) => e.stopPropagation()}
            style={{ ...main, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            {trn.name}
          </Link>
          <div style={{ ...sub, whiteSpace: "nowrap" }}>
            {[trn.format, trn.teamId?.name].filter(Boolean).join(" · ")}
          </div>
        </div>
      ),
    },
    {
      header: "Venue & Date",
      render: (trn: any) => (
        <div>
          <div style={{ ...oneLine, fontSize: "13.5px" }} title={trn.venue || ""}>
            {trn.venue || "—"}
          </div>
          <div style={sub}>{trn.startDate ? formatDate(trn.startDate) : "—"}</div>
        </div>
      ),
    },
    {
      header: "Entry Fee",
      align: "right",
      render: (trn: any) => {
        const entry = trn.financials?.entryFee ?? trn.entryFee ?? 0;
        const balance = trn.financials?.entryFeeBalance ?? entry;
        return (
          <div style={num}>
            <div style={main}>{money(entry)}</div>
            <div style={{ ...sub, color: balance > 0 ? "var(--accent-rose)" : "var(--text-muted)" }}>
              {balance > 0 ? `${money(balance)} due` : "Settled"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Total Paid",
      align: "right",
      render: (trn: any) => (
        <span style={{ ...main, ...num }}>
          {money(trn.financials?.totalPaid ?? trn.financials?.matchExpenses ?? 0)}
        </span>
      ),
    },
    {
      header: "Prize Won",
      align: "right",
      render: (trn: any) => {
        const winPrize = trn.financials?.actualWinningPrizeWon || trn.actualWinningPrizeWon || 0;
        const matchPrize = trn.financials?.matchPrizeWon || 0;
        return (
          <div style={num}>
            <div style={main}>{money(winPrize + matchPrize)}</div>
            {matchPrize > 0 && <div style={sub}>MOM {money(matchPrize)}</div>}
          </div>
        );
      },
    },
    {
      header: "Net ROI",
      mobile: "summary",
      align: "right",
      render: (trn: any) => {
        const netPnl = trn.financials?.netPnl ?? 0;
        return (
          <span
            style={{
              ...main,
              ...num,
              color: netPnl > 0 ? "var(--accent-green)" : netPnl < 0 ? "var(--accent-rose)" : "var(--text-muted)",
            }}
          >
            {netPnl > 0 ? "+" : ""}
            {money(netPnl)}
          </span>
        );
      },
    },
    {
      header: "Status",
      render: (trn: any) => (
        <Badge variant={getTournamentStatusVariant(trn.status)}>
          {(trn.status || "ongoing").replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      header: "Actions",
      width: "96px",
      align: "right",
      render: (trn: any) => (
        <div
          className="action-group"
          style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            icon={<PencilIcon size={14} />}
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
};
