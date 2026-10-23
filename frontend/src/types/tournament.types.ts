import { TournamentFormat, TournamentStatus } from '../constants';

export interface Tournament {
  _id: string;
  name: string;
  format: TournamentFormat | string;
  venue?: string;
  organizer?: string;
  entryFee?: number;
  expectedWinningPrize?: number;
  actualWinningPrizeWon?: number;
  status?: TournamentStatus | string;
  notes?: string;
  matchesCount?: number;
  totalExpense?: number;
  matches?: any[];
  expenses?: any[];
  sponsors?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTournamentFormValues {
  teamId: string;
  name: string;
  format: string;
  venue: string;
  entryFee: number | '';
  expectedWinningPrize: number | '';
  actualWinningPrizeWon: number | '';
  status: string;
  notes: string;
}

export interface EditTournamentFormValues {
  name: string;
  format: string;
  venue: string;
  entryFee: number | '';
  expectedWinningPrize: number | '';
  actualWinningPrizeWon: number | '';
  status: string;
  notes: string;
}
