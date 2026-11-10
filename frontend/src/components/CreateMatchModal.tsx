"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "./Modal";
import {
  Input,
  Select,
  DatePicker,
  Textarea,
  Button,
  Alert,
  Badge,
} from "./ui";
import { fetchApi } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import {
  MATCH_STAGE_OPTIONS,
  MATCH_TYPE_OPTIONS,
  MatchStage,
} from "../constants";
import { CreateMatchFormValues } from "../types";
import { tournamentOptions } from "../lib/options";

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: any[];
  tournaments: any[];
  defaultTournamentId?: string;
  defaultTeamId?: string;
  lockTournament?: boolean;
  onSuccess: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  teams,
  tournaments,
  defaultTournamentId,
  defaultTeamId,
  lockTournament = false,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const myTeams = useMemo(() => {
    const own = teams.filter(
      (t) =>
        t.teamType === "my_team" ||
        (!t.teamType && (t.name || "").toLowerCase().includes("gulzar")),
    );
    return own.length > 0 ? own : teams;
  }, [teams]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateMatchFormValues>({
    defaultValues: {
      teamId: defaultTeamId || myTeams[0]?._id || "",
      tournamentId: defaultTournamentId || tournaments[0]?._id || "",
      opponentTeam: "",
      venue: "",
      matchDate: new Date().toISOString().split("T")[0],
      matchType: "tournament",
      stage: MatchStage.GROUP,
      perPlayerFee: 1000,
      totalMatchExpense: 11000,
      overs: 20,
      notes: "",
    },
  });

  const currentDate = watch("matchDate");
  const selectedTeamId = watch("teamId");
  const selectedTournamentId = watch("tournamentId");
  const selectedOpponentTeam = watch("opponentTeam");
  const selectedMatchType = watch("matchType");
  const selectedStage = watch("stage");

  // Ensure default teamId & tournamentId are populated when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialTeamId = defaultTeamId || myTeams[0]?._id || "";
      const initialTourneyId = defaultTournamentId || tournaments[0]?._id || "";
      if (initialTeamId) {
        setValue("teamId", initialTeamId);
      }
      if (initialTourneyId) {
        setValue("tournamentId", initialTourneyId);
        setValue("matchType", "tournament");
      }
    }
  }, [
    isOpen,
    defaultTeamId,
    defaultTournamentId,
    myTeams,
    tournaments,
    setValue,
  ]);

  // Opponent teams: all teams except the currently selected team, with 'opponent' teams listed first
  const opponentTeamOptions = useMemo(() => {
    const available = teams
      .filter((t) => t._id !== selectedTeamId)
      .sort((a, b) => {
        const aIsOpp = a.teamType === "opponent" ? 0 : 1;
        const bIsOpp = b.teamType === "opponent" ? 0 : 1;
        if (aIsOpp !== bIsOpp) return aIsOpp - bIsOpp;
        return (a.name || "").localeCompare(b.name || "");
      });

    return [
      { value: "", label: "Select Opponent Team..." },
      ...available.map((t) => ({
        value: t.name,
        label: t.shortName ? `${t.name} (${t.shortName})` : t.name,
      })),
    ];
  }, [teams, selectedTeamId]);

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: CreateMatchFormValues) => {
    setServerError(null);
    try {
      const resolvedTournamentId =
        defaultTournamentId || values.tournamentId || undefined;
      const expenseAmount = Number(values.totalMatchExpense) || 0;
      const isTourney = Boolean(lockTournament || resolvedTournamentId);
      const payload = {
        ...values,
        tournamentId: resolvedTournamentId,
        tournamentStage: values.stage,
        matchType: isTourney ? "tournament" : values.matchType,
        perPlayerFee: Number(values.perPlayerFee) || 0,
        totalMatchExpense: expenseAmount,
        groundCost: expenseAmount,
        isReimbursed: isTourney,
        reimbursedAmount: isTourney ? expenseAmount : 0,
        overs: Number(values.overs) || 20,
      };

      const res = await fetchApi<{ success: boolean }>("/matches", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams() });
        queryClient.invalidateQueries({ queryKey: queryKeys.matches() });
        reset();
        onSuccess();
        onClose();
      } else {
        setServerError("Failed to create match.");
      }
    } catch (err: any) {
      setServerError(err?.message || "Network error while creating match.");
    }
  };

  const lockedTournamentObj = defaultTournamentId
    ? tournaments.find((t) => t._id === defaultTournamentId)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="780px"
      title={
        lockedTournamentObj
          ? `Schedule Match — ${lockedTournamentObj.name}`
          : "Schedule New Match"
      }
      subtitle={
        lockedTournamentObj
          ? `Add a new fixture to ${lockedTournamentObj.name} (${lockedTournamentObj.format || "Hard Ball"})`
          : "Record match fixture, opponent team, ground venue & fee structure"
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
          >
            Save Match
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Scheduling Match">
            {serverError}
          </Alert>
        )}

        {/* Row 1: Team & Tournament (Read-only filled when locked to a specific tournament) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <Select
            label="Club Team *"
            value={selectedTeamId}
            options={myTeams.map((t) => ({ value: t._id, label: t.name }))}
            {...register("teamId", { required: "Team is required" })}
            error={errors.teamId?.message}
          />

          {lockTournament && lockedTournamentObj ? (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Tournament / League
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  background: "#f0f9ff",
                  border: "1px solid #cbd5e1",
                  color: "#334155",
                  fontSize: "13.5px",
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{lockedTournamentObj.name}</span>
                </span>
                <Badge
                  variant="primary"
                  style={{ fontSize: "10px", padding: "2px 6px" }}
                >
                  {lockedTournamentObj.format || "Hard Ball"}
                </Badge>
              </div>
              <input type="hidden" {...register("tournamentId")} />
            </div>
          ) : (
            <Select
              label="Tournament / League"
              value={selectedTournamentId}
              options={tournamentOptions(tournaments, "Friendly / No Tournament")}
              {...register("tournamentId")}
            />
          )}
        </div>

        {/* Row 2: Opponent Team & Venue */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <Select
            label="Opponent Team *"
            searchable
            searchPlaceholder="Search opponent team..."
            value={selectedOpponentTeam}
            options={opponentTeamOptions}
            {...register("opponentTeam", {
              required: "Opponent team is required",
            })}
            error={errors.opponentTeam?.message}
          />

          <Input
            label="Venue / Ground *"
            placeholder="e.g. Korangi Eidgah / Landhi"
            defaultValue={lockedTournamentObj?.venue || ""}
            {...register("venue", { required: "Venue is required" })}
            error={errors.venue?.message}
          />
        </div>

        {/* Row 3: Date, Match Type (hidden when locked to tournament) & Stage */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: lockTournament
              ? "repeat(auto-fit, minmax(260px, 1fr))"
              : "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <DatePicker
            label="Match Date"
            required
            value={currentDate}
            onChange={(e) => setValue("matchDate", e.target.value)}
          />

          {!lockTournament && (
            <Select
              label="Match Type"
              value={selectedMatchType}
              options={MATCH_TYPE_OPTIONS}
              {...register("matchType")}
            />
          )}

          <Select
            label="Tournament Stage"
            value={selectedStage}
            options={MATCH_STAGE_OPTIONS}
            {...register("stage")}
          />
        </div>

        {/* Row 4: Overs, Fee per Player & Total Ground Cost */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            alignItems: "end",
          }}
        >
          <Input
            label="Match Overs"
            type="number"
            placeholder="20"
            onWheel={(e) => e.currentTarget.blur()}
            {...register("overs")}
          />

          <Input
            label="Fee per Player (Rs.) *"
            type="number"
            placeholder="1000"
            onWheel={(e) => e.currentTarget.blur()}
            {...register("perPlayerFee", {
              required: "Player fee is required",
              min: { value: 0, message: "Fee cannot be negative" },
            })}
            error={errors.perPlayerFee?.message}
          />

          <Input
            label="Ground / Match Cost (Rs.)"
            type="number"
            placeholder="11000"
            onWheel={(e) => e.currentTarget.blur()}
            {...register("totalMatchExpense")}
          />
        </div>

        <Textarea
          label="Match Notes / Instructions"
          rows={2}
          placeholder="Kit color, meeting time, ground rules..."
          {...register("notes")}
        />
      </form>
    </Modal>
  );
};
