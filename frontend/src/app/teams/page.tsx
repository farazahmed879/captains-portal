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
} from "../../components/ui";
import { fetchApi } from "../../lib/api";
import { confirmDelete, showToast } from "../../lib/alerts";
import {
  Plus,
  MapPin,
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

export default function TeamsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>("/teams"),
  });

  const teams = teamsQuery.data?.teams || [];
  const loading = teamsQuery.isLoading;

  const invalidateTeams = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.teams() });
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

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.city || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredTeams.length / pageSize) || 1;
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <>
      <Header
        title="My Teams & Squad Management"
        subtitle="Manage Separate Club Teams (Hard Ball, Tape Ball) with Edit & Delete Options"
      />

      <div className="content-body">
        {/* Filter and View Switcher Bar */}
        <div className="filter-bar">
          <div style={{ position: "relative", width: "280px" }}>
            <Input
              type="text"
              placeholder="Search team name, code, or city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: "12px", fontSize: "13px", margin: 0 }}
            />
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

        {/* VIEW 1: TABLE (LIST) VIEW */}
        {viewMode === "table" && (
          <div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <DataTable
                data={paginatedTeams}
                keyExtractor={(team: any) => team._id}
                emptyMessage="No teams found matching search."
                emptyIcon={<Shield size={28} />}
                onRowClick={(team: any) => router.push(`/teams/${team._id}`)}
                columns={[
                  {
                    header: "Code",
                    width: "10%",
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
                    width: "26%",
                    render: (team: any) => (
                      <div>
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
                          <ExternalLink size={11} color="var(--accent-blue)" />
                        </Link>
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
                    ),
                  },
                  {
                    header: "City / Base",
                    width: "16%",
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
                    width: "14%",
                    style: { fontWeight: 600 },
                    render: (team: any) => `${team.playerCount || 0} Players`,
                  },
                  {
                    header: "Matches Played",
                    width: "14%",
                    style: { fontWeight: 600, color: "var(--accent-blue)" },
                    render: (team: any) => `${team.matchCount || 0} Matches`,
                  },
                  {
                    header: "Tournaments",
                    width: "12%",
                    style: { fontWeight: 600, color: "var(--accent-green)" },
                    render: (team: any) =>
                      `${team.tournamentCount || 0} Leagues`,
                  },
                  {
                    header: "Actions",
                    width: "8%",
                    align: "right",
                    render: (team: any) => (
                      <div
                        className="action-group"
                        style={{ justifyContent: "flex-end" }}
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          isIconOnly
                          onClick={() => handleEditOpen(team)}
                          title="Edit Team"
                          icon={<Pencil size={14} color="var(--accent-blue)" />}
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
                {paginatedTeams.map((team) => (
                <Card
                  key={team._id}
                  style={{
                    borderTop: `4px solid ${team.primaryColor || "#0284c7"}`,
                  }}
                >
                  <CardHeader>
                    <div>
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
                        <ExternalLink size={12} color="var(--accent-blue)" />
                      </Link>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
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
                      </div>
                    </div>

                    <div className="action-group">
                      <Button
                        variant="secondary"
                        size="sm"
                        isIconOnly
                        onClick={() => handleEditOpen(team)}
                        title="Edit Team"
                        icon={<Pencil size={14} color="var(--accent-blue)" />}
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

                  <CardFooter style={{ justifyContent: "flex-end" }}>
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
              ))}
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
      </div>
    </>
  );
}
