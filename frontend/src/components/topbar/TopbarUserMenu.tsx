import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, LogIn } from 'lucide-react';
import { Button, Avatar } from '../ui';

export interface TopbarUserMenuProps {
  isAuthenticated: boolean;
  user: any;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const TopbarUserMenu: React.FC<TopbarUserMenuProps> = ({
  isAuthenticated,
  user,
  onOpenProfile,
  onLogout,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated) {
    return (
      <Button
        variant="secondary"
        size="sm"
        id="header-login-btn"
        onClick={() => router.push('/login')}
        icon={<LogIn size={13} />}
        style={{ fontWeight: 700 }}
      >
        <span>Sign In</span>
      </Button>
    );
  }

  return (
    <div className="header-user-pill">
      {/* User Profile Button Trigger */}
      <button
        type="button"
        className="header-user-btn"
        onClick={onOpenProfile}
        title="Click to view your profile"
        id="header-user-profile-btn"
      >
        <Avatar
          name={user?.name || 'Captain'}
          size="sm"
          className="header-user-avatar"
        />
        <div className="header-user-meta">
          <span className="header-user-name">{user?.name || 'Faraz (Captain)'}</span>
          <span className="header-user-role">
            {user?.role?.replace('_', ' ') || 'Super Admin'}
          </span>
        </div>
      </button>

      {/* Logout Action Button */}
      <Button
        variant="secondary"
        size="sm"
        id="header-logout-btn"
        onClick={onLogout}
        className="header-logout-btn"
        title="Log out of Captains Portal"
        aria-label="Logout"
        icon={<LogOut size={13} />}
      >
        <span className="btn-label">Logout</span>
      </Button>
    </div>
  );
};
