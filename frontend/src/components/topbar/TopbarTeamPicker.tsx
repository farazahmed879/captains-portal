import React from "react";
import { CustomSelect } from "../ui";

export interface TopbarTeamPickerProps {
  selectedTeamId?: string;
  onTeamChange: (teamId: string) => void;
  teams: any[];
  isSuperAdmin: boolean;
}

export const TopbarTeamPicker: React.FC<TopbarTeamPickerProps> = ({
  selectedTeamId,
  onTeamChange,
  teams,
  isSuperAdmin,
}) => {
  const teamOptions = [
    ...(isSuperAdmin ? [{ value: "", label: "All Teams (Global)" }] : []),
    ...(teams.length === 0 && !isSuperAdmin
      ? [{ value: "", label: "No Team Assigned", disabled: true }]
      : teams.map((t) => {
          const tid = t.id || t._id;
          return { value: tid, label: t.name };
        })),
  ];

  return (
    <div
      className="topbar-team-picker"
      style={{ minWidth: "180px", maxWidth: "230px" }}
      title={
        isSuperAdmin
          ? "Global Team Selector (Super Admin)"
          : "Your Assigned Team"
      }
    >
      <CustomSelect
        size="sm"
        value={selectedTeamId || ""}
        onChange={(e) => onTeamChange(e.target.value)}
        options={teamOptions}
        placeholder="Select Team"
      />
    </div>
  );
};
