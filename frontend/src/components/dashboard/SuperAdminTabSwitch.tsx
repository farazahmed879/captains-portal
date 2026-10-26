import React from "react";
import { Button } from "../ui";
import { LayoutDashboardIcon, ShieldIcon, UsersIcon } from "../icons";

export interface SuperAdminTabSwitchProps {
  adminTab: "overview" | "users";
  onTabChange: (tab: "overview" | "users") => void;
}

export const SuperAdminTabSwitch: React.FC<SuperAdminTabSwitchProps> = ({
  adminTab,
  onTabChange,
}) => {
  return (
    <div className="superadmin-dash-switch-bar">
      <div className="superadmin-dash-switch-pills">
        <Button
          id="tab-command-overview"
          className={`superadmin-tab-btn ${adminTab === "overview" ? "active" : ""}`}
          onClick={() => onTabChange("overview")}
        >
          <span>Dashboard</span>
        </Button>

        <Button
          id="tab-user-role-management"
          className={`superadmin-tab-btn ${adminTab === "users" ? "active" : ""}`}
          onClick={() => onTabChange("users")}
        >
          <span>Users & Role Management</span>
        </Button>
      </div>
    </div>
  );
};
