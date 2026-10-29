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
      tournamentId: "",
      opponentTeam: "",
      venue: "",
      matchDate: new Date().toISOString().split("T")[0],
      matchType: "tournament",
      stage: MatchStage.GROUP,
      perPlayerFee: 1000,
      totalMatchExpense: 11000,
      result: MatchResult.UPCOMING,
      notes: "",
    },
  });

  const currentDate = watch("matchDate");
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

  const opponentTeamOptions = useMemo(() => {
    const matchTeamId = match?.teamId?._id || match?.teamId;
    const available = teams
      .filter((t) => t._id !== matchTeamId)
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
  }, [teams, match]);

  useEffect(() => {
    if (match && isOpen) {
      const formattedDate = match.matchDate
        ? new Date(match.matchDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const tourneyId = match.tournamentId?._id || match.tournamentId || "";

      reset({
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
        tournamentId: values.tournamentId ? values.tournamentId : null,
        tournamentStage: values.stage,
        matchType: values.tournamentId ? "tournament" : values.matchType,
        perPlayerFee: Number(values.perPlayerFee) || 0,
        totalMatchExpense: Number(values.totalMatchExpense) || 0,
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
        onSuccess();
        onClose();
      } else {
        setServerError("Failed to update match record.");
      }
    } catch (err: any) {
      setServerError(err?.message || "Network error while updating match.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        match
          ? `Edit Match vs ${match.opponentTeam || "Opponent"}`
          : "Edit Match"
      }
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
        </div>

        <div className="grid-2" style={{ alignItems: "end" }}>
          <Input
            label="Venue / Ground *"
            placeholder="e.g. Asghar Ali Shah Stadium"
            {...register("venue", { required: "Venue is required" })}
            error={errors.venue?.message}
          />

          <DatePicker
            label="Match Date *"
            value={currentDate}
            onChange={(e) => setValue("matchDate", e.target.value)}
          />
        </div>

        <div className="grid-3" style={{ alignItems: "end" }}>
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

          <Select
            label="Match Result"
            value={selectedResult}
            options={MATCH_RESULT_OPTIONS}
            {...register("result")}
          />
        </div>

        <div className="grid-2" style={{ alignItems: "end" }}>
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

        <Textarea
          label="Match Notes / Remarks"
          rows={2}
          placeholder="Kit color, meeting time, score summary..."
          {...register("notes")}
        />
      </form>
    </Modal>
  );
};
