"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "./Modal";
import { Input, Select, Textarea, Button, Alert, Badge, Checkbox } from "./ui";
import { fetchApi } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { CreateTeamFormValues } from "../types";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");

  const playersQuery = useQuery({
    queryKey: queryKeys.players(),
    queryFn: () => fetchApi<{ success: boolean; players: any[] }>("/players"),
    enabled: isOpen,
  });

  const allPlayers = playersQuery.data?.players || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamFormValues>({
    defaultValues: {
      name: "",
      shortName: "",
      teamType: "my_team",
      phone: "",
      city: "Karachi",
      primaryColor: "#0284c7",
      description: "",
    },
  });

  const currentColor = watch("primaryColor");
  const currentTeamType = watch("teamType");

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayerIds([]);
      setPlayerSearch("");
    }
  }, [isOpen]);

  const handleClose = () => {
    reset();
    setSelectedPlayerIds([]);
    setPlayerSearch("");
    setServerError(null);
    onClose();
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const filteredPlayers = allPlayers.filter((p: any) => {
    const q = playerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q) ||
      String(p.jerseyNumber || "").includes(q)
    );
  });

  const toggleSelectAll = () => {
    const allIds = filteredPlayers.map((p: any) => p._id || p.id);
    const allSelected =
      allIds.length > 0 &&
      allIds.every((id: string) => selectedPlayerIds.includes(id));
    if (allSelected) {
      setSelectedPlayerIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedPlayerIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const onSubmit = async (values: CreateTeamFormValues) => {
    setServerError(null);
    try {
      const res = await fetchApi<{ success: boolean }>("/teams", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          playerIds: selectedPlayerIds,
        }),
      });

      if (res.success) {
        reset();
        setSelectedPlayerIds([]);
        queryClient.invalidateQueries({ queryKey: ["players"] });
        onSuccess();
        onClose();
      } else {
        setServerError("Failed to create team.");
      }
    } catch (err: any) {
      setServerError(err?.message || "Network error while creating team.");
    }
  };

  const playersWithPhone = allPlayers.filter((p: any) => p.phone);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Team & Assign Squad"
      footer={
        <div
          className="form-actions"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            width: "100%",
          }}
        >
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
            Save Team{" "}
            {selectedPlayerIds.length > 0
              ? `(${selectedPlayerIds.length} Players)`
              : ""}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Saving Team">
            {serverError}
          </Alert>
        )}

        <div className="grid-2">
          <Input
            label="Team Name *"
            placeholder="e.g. Gulzar Hard Ball XI"
            {...register("name", { required: "Team name is required" })}
            error={errors.name?.message}
          />
          <Select
            label="Team Category *"
            {...register("teamType")}
            options={[
              { value: "my_team", label: "My Club Team" },
              { value: "opponent", label: "Opponent Team" },
            ]}
          />
        </div>

        <div className="grid-2">
          <Input
            label="Short Code *"
            placeholder="e.g. GHB"
            {...register("shortName", { required: "Short code is required" })}
            error={errors.shortName?.message}
          />
          <Input
            label="City / Base"
            placeholder="e.g. Karachi"
            {...register("city")}
          />
        </div>

        <div className="grid-2">
          <div>
            <Input
              label="Team / Captain Phone Number"
              placeholder="e.g. 0342-2181946"
              list="create-team-phone-options"
              {...register("phone")}
            />
            <datalist id="create-team-phone-options">
              {playersWithPhone.map((p: any) => (
                <option key={p._id || p.id} value={p.phone}>
                  {p.name} ({p.phone})
                </option>
              ))}
            </datalist>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "6px",
                color: "var(--text-secondary)",
              }}
            >
              Primary Color Theme
            </label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="color"
                value={currentColor || "#0284c7"}
                onChange={(e) => setValue("primaryColor", e.target.value)}
                style={{
                  width: "42px",
                  height: "38px",
                  padding: 0,
                  cursor: "pointer",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color)",
                }}
              />
              <Input {...register("primaryColor")} placeholder="#0284c7" />
            </div>
          </div>
        </div>

        <Textarea
          label="Description / Bio"
          rows={2}
          placeholder="About this team..."
          {...register("description")}
        />

        {/* Squad Player Selection (primarily for My Club Teams) */}
        {currentTeamType !== "opponent" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Select Squad Players ({selectedPlayerIds.length} selected)
              </label>
              {filteredPlayers.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-blue)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {filteredPlayers.every((p: any) =>
                    selectedPlayerIds.includes(p._id || p.id),
                  )
                    ? "Deselect All"
                    : `Select All (${filteredPlayers.length})`}
                </button>
              )}
            </div>

            <Input
              placeholder="Filter players by name, phone, or #jersey..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              style={{ marginBottom: "8px" }}
            />

            <div
              style={{
                maxHeight: "185px",
                overflowY: "auto",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                background: "#ffffff",
              }}
            >
              {filteredPlayers.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  No players found.
                </div>
              ) : (
                filteredPlayers.map((p: any) => {
                  const pid = p._id || p.id;
                  const checked = selectedPlayerIds.includes(pid);
                  return (
                    <div
                      key={pid}
                      onClick={() => togglePlayer(pid)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 12px",
                        borderBottom: "1px solid var(--border-color)",
                        background: checked ? "#eff6ff" : "#ffffff",
                        cursor: "pointer",
                        fontSize: "12.5px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            size="sm"
                            variant="primary"
                            checked={checked}
                            onChange={() => togglePlayer(pid)}
                            aria-label={`Select ${p.name}`}
                          />
                        </div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {p.name}
                        </span>
                        {p.jerseyNumber !== undefined &&
                          p.jerseyNumber !== null && (
                            <Badge
                              variant="purple"
                              style={{ fontSize: "10px", padding: "1px 5px" }}
                            >
                              #{p.jerseyNumber}
                            </Badge>
                          )}
                      </div>
                      <span
                        style={{ fontSize: "11px", color: "var(--text-muted)" }}
                      >
                        {p.phone || ""}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
