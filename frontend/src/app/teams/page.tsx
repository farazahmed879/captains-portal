"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { Header } from "../../components/Header";
import {
  Button,
  Badge,
  Input,
  Textarea,
  Modal,
  ViewSwitcher,
  DataTable,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Pagination,
  CardGridSkeleton,
  BulkActionBar,
  GridSelectCheckbox,
} from "../../components/ui";
import { fetchApi } from "../../lib/api";
import { confirmDelete, confirmBulkDelete, showToast } from "../../lib/alerts";
import {
  Plus,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  Shield,
  Users,
  Swords,
  Trophy,
} from "../../components/icons";
import { CreateTeamModal } from "../../components/CreateTeamModal";
import { EditTeamModal } from "../../components/EditTeamModal";
import { ManageTeamPlayersModal } from "../../components/ManageTeamPlayersModal";

type TeamFilterTab = "my_team" | "all" | "opponent";

export default function TeamsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [managingSquadTeam, setManagingSquadTeam] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [teamFilter, setTeamFilter] = useState<TeamFilterTab>("my_team");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmBulkDelete(selectedIds.length, "Teams");
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) => fetchApi(`/teams/${id}`, { method: "DELETE" })),
      );
      showToast.success(`${selectedIds.length} team(s) deleted.`);
      setSelectedIds([]);
      invalidateTeams();
    } catch (err) {
      showToast.error("Failed to delete selected teams.");
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const pageSize = 10;

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>("/teams"),
  });

  const matchesQuery = useQuery({
    queryKey: queryKeys.matches(),
    queryFn: () => fetchApi<{ success: boolean; matches: any[] }>("/matches"),
  });

  const rawTeams = teamsQuery.data?.teams || [];
  const allMatches = matchesQuery.data?.matches || [];
  const loading = teamsQuery.isLoading;

  const getTeamType = (t: any): "my_team" | "opponent" => {
    if (t.teamType === "my_team" || t.teamType === "opponent")
      return t.teamType;
    return (t.name || "").toLowerCase().includes("gulzar")
      ? "my_team"
      : "opponent";
  };

  // Enrich teams with live match counts against our team so Opponent Teams tab updates immediately
  const teams = rawTeams.map((t: any) => {
    const type = getTeamType(t);
    if (type === "my_team") return t;
    const normName = (t.name || "").trim().toLowerCase();
    const matchedList = allMatches.filter(
      (m: any) =>
        m.teamId === t._id ||
        (m.opponentTeam || "").trim().toLowerCase() === normName,
    );
    const liveMatchCount = Math.max(t.matchCount || 0, matchedList.length);
    return {
      ...t,
      matchCount: liveMatchCount,
      hasPlayedMatch: Boolean(t.hasPlayedMatch || liveMatchCount > 0),
    };
  });

  const hasPlayedAgainstMyTeam = (t: any): boolean => {
    return Boolean(t.hasPlayedMatch || (t.matchCount || 0) > 0);
  };

  const myTeamsCount = teams.filter((t) => getTeamType(t) === "my_team").length;
  const opponentTeamsCount = teams.filter(
    (t) => getTeamType(t) === "opponent" && hasPlayedAgainstMyTeam(t),
  ).length;

  const invalidateTeams = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.teams() });
    queryClient.invalidateQueries({ queryKey: queryKeys.matches() });
    queryClient.invalidateQueries({ queryKey: queryKeys.players() });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleEditOpen = (team: any) => {
    setEditingTeam(team);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDelete(`team "${name}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/teams/${id}`, {
        method: "DELETE",
      });
      if (res.success) {
        showToast.success(`Team "${name}" deleted.`);
        invalidateTeams();
      }
    } catch (err) {
      showToast.error("Failed to delete team.");
    }
  };

  const filteredTeams = teams.filter((t) => {
    const type = getTeamType(t);
    if (teamFilter === "my_team" && type !== "my_team") return false;
    if (
      teamFilter === "opponent" &&
      (type !== "opponent" || !hasPlayedAgainstMyTeam(t))
    ) {
      return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (t.name || "").toLowerCase().includes(q) ||
      (t.shortName || "").toLowerCase().includes(q) ||
      (t.phone || "").toLowerCase().includes(q) ||
      (t.city || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredTeams.length / pageSize) || 1;
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <>
      <Header
        title="My Teams & Squad Management"
        subtitle="Manage Separate Club Teams (Hard Ball, Tape Ball) & Opponent Teams"
      />

      <div className="content-body">
        {/* Filter and View Switcher Bar */}
        <div
          className="filter-bar"
          style={{ flexWrap: "wrap", gap: "12px", alignItems: "center" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Filter Tabs: My Teams | All Teams / Opponent Teams */}
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                padding: "4px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setTeamFilter("my_team");
                  setCurrentPage(1);
                  setSelectedIds([]);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "7px",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background:
                    teamFilter === "my_team" ? "#0284c7" : "transparent",
                  color:
                    teamFilter === "my_team"
                      ? "#ffffff"
                      : "var(--text-secondary)",
                  boxShadow:
                    teamFilter === "my_team"
                      ? "0 2px 6px rgba(2, 132, 199, 0.25)"
                      : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Shield size={13} />
                <span>My Teams ({myTeamsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTeamFilter("opponent");
                  setCurrentPage(1);
                  setSelectedIds([]);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "7px",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background:
                    teamFilter === "opponent" ? "#0284c7" : "transparent",
                  color:
                    teamFilter === "opponent"
                      ? "#ffffff"
                      : "var(--text-secondary)",
                  boxShadow:
                    teamFilter === "opponent"
                      ? "0 2px 6px rgba(2, 132, 199, 0.25)"
                      : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Swords size={13} />
                <span>Opponent Teams ({opponentTeamsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTeamFilter("all");
                  setCurrentPage(1);
                  setSelectedIds([]);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "7px",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: teamFilter === "all" ? "#0284c7" : "transparent",
                  color:
                    teamFilter === "all" ? "#ffffff" : "var(--text-secondary)",
                  boxShadow:
                    teamFilter === "all"
                      ? "0 2px 6px rgba(2, 132, 199, 0.25)"
                      : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>All Teams ({teams.length})</span>
              </button>
            </div>

            <div style={{ position: "relative", width: "260px" }}>
              <Input
                type="text"
                placeholder="Search team name, code, phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ paddingLeft: "12px", fontSize: "13px", margin: 0 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ViewSwitcher view={viewMode} onChange={setViewMode} />
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setIsModalOpen(true)}
            >
              <span>Create New Team</span>
            </Button>
          </div>
        </div>

        <BulkActionBar
          selectedIds={selectedIds}
          pageItemIds={paginatedTeams.map((t: any) => t._id)}
          allItemIds={filteredTeams.map((t: any) => t._id)}
          itemLabel="Teams"
          onSelectChange={setSelectedIds}
          onBulkDelete={handleBulkDelete}
          deleting={isBulkDeleting}
        />

        {/* VIEW 1: TABLE (LIST) VIEW */}
        {viewMode === "table" && (
          <div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <DataTable
                data={paginatedTeams}
                loading={loading}
                keyExtractor={(team: any) => team._id}
                emptyMessage={
                  teamFilter === "opponent"
                    ? "No opponent teams yet — a team appears here once your team plays or schedules at least 1 match against them. Check 'All Teams' to view all teams."
                    : "No teams found matching filter."
                }
                emptyIcon={<Shield size={28} />}
                onRowClick={(team: any) => router.push(`/teams/${team._id}`)}
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                columns={[
                  {
                    header: "Code",
                    width: "8%",
                    render: (team: any) => (
                      <Badge
                        variant="purple"
                        style={{
                          background: team.primaryColor
                            ? `${team.primaryColor}18`
                            : undefined,
                          color: team.primaryColor || "#0284c7",
                          fontWeight: 800,
                        }}
                      >
                        {team.shortName}
                      </Badge>
                    ),
                  },
                  {
                    header: "Team Name",
                    width: "24%",
                    render: (team: any) => {
                      const isMyTeam = getTeamType(team) === "my_team";
                      const isPlayedOpponent =
                        !isMyTeam && hasPlayedAgainstMyTeam(team);
                      return (
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <Link
                              href={`/teams/${team._id}`}
                              style={{
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <span>{team.name}</span>
                              <ExternalLink
                                size={11}
                                color="var(--accent-blue)"
                              />
                            </Link>
                            <Badge
                              variant={
                                isMyTeam
                                  ? "success"
                                  : isPlayedOpponent
                                    ? "warning"
                                    : "secondary"
                              }
                              style={{ fontSize: "10px", padding: "1px 6px" }}
                            >
                              {isMyTeam
                                ? "MY TEAM"
                                : isPlayedOpponent
                                  ? "OPPONENT"
                                  : "TEAM"}
                            </Badge>
                          </div>
                          {team.description && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {team.description}
                            </div>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    header: "Contact Phone",
                    width: "14%",
                    render: (team: any) =>
                      team.phone ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                          }}
                        >
                          <Phone size={12} color="var(--accent-green)" />
                          <span>{team.phone}</span>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          —
                        </span>
                      ),
                  },
                  {
                    header: "City / Base",
                    width: "11%",
                    render: (team: any) => (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "13px",
                        }}
                      >
                        <MapPin size={12} color="var(--accent-blue)" />
                        <span>{team.city || "Karachi"}</span>
                      </div>
                    ),
                  },
                  {
                    header: "Active Squad",
                    width: "11%",
                    style: { fontWeight: 600 },
                    render: (team: any) => `${team.playerCount || 0} Players`,
                  },
                  {
                    header: "Matches",
                    width: "10%",
                    style: { fontWeight: 600, color: "var(--accent-blue)" },
                    render: (team: any) => `${team.matchCount || 0} Matches`,
                  },
                  {
                    header: "Tournaments",
                    width: "10%",
                    style: { fontWeight: 600, color: "var(--accent-green)" },
                    render: (team: any) =>
                      `${team.tournamentCount || 0} Leagues`,
                  },
                  {
                    header: "Actions",
                    width: "12%",
                    align: "right",
                    render: (team: any) => (
                      <div
                        className="action-group"
                        style={{ justifyContent: "flex-end" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManagingSquadTeam(team);
                          }}
                          title="Add Players to Team"
                          icon={<Users size={13} color="var(--accent-green)" />}
                        >
                          <span>+ Players</span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          isIconOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOpen(team);
                          }}
                          title="Edit Team"
                          icon={<Pencil size={14} color="var(--accent-blue)" />}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          isIconOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(team._id, team.name);
                          }}
                          title="Delete Team"
                          icon={<Trash2 size={14} />}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </Card>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTeams.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemName="Teams"
            />
          </div>
        )}

        {/* VIEW 2: GRID (CARDS) VIEW */}
        {viewMode === "grid" && (
          <div>
            {loading ? (
              <CardGridSkeleton count={4} />
            ) : (
              <div className="grid-2">
                {paginatedTeams.map((team) => {
                  const isMyTeam = getTeamType(team) === "my_team";
                  return (
                    <Card
                      key={team._id}
                      style={{
                        borderTop: `4px solid ${team.primaryColor || "#0284c7"}`,
                      }}
                    >
                      <CardHeader>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <Link
                              href={`/teams/${team._id}`}
                              style={{
                                fontSize: "19px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span>{team.name}</span>
                              <ExternalLink
                                size={12}
                                color="var(--accent-blue)"
                              />
                            </Link>
                            <Badge
                              variant={isMyTeam ? "success" : "secondary"}
                              style={{ fontSize: "10px", padding: "2px 7px" }}
                            >
                              {isMyTeam ? "MY TEAM" : "OPPONENT"}
                            </Badge>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "6px",
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                              marginTop: "4px",
                            }}
                          >
                            <MapPin size={12} />
                            <span>{team.city || "Karachi"}</span>
                            <span>•</span>
                            <span
                              style={{
                                fontWeight: 700,
                                color: "var(--accent-blue)",
                              }}
                            >
                              {team.shortName}
                            </span>
                            {team.phone && (
                              <>
                                <span>•</span>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  <Phone
                                    size={11}
                                    color="var(--accent-green)"
                                  />
                                  {team.phone}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="action-group">
                          <GridSelectCheckbox
                            checked={selectedIds.includes(team._id)}
                            onChange={() => toggleSelectOne(team._id)}
                            title={`Select ${team.name}`}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            isIconOnly
                            onClick={() => handleEditOpen(team)}
                            title="Edit Team"
                            icon={
                              <Pencil size={14} color="var(--accent-blue)" />
                            }
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            isIconOnly
                            onClick={() => handleDelete(team._id, team.name)}
                            title="Delete Team"
                            icon={<Trash2 size={14} />}
                          />
                        </div>
                      </CardHeader>

                      <CardContent>
                        {team.description && (
                          <p
                            style={{
                              fontSize: "12.5px",
                              color: "var(--text-muted)",
                              marginBottom: "16px",
                            }}
                          >
                            {team.description}
                          </p>
                        )}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "10px",
                            padding: "12px",
                            background: "#f8fafc",
                            borderRadius: "10px",
                            border: "1px solid var(--border-color)",
                            textAlign: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                textTransform: "uppercase",
                              }}
                            >
                              Players
                            </div>
                            <div
                              style={{
                                fontSize: "17px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                              }}
                            >
                              {team.playerCount || 0}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                textTransform: "uppercase",
                              }}
                            >
                              Matches
                            </div>
                            <div
                              style={{
                                fontSize: "17px",
                                fontWeight: 800,
                                color: "var(--accent-blue)",
                              }}
                            >
                              {team.matchCount || 0}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                textTransform: "uppercase",
                              }}
                            >
                              Leagues
                            </div>
                            <div
                              style={{
                                fontSize: "17px",
                                fontWeight: 800,
                                color: "var(--accent-green)",
                              }}
                            >
                              {team.tournamentCount || 0}
                            </div>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter style={{ justifyContent: "space-between" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Plus size={13} color="var(--accent-green)" />}
                          onClick={() => setManagingSquadTeam(team)}
                        >
                          <span>Add Players</span>
                        </Button>
                        <Link href={`/teams/${team._id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye size={12} color="var(--accent-blue)" />}
                          >
                            <span>Team Profile & Squad</span>
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTeams.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemName="Teams"
            />
          </div>
        )}

        {/* Modal: Create Team */}
        <CreateTeamModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={invalidateTeams}
        />

        {/* Modal: Edit Team */}
        <EditTeamModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingTeam(null);
          }}
          team={editingTeam}
          onSuccess={invalidateTeams}
        />

        {/* Modal: Add / Manage Team Players */}
        <ManageTeamPlayersModal
          isOpen={!!managingSquadTeam}
          onClose={() => setManagingSquadTeam(null)}
          team={managingSquadTeam}
          onSuccess={invalidateTeams}
        />
      </div>
    </>
  );
}
