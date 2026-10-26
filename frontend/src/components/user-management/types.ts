export interface ManagedUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'captain' | 'treasurer' | 'viewer';
  roleLabel: string;
  isCaptain: boolean;
  isPlayer: boolean;
  isActive: boolean;
  tenant?: { id: string; name: string };
  player?: {
    _id: string;
    name: string;
    jerseyNumber?: number;
    role?: string;
    battingStyle?: string;
    bowlingStyle?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserCounts {
  total: number;
  superAdmins: number;
  admins?: number;
  captains: number;
  normalPlayers: number;
  treasurers: number;
}

export interface UsersApiResponse {
  success: boolean;
  users: ManagedUser[];
  counts: UserCounts;
}

export type RoleFilterType = 'all' | 'admins' | 'captains' | 'players' | 'super_admins' | 'treasurers';

export interface ActionFeedback {
  type: 'success' | 'error';
  message: string;
}
