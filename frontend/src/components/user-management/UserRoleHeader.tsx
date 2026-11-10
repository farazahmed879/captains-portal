import React from "react";
import { Button } from "../ui";

export interface UserRoleHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAddModal: () => void;
}

export const UserRoleHeader: React.FC<UserRoleHeaderProps> = ({
  isLoading,
  onRefresh,
  onOpenAddModal,
}) => {
  return (
    <div className="admin-mgmt-header">
      <div className="admin-mgmt-title-block">
        <h2 className="admin-mgmt-title">User Roster & Role Management</h2>
      </div>

      <div className="admin-mgmt-actions-row">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          title="Refresh user list"
        >
          <span>Refresh</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenAddModal}
          style={{ fontWeight: 600 }}
        >
          <span>Add / Invite User</span>
        </Button>
      </div>
    </div>
  );
};
