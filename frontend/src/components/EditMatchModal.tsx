"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "./Modal";
import { Input, Select, DatePicker, Textarea, Button, Alert } from "./ui";
import { fetchApi } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import {
  MATCH_STAGE_OPTIONS,
  MATCH_RESULT_OPTIONS,
  MATCH_TYPE_OPTIONS,
  MatchStage,
  MatchResult,
} from "../constants";
import { EditMatchFormValues } from "../types";

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any | null;
  tournaments?: any[];
  onSuccess: () => void;
}

export const EditMatchModal: React.FC<EditMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  tournaments: propTournaments,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>("/teams"),
    enabled: isOpen,
  });

  const tournamentsQuery = useQuery({
    queryKey: queryKeys.tournaments(),
    queryFn: () =>
      fetchApi<{ success: boolean; tournaments: any[] }>("/tournaments"),
    enabled: isOpen && (!propTournaments || propTournaments.length === 0),
  });

  const teams = teamsQuery.data?.teams || [];
  const tournaments =
    propTournaments && propTournaments.length > 0
      ? propTournaments
      : tournamentsQuery.data?.tournaments || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditMatchFormValues>({
    defaultValues: {
      teamId: "",
      tournamentId: "",
      opponentTeam: "",
      venue: "",
      matchDate: new Date().toISOString().split("T")[0],
      matchType: "tournament",
      stage: MatchStage.GROUP,
      perPlayerFee: 1000,
      totalMatchExpense: 11000,
      overs: 20,
      result: MatchResult.UPCOMING,
      notes: "",
    },
  });

  const currentDate = watch("matchDate");
  const selectedTeamId = watch("teamId");
  const selectedTournamentId = watch("tournamentId");
  const selectedOpponentTeam = watch("opponentTeam");
  const selectedMatchType = watch("matchType");
  const selectedStage = watch("stage");
  const selectedResult = watch("result");

  const tournamentOptions = useMemo(() => {
    return [
      { value: "", label: "None / Friendly Match" },
      ...tournaments.map((t) => ({
        value: t._id,
        label: t.format ? `${t.name} (${t.format})` : t.name,
      })),
    ];
  }, [tournaments]);

  // Options for Team 1 (Club / My Team)
  const clubTeamOptions = useMemo(() => {
    const ownTeams = teams.filter(
      (t) =>
        t.teamType === "my_team" ||
        (!t.teamType && (t.name || "").toLowerCase().includes("gulzar")),
    );
    const otherTeams = teams.filter((t) => !ownTeams.some((ot) => ot._id === t._id));

    const opts = [
      ...ownTeams.map((t) => ({
        value: t._id,
        label: `${t.name}${t.shortName ? ` (${t.shortName})` : ""} — Club Team`,
      })),
      ...(otherTeams.length > 0
        ? otherTeams.map((t) => ({
            value: t._id,
            label: `${t.name}${t.shortName ? ` (${t.shortName})` : ""}`,
          }))
        : []),
    ];

    const currentTeamId = match?.teamId?._id || match?.teamId;
    if (currentTeamId && !opts.some((o) => o.value === currentTeamId)) {
      const name = match.teamId?.name || "Current Team";
      opts.unshift({ value: currentTeamId, label: name });
    }

    return opts;
  }, [teams, match]);

  // Options for Team 2 (Opponent Team)
  const opponentTeamOptions = useMemo(() => {
    const activeTeamId = selectedTeamId || match?.teamId?._id || match?.teamId;
    const available = teams
      .filter((t) => t._id !== activeTeamId)
      .sort((a, b) => {
        const aIsOpp = a.teamType === "opponent" ? 0 : 1;
        const bIsOpp = b.teamType === "opponent" ? 0 : 1;
        if (aIsOpp !== bIsOpp) return aIsOpp - bIsOpp;
        return (a.name || "").localeCompare(b.name || "");
      });

    const opts = [
      { value: "", label: "Select Opponent Team..." },
      ...available.map((t) => ({
        value: t.name,
        label: t.shortName ? `${t.name} (${t.shortName})` : t.name,
      })),
    ];

    if (
      match?.opponentTeam &&
      !opts.some((o) => o.value === match.opponentTeam)
    ) {
      opts.splice(1, 0, {
        value: match.opponentTeam,
        label: match.opponentTeam,
      });
    }

    return opts;
  }, [teams, match, selectedTeamId]);

  useEffect(() => {
    if (match && isOpen) {
      const formattedDate = match.matchDate
        ? new Date(match.matchDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const initialTeamId = match.teamId?._id || match.teamId || "";
      const tourneyId = match.tournamentId?._id || match.tournamentId || "";

      reset({
        teamId: String(initialTeamId),
        tournamentId: tourneyId,
        opponentTeam: match.opponentTeam || "",
        venue: match.venue || "",
        matchDate: formattedDate,
        matchType: match.matchType || (tourneyId ? "tournament" : "friendly"),
        stage: match.tournamentStage || match.stage || MatchStage.GROUP,
        perPlayerFee:
          match.perPlayerFee !== undefined ? match.perPlayerFee : 1000,
        totalMatchExpense:
          match.totalMatchExpense !== undefined
            ? match.totalMatchExpense
            : 11000,
        overs: match.overs !== undefined ? match.overs : 20,
        result: match.result || MatchResult.UPCOMING,
        notes: match.notes || "",
      });
      setServerError(null);
    }
  }, [match, isOpen, reset]);

  const onSubmit = async (values: EditMatchFormValues) => {
    if (!match?._id) return;
    setServerError(null);
    try {
      const payload = {
        ...values,
        teamId: values.teamId,
        tournamentId: values.tournamentId ? values.tournamentId : null,
        tournamentStage: values.stage,
        matchType: values.tournamentId ? "tournament" : values.matchType,
        perPlayerFee: Number(values.perPlayerFee) || 0,
        totalMatchExpense: Number(values.totalMatchExpense) || 0,
        groundCost: Number(values.totalMatchExpense) || 0,
        overs: Number(values.overs) || 20,
      };

      const res = await fetchApi<{ success: boolean }>(
        `/matches/${match._id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.teams() });
        queryClient.invalidateQueries({ queryKey: queryKeys.matches() });
        queryClient.invalidateQueries({ queryKey: queryKeys.tournaments() });
        if (match._id) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.match(match._id),
          });
        }
        if (match.tournamentId) {
          const tId = match.tournamentId._id || match.tournamentId;
          queryClient.invalidateQueries({ queryKey: queryKeys.tournament(tId) });
        }
        if (
          values.tournamentId &&
          values.tournamentId !== (match.tournamentId?._id || match.tournamentId)
        ) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.tournament(values.tournamentId),
          });
        }
        onSuccess();
        onClose();
      } else {
        setServerError("Failed to update match record.");
      }
    } catch (err: any) {
      setServerError(err?.message || "Network error while updating match.");
    }
  };

  const selectedTeamName =
    teams.find((t) => t._id === selectedTeamId)?.name ||
    match?.teamId?.name ||
    "Team 1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        match
          ? `Edit Match — ${selectedTeamName} vs ${selectedOpponentTeam || match.opponentTeam || "Opponent"}`
          : "Edit Match"
      }
      subtitle="Modify club team, opponent team, venue ground, fee assignment, and result"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Saving Changes">
            {serverError}
          </Alert>
        )}

        {/* Row 1: Team 1 (Club Team) & Team 2 (Opponent Team) */}
        <div className="grid-2" style={{ alignItems: "end" }}>
          <Select
            label="My Team / Club Team (Team 1) *"
            value={selectedTeamId}
            options={clubTeamOptions}
            {...register("teamId", { required: "Club team is required" })}
            error={errors.teamId?.message}
          />

          <Select
            label="Opponent Team (Team 2) *"
            searchable
            searchPlaceholder="Search opponent team..."
            value={selectedOpponentTeam}
            options={opponentTeamOptions}
            {...register("opponentTeam", {
              required: "Opponent team is required",
            })}
            error={errors.opponentTeam?.message}
          />
        </div>

        {/* Row 2: Tournament / League & Venue / Ground */}
        <div className="grid-2" style={{ alignItems: "end" }}>
          <Select
            label="Tournament / League"
            value={selectedTournamentId}
            options={tournamentOptions}
            {...register("tournamentId", {
              onChange: (e) => {
                if (e.target.value) {
                  setValue("matchType", "tournament");
                }
              },
            })}
          />

          <Input
            label="Venue / Ground *"
            placeholder="e.g. Behria Karsaz / Asghar Ali Shah"
            {...register("venue", { required: "Venue is required" })}
            error={errors.venue?.message}
          />
        </div>

        {/* Row 3: Match Date, Match Type, Stage */}
        <div className="grid-3" style={{ alignItems: "end" }}>
          <DatePicker
            label="Match Date *"
            value={currentDate}
            onChange={(e) => setValue("matchDate", e.target.value)}
          />

          <Select
            label="Match Type"
            value={selectedMatchType}
            options={MATCH_TYPE_OPTIONS}
            {...register("matchType")}
          />

          <Select
            label="Stage"
            value={selectedStage}
            options={MATCH_STAGE_OPTIONS}
            {...register("stage")}
          />
        </div>

        {/* Row 4: Match Result, Fee per Player, Ground Cost */}
        <div className="grid-3" style={{ alignItems: "end" }}>
          <Select
            label="Match Result"
            value={selectedResult}
            options={MATCH_RESULT_OPTIONS}
            {...register("result")}
          />

          <Input
            label="Fee per Player (Rs.) *"
            type="number"
            placeholder="1000"
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
            {...register("totalMatchExpense")}
          />
        </div>

        {/* Row 5: Overs & Match Notes */}
        <div className="grid-2" style={{ alignItems: "end" }}>
          <Input
            label="Overs per Innings"
            type="number"
            placeholder="20"
            {...register("overs")}
          />

          <Textarea
            label="Match Notes / Remarks"
            rows={2}
            placeholder="Kit color, meeting time, score summary..."
            {...register("notes")}
          />
        </div>
      </form>
    </Modal>
  );
};
