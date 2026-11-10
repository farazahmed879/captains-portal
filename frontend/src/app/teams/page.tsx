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
  Modal,
  ViewSwitcher,
  DataTable,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Pagination,
  CardGridSkeleton,
  BulkActionBar,
  GridSelectCheckbox,
  ListToolbar,
} from "../../components/ui";
import { fetchApi } from "../../lib/api";

import { confirmDelete, confirmBulkDelete, showToast } from "../../lib/alerts";
import {
  Search,
  Pencil,
  Trash2,
  Shield,
} from "../../components/icons";
import { CreateTeamModal } from "../../components/CreateTeamModal";
import { EditTeamModal } from "../../components/EditTeamModal";
import { ManageTeamPlayersModal } from "../../components/ManageTeamPlayersModal";
import { useIsMobile } from "../../lib/useMediaQuery";
import { EMPTY_VALUE } from "../../constants";
import { getTeamColumns } from "../../columns/teamColumns";
import { usePageSize } from "../../lib/usePageSize";

type TeamFilterTab = "my_team" | "all" | "opponent";

export default function TeamsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [managingSquadTeam, setManagingSquadTeam] = useState<any>(null);
  const [preferredView, setViewMode] = useState<"grid" | "table">("table");
  // Phones always show the list; the List/Grid switch is hidden there (globals.css).
  const isMobile = useIsMobile();
  const viewMode = isMobile ? "table" : preferredView;
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
  const [pageSize, setPageSize] = usePageSize('teams');

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
        <ListToolbar
          tabs={{
            value: teamFilter,
            onChange: (value) => {
              setTeamFilter(value);
              setCurrentPage(1);
              setSelectedIds([]);
            },
            tabs: [
              { value: 'my_team', label: 'My Teams', count: myTeamsCount },
              { value: 'opponent', label: 'Opponent Teams', count: opponentTeamsCount },
              { value: 'all', label: 'All Teams', count: teams.length },
            ],
          }}
          search={{
            placeholder: 'Search team name, code, phone...',
            value: searchQuery,
            onChange: (value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            },
          }}
          view={{ value: viewMode, onChange: setViewMode }}
          add={{ label: 'Add Team', onClick: () => setIsModalOpen(true) }}
        />

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
                serialStartIndex={(currentPage - 1) * pageSize}
                columns={getTeamColumns({ getTeamType, hasPlayedAgainstMyTeam, setManagingSquadTeam, handleEditOpen, handleDelete })}
              />
            </Card>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTeams.length}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
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
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span>{team.name}</span>
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
                            <span>{team.city || EMPTY_VALUE}</span>
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
                                fontWeight: 700,
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
                                fontWeight: 700,
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
                                fontWeight: 700,
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
                          onClick={() => setManagingSquadTeam(team)}
                        >
                          <span>Add Players</span>
                        </Button>
                        <Link href={`/teams/${team._id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
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
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
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
