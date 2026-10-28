export interface Team {
  _id: string;
  name: string;
  shortName: string;
  teamType?: 'my_team' | 'opponent' | string;
  phone?: string;
  city?: string;
  primaryColor?: string;
  description?: string;
  playersCount?: number;
  matchesCount?: number;
  stats?: {
    totalMatches?: number;
    matchesWon?: number;
    matchesLost?: number;
    matchesTied?: number;
    winRate?: number;
  };
  players?: any[];
  matches?: any[];
  tournaments?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeamFormValues {
  name: string;
  shortName: string;
  teamType: string;
  phone: string;
  city: string;
  primaryColor: string;
  description: string;
}

export interface EditTeamFormValues {
  name: string;
  shortName: string;
  teamType: string;
  phone: string;
  city: string;
  primaryColor: string;
  description: string;
}
